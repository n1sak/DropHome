/**
 * Roomy server.
 *
 * Deliberately small: files go on disk, everything else is one JSON file.
 *   data/db.json        house layout, file records, share tokens
 *   data/blobs/<uuid>   file contents
 *   data/thumbs/<uuid>  photo thumbnails
 *   data/art/<uuid>     custom room and furniture art
 *
 * The client decides where a file lives in the house. The server only stores
 * what it is told, serves it back, hands out share links, accepts drops into
 * the mailbox, tells other open windows when something changed, and (if an
 * API key is set) relays sorting prompts to Claude.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import { complete, hasAi } from './ai.js';
import { Db } from './db.js';
import { dropPage, sharePage } from './pages.js';

const here = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(here, '.env'));

const PORT = Number(process.env.PORT ?? 8787);
const DATA_DIR = path.resolve(here, process.env.DATA_DIR ?? './data');
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_MB ?? 250) * 1024 * 1024;
const CLIENT_DIST = path.resolve(here, '../client/dist');

const dirs = { blobs: path.join(DATA_DIR, 'blobs'), thumbs: path.join(DATA_DIR, 'thumbs'), art: path.join(DATA_DIR, 'art'), tmp: path.join(DATA_DIR, 'tmp') };
for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true });

const db = new Db(path.join(DATA_DIR, 'db.json'));
const upload = multer({ dest: dirs.tmp, limits: { fileSize: MAX_UPLOAD, files: 40 } });
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));

/* ---------- live sync (server-sent events) ---------- */

const listeners = new Set();
function changed(req, what) {
  const data = JSON.stringify({ what, origin: req?.get?.('x-client-id') ?? null, at: Date.now() });
  for (const res of listeners) res.write(`event: change\ndata: ${data}\n\n`);
}

app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  listeners.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    listeners.delete(res);
  });
});

/* ---------- helpers ---------- */

const PATCHABLE = new Set(['name', 'ext', 'kind', 'roomId', 'furnitureId', 'touchedAt', 'pinned', 'trashed', 'shared', 'tags', 'reason', 'snippet']);
const KIND_BY_EXT = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', heic: 'image', svg: 'image',
  pdf: 'pdf', doc: 'doc', docx: 'doc', md: 'note', txt: 'note', csv: 'sheet', xlsx: 'sheet', xls: 'sheet', ppt: 'slides', pptx: 'slides', key: 'slides',
  js: 'code', ts: 'code', py: 'code', ipynb: 'code', java: 'code', c: 'code', cpp: 'code', html: 'code', css: 'code', json: 'code', tex: 'code', sh: 'code',
  mp3: 'audio', wav: 'audio', m4a: 'audio', mp4: 'video', mov: 'video', webm: 'video', zip: 'archive', tar: 'archive', gz: 'archive',
};

const origin = (req) => `${req.protocol}://${req.get('host')}`;
const token = (bytes = 9) => crypto.randomBytes(bytes).toString('base64url');
const safeId = (id) => (typeof id === 'string' && /^[\w-]{1,80}$/.test(id) ? id : null);

/** What the client sees: the record without server-only fields, plus a thumbnail URL. */
function publicFile(rec) {
  const { _blob, _thumb, ...file } = rec;
  if (_thumb) file.thumbUrl = `/api/files/${file.id}/thumb`;
  return file;
}

async function storeThumb(dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/s.exec(dataUrl ?? '');
  if (!m) return null;
  const name = crypto.randomUUID();
  await fsp.writeFile(path.join(dirs.thumbs, name), Buffer.from(m[2], 'base64'));
  return name;
}

async function removeBlobs(rec) {
  await fsp.rm(path.join(dirs.blobs, rec._blob), { force: true });
  if (rec._thumb) await fsp.rm(path.join(dirs.thumbs, rec._thumb), { force: true });
}

function sendStored(res, dir, name, mime, downloadName) {
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'The contents of this file are missing.' });
  res.type(mime || 'application/octet-stream');
  // never let an uploaded HTML or SVG file run scripts on this origin
  res.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox");
  res.set('X-Content-Type-Options', 'nosniff');
  if (downloadName) res.attachment(downloadName);
  res.sendFile(file);
}

/* ---------- state ---------- */

app.get('/api/health', (_req, res) => res.json({ ok: true, ai: hasAi(), files: Object.keys(db.data.files).length }));

app.get('/api/state', (_req, res) => {
  res.json({ house: db.data.house, files: Object.values(db.data.files).map(publicFile) });
});

