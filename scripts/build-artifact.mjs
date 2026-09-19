/**
 * Builds the front end as ONE self-contained HTML fragment: all JS, CSS and
 * fonts inline, no server needed. This is what gets published as the playable
 * demo (it stores everything in the viewer's own browser).
 *
 *   node scripts/build-artifact.mjs   ->   artifact/roomy.html
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(root, 'client');
const dist = path.join(client, 'dist-artifact');

execSync('npx vite build --mode artifact', { cwd: client, stdio: 'inherit' });

const js = fs.readFileSync(path.join(dist, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(dist, 'app.css'), 'utf8');

/* Hand-drawn art: the published page can not fetch files, so inline every image the manifest mentions. */
const artDir = path.join(client, 'public', 'art');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif' };
const inline = (ref) => {
  if (typeof ref !== 'string' || /^(data:|https?:|art:)/.test(ref)) return ref;
  const file = path.join(artDir, ref);
  if (!fs.existsSync(file)) {
    console.warn(`  art not found, skipped: ${ref}`);
    return undefined;
  }
  return `data:${MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream'};base64,${fs.readFileSync(file).toString('base64')}`;
};
let artScript = '';
const manifestFile = path.join(artDir, 'manifest.json');
if (fs.existsSync(manifestFile)) {
  const m = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (m.shell) m.shell = inline(m.shell);
  for (const room of Object.values(m.rooms ?? {})) if (room.background) room.background = inline(room.background);
  for (const piece of Object.values(m.furniture ?? {})) {
    if (piece.closed) piece.closed = inline(piece.closed);
    if (piece.open) piece.open = inline(piece.open);
    if (piece.frames) piece.frames = piece.frames.map(inline).filter(Boolean);
    if (piece.parts) piece.parts = piece.parts.map((part) => ({ ...part, src: inline(part.src) })).filter((part) => part.src);
  }
  artScript = `<script>window.__ROOMY_ART__=${JSON.stringify(m).replace(/<\//g, '<\\/')};</script>`;
  console.log('  inlined art/manifest.json');
}

const html = [
  '<title>Roomy</title>',
  `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`,
  '<div id="root"></div>',
  artScript,
  // a closing script tag inside a string literal would end the inline script early
  `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`,
  '',
].join('\n');

fs.mkdirSync(path.join(root, 'artifact'), { recursive: true });
const out = path.join(root, 'artifact', 'roomy.html');
fs.writeFileSync(out, html);
console.log(`\n${path.relative(root, out)}  ${(html.length / 1024).toFixed(0)} KB`);
