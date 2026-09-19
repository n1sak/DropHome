/**
 * Draws tracing templates for hand-drawn art: one SVG per room of the standard
 * house with the floor line and a labelled box for every piece of furniture,
 * plus one for the whole lot. Open them in any drawing app as a bottom layer.
 *
 *   npm run art:templates   ->   docs/art-templates/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultHouse } from '../client/src/model/defaultHouse';
import { atticOutline, furnitureRect, geometry, roomRect, yardRect } from '../client/src/model/layout';

const SCALE = 4; // drawing pixels per lot pixel: a room comes out at 1600 x 1000
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/art-templates');
fs.mkdirSync(path.join(out, 'rooms'), { recursive: true });

const house = defaultHouse('Template');
const geo = geometry(house);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rows: string[] = [];

for (const room of house.rooms) {
  const r = roomRect(geo, room);
  const W = Math.round(r.w * SCALE);
  const H = Math.round(r.h * SCALE);
  const attic = room.floor === 'attic';
  const floorY = H * (attic ? 0.88 : 0.8);
  let body = `<rect width="${W}" height="${H}" fill="#f6f4ee"/>`;
  if (attic) body += `<polygon points="${atticOutline(geo).map(([x, y]) => `${(x / 100) * W},${(y / 100) * H}`).join(' ')}" fill="#ffffff" stroke="#c0392b" stroke-width="4" stroke-dasharray="18 10"/>`;
  body += `<line x1="0" y1="${floorY}" x2="${W}" y2="${floorY}" stroke="#2b50d6" stroke-width="3" stroke-dasharray="14 10"/>`;
  body += `<text x="16" y="${floorY - 12}" font-family="sans-serif" font-size="26" fill="#2b50d6">floor line</text>`;
  for (const f of room.furniture) {
    const fr = furnitureRect(geo, room, f);
    const x = (fr.x - r.x) * SCALE;
    const y = (fr.y - r.y) * SCALE;
    const w = Math.round(fr.w * SCALE);
    const h = Math.round(fr.h * SCALE);
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(255,180,0,.12)" stroke="#e08a00" stroke-width="3" stroke-dasharray="12 8"/>`;
    body += `<text x="${x + 10}" y="${y + 34}" font-family="sans-serif" font-size="28" font-weight="700" fill="#7a4a00">${esc(f.name)}</text>`;
    body += `<text x="${x + 10}" y="${y + 66}" font-family="monospace" font-size="22" fill="#7a4a00">${f.id} · ${w} × ${h}</text>`;
    rows.push(`| ${room.name} | ${f.name} | \`${f.id}\` | \`${f.kind}\` | ${w} × ${h} |`);
  }
  body += `<text x="${W - 16}" y="40" text-anchor="end" font-family="sans-serif" font-size="30" font-weight="700" fill="#555">${esc(room.name)} · ${W} × ${H}</text>`;
  fs.writeFileSync(path.join(out, 'rooms', `${room.id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>\n`);
}

/* the whole lot, at 2x */
const K = 2;
const LW = geo.lot.w * K;
const LH = geo.lot.h * K;
let lot = `<rect width="${LW}" height="${LH}" fill="#eef4fa"/>`;
lot += `<rect x="0" y="${geo.groundY * K}" width="${LW}" height="${LH - geo.groundY * K}" fill="#e6dccf"/>`;
lot += `<line x1="0" y1="${geo.groundY * K}" x2="${LW}" y2="${geo.groundY * K}" stroke="#2f7d57" stroke-width="4"/>`;
lot += `<text x="16" y="${geo.groundY * K - 12}" font-family="sans-serif" font-size="26" fill="#2f7d57">ground line</text>`;
lot += `<polygon points="${geo.roof.apex.x * K},${geo.roof.apex.y * K} ${geo.roof.right.x * K},${geo.roof.right.y * K} ${geo.roof.left.x * K},${geo.roof.left.y * K}" fill="none" stroke="#555" stroke-width="4"/>`;
lot += `<rect x="${geo.body.x * K}" y="${geo.body.y * K}" width="${geo.body.w * K}" height="${geo.body.h * K}" fill="none" stroke="#555" stroke-width="4"/>`;
for (const room of house.rooms) {
  const r = roomRect(geo, room);
  lot += `<rect x="${r.x * K}" y="${r.y * K}" width="${r.w * K}" height="${r.h * K}" fill="rgba(43,80,214,.08)" stroke="#2b50d6" stroke-width="3" stroke-dasharray="12 8"/>`;
  lot += `<text x="${(r.x + r.w / 2) * K}" y="${(r.y + r.h / 2) * K}" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#2b50d6">${esc(room.name)}</text>`;
}
for (const f of house.yard) {
  const r = yardRect(geo, f);
  lot += `<rect x="${r.x * K}" y="${r.y * K}" width="${r.w * K}" height="${r.h * K}" fill="rgba(255,180,0,.12)" stroke="#e08a00" stroke-width="3" stroke-dasharray="12 8"/>`;
  lot += `<text x="${(r.x + r.w / 2) * K}" y="${r.y * K - 10}" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#7a4a00">${esc(f.name)} · ${Math.round(r.w * SCALE)} × ${Math.round(r.h * SCALE)}</text>`;
  rows.push(`| Yard | ${f.name} | \`${f.id}\` | \`${f.kind}\` | ${Math.round(r.w * SCALE)} × ${Math.round(r.h * SCALE)} |`);
}
lot += `<text x="${LW - 16}" y="40" text-anchor="end" font-family="sans-serif" font-size="30" font-weight="700" fill="#555">Whole lot · ${LW} × ${LH} (rooms are drawn separately and sit in the blue boxes)</text>`;
fs.writeFileSync(path.join(out, 'lot.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LW} ${LH}" width="${LW}" height="${LH}">${lot}</svg>\n`);

const table = ['| Room | Piece | id | kind | Canvas (px) |', '|---|---|---|---|---|', ...rows].join('\n');
fs.writeFileSync(path.join(out, 'sizes.md'), `# Canvas sizes for the standard house\n\nAt 4 drawing pixels per lot pixel. Regular rooms are 1600 × 1000, the attic is ${Math.round(840 * SCALE)} × ${Math.round(232 * SCALE)}.\n\n${table}\n`);
console.log(`wrote ${house.rooms.length} room templates, lot.svg and sizes.md to docs/art-templates`);