app.put('/api/house', (req, res) => {
  const house = req.body;
  if (!house || house.format !== 'roomy.house/1' || !Array.isArray(house.rooms)) return res.status(400).json({ error: 'That is not a roomy.house/1 document.' });
  db.data.house = house;
  db.save();
  changed(req, 'house');
  res.json({ ok: true });
});

/* ---------- files ---------- */

app.post('/api/files', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file was sent.' });
  let meta;
  try {
    meta = JSON.parse(req.body.meta ?? '{}');
  } catch {
    meta = {};
  }
  const id = safeId(meta.id) && !db.data.files[meta.id] ? meta.id : `f-${token(8)}`;
  const blob = crypto.randomUUID();
  await fsp.rename(req.file.path, path.join(dirs.blobs, blob));
  const { thumb, thumbUrl: _ignored, ...rest } = meta;
  const rec = {
    tags: [],
    pinned: false,
    ...rest,
    id,
    name: String(meta.name ?? req.file.originalname ?? 'untitled').slice(0, 240),
    size: req.file.size,
    mime: meta.mime || req.file.mimetype || 'application/octet-stream',
    _blob: blob,
    _thumb: await storeThumb(thumb),
  };
  db.data.files[id] = rec;
  db.save();
  changed(req, 'files');
  res.status(201).json({ file: publicFile(rec) });
});

app.patch('/api/files', (req, res) => {
  const patches = Array.isArray(req.body?.patches) ? req.body.patches : [];
  let n = 0;
  for (const { id, patch } of patches) {
    const rec = db.data.files[id];
    if (!rec || !patch || typeof patch !== 'object') continue;
    for (const [k, v] of Object.entries(patch)) {
      if (!PATCHABLE.has(k)) continue;
      if (v === null || v === undefined) delete rec[k];
      else rec[k] = v;
    }
    if (patch.shared === null) for (const [t, fid] of Object.entries(db.data.shares)) if (fid === id) delete db.data.shares[t];
    n += 1;
  }
  if (n) {
    db.save();
    changed(req, 'files');
  }
  res.json({ ok: true, patched: n });
});

app.delete('/api/files/:id', async (req, res) => {
  const rec = db.data.files[req.params.id];
  if (!rec) return res.json({ ok: true });
  delete db.data.files[rec.id];
  for (const [t, fid] of Object.entries(db.data.shares)) if (fid === rec.id) delete db.data.shares[t];
  db.save();
  await removeBlobs(rec);
  changed(req, 'files');
  res.json({ ok: true });
});

app.get('/api/files/:id/content', (req, res) => {
  const rec = db.data.files[req.params.id];
  if (!rec) return res.status(404).json({ error: 'No such file.' });
  sendStored(res, dirs.blobs, rec._blob, rec.mime, req.query.download ? rec.name : undefined);
});

app.get('/api/files/:id/thumb', (req, res) => {
  const rec = db.data.files[req.params.id];
  if (!rec?._thumb) return res.status(404).end();
  res.set('Cache-Control', 'private, max-age=86400');
  sendStored(res, dirs.thumbs, rec._thumb, 'image/jpeg');
});

/* ---------- share links ---------- */

app.post('/api/files/:id/share', (req, res) => {
  const rec = db.data.files[req.params.id];
  if (!rec) return res.status(404).json({ error: 'No such file.' });
  const t = rec.shared?.token && db.data.shares[rec.shared.token] === rec.id ? rec.shared.token : token(12);
  db.data.shares[t] = rec.id;
  rec.shared = { token: t, at: Date.now(), url: `${origin(req)}/share/${t}` };
  db.save();
  changed(req, 'files');
  res.json({ token: t, url: rec.shared.url });
});

app.delete('/api/files/:id/share', (req, res) => {
  const rec = db.data.files[req.params.id];
  if (rec?.shared) {
    delete db.data.shares[rec.shared.token];
    delete rec.shared;
    db.save();
    changed(req, 'files');
  }
  res.json({ ok: true });
});

function sharedFile(req) {
  const rec = db.data.files[db.data.shares[req.params.token]];
  return rec && !rec.trashed ? rec : null;
}

app.get('/share/:token', (req, res) => {
  const rec = sharedFile(req);
  if (!rec) return res.status(404).type('html').send(sharePage(null));
  res.type('html').send(sharePage({ name: rec.name, size: rec.size, kind: rec.kind, token: req.params.token, house: db.data.house?.name }));
});

app.get('/share/:token/file', (req, res) => {
  const rec = sharedFile(req);
  if (!rec) return res.status(404).end();
  sendStored(res, dirs.blobs, rec._blob, rec.mime, req.query.download ? rec.name : undefined);
});

/* ---------- the mailbox: a link other people can drop files into ---------- */

app.get('/api/drop-link', (req, res) => {
  if (!db.data.dropToken) {
    db.data.dropToken = token(10);
    db.save();
  }
  res.json({ url: `${origin(req)}/drop/${db.data.dropToken}` });
});

app.get('/drop/:token', (req, res) => {
  const ok = req.params.token === db.data.dropToken;
  res.status(ok ? 200 : 404).type('html').send(dropPage(ok ? { house: db.data.house?.name ?? 'this house', token: req.params.token } : null));
});

app.post('/drop/:token', upload.array('files', 20), async (req, res) => {
  if (req.params.token !== db.data.dropToken) return res.status(404).json({ error: 'This drop link is no longer active.' });
  const from = String(req.body.from ?? '').trim().slice(0, 40);
  const now = Date.now();
  const added = [];
  for (const f of req.files ?? []) {
    const name = Buffer.from(f.originalname, 'latin1').toString('utf8').slice(0, 240);
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    const id = `f-${token(8)}`;
    const blob = crypto.randomUUID();
    await fsp.rename(f.path, path.join(dirs.blobs, blob));
    db.data.files[id] = {
      id, name, ext, mime: f.mimetype, size: f.size, kind: KIND_BY_EXT[ext] ?? (f.mimetype.startsWith('image/') ? 'image' : 'other'),
      roomId: 'yard', furnitureId: 'yard-mailbox', addedAt: now, modifiedAt: now, touchedAt: now, pinned: false,
      tags: from ? [`from ${from}`] : ['shared with me'], reason: from ? `Sent by ${from}` : 'Dropped into your mailbox', _blob: blob, _thumb: null,
    };
    added.push(name);
  }
  db.save();
  changed(req, 'files');
  res.json({ ok: true, added });
});

/* ---------- custom art ---------- */

app.post('/api/art', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image was sent.' });
  if (!/^image\//.test(req.file.mimetype)) {
    await fsp.rm(req.file.path, { force: true });
    return res.status(415).json({ error: 'Art must be an image.' });
  }
  const id = crypto.randomUUID();
  await fsp.rename(req.file.path, path.join(dirs.art, id));
  db.data.art[id] = { mime: req.file.mimetype };
  db.save();
  res.status(201).json({ ref: `art:${id}` });
});

app.get('/api/art/:id', (req, res) => {
  const meta = db.data.art[req.params.id];
  if (!meta) return res.status(404).end();
  res.set('Cache-Control', 'private, max-age=31536000, immutable');
  sendStored(res, dirs.art, req.params.id, meta.mime);
});

/* ---------- sorting with Claude (optional) ---------- */

app.post('/api/ai/complete', async (req, res) => {
  if (!hasAi()) return res.status(501).json({ error: 'No ANTHROPIC_API_KEY set. The client will use its built-in rules.' });
  const prompt = String(req.body?.prompt ?? '');
  if (!prompt || prompt.length > 120_000) return res.status(400).json({ error: 'Prompt missing or too long.' });
  try {
    res.json({ text: await complete(prompt) });
  } catch (e) {
    res.status(502).json({ error: String(e?.message ?? e) });
  }
});

/* ---------- reset ---------- */

app.post('/api/reset', async (req, res) => {
  for (const d of [dirs.blobs, dirs.thumbs, dirs.art]) {
    await fsp.rm(d, { recursive: true, force: true });
    await fsp.mkdir(d, { recursive: true });
  }
  db.reset();
  changed(req, 'reset');
  res.json({ ok: true });
});

/* ---------- the built client, when there is one ---------- */

if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api\/|share\/|drop\/).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use((err, _req, res, _next) => {
  const tooBig = err?.code === 'LIMIT_FILE_SIZE';
  res.status(tooBig ? 413 : 500).json({ error: tooBig ? `That file is over the ${process.env.MAX_UPLOAD_MB ?? 250} MB limit.` : 'Something went wrong on the server.' });
  if (!tooBig) console.error(err);
});

app.listen(PORT, () => {
  console.log(`Roomy server on http://localhost:${PORT}`);
  console.log(`  data: ${DATA_DIR}`);
  console.log(`  sorting: ${hasAi() ? 'Claude' : 'built-in rules (set ANTHROPIC_API_KEY to use Claude)'}`);
  if (!fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) console.log('  client: not built yet. Run "npm run dev" from the repo root, or "npm run build" first.');
});

/** Minimal .env reader so there is one less dependency. */
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
