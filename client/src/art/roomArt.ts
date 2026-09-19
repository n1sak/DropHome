/**
 * Placeholder room backgrounds: wall, floor, a window and a little decor.
 * Furniture is NOT drawn here; it is layered on top so it can open and move.
 * A hand-drawn background (room.background, or art/manifest.json) replaces
 * the whole thing.
 */
import type { RoomKind } from '../model/types';
import { Pen, rng, shade, type P } from './sketch';

const FLOOR_AT = 0.8;

const FLOORS: Record<RoomKind, { fill: string; style: 'planks' | 'tiles' | 'concrete' | 'carpet' }> = {
  attic: { fill: '#B98F5E', style: 'planks' },
  study: { fill: '#C79A66', style: 'planks' },
  bedroom: { fill: '#D9C2A8', style: 'carpet' },
  bathroom: { fill: '#E8EEF0', style: 'tiles' },
  kitchen: { fill: '#EFE3CB', style: 'tiles' },
  hall: { fill: '#B98A5A', style: 'planks' },
  living: { fill: '#C49A6C', style: 'planks' },
  workshop: { fill: '#B9BEC7', style: 'concrete' },
  den: { fill: '#7F6F98', style: 'carpet' },
  cellar: { fill: '#9C968E', style: 'concrete' },
  office: { fill: '#B58D62', style: 'planks' },
  studio: { fill: '#D8C9B4', style: 'planks' },
  library: { fill: '#8F6A48', style: 'planks' },
  greenhouse: { fill: '#C9B79E', style: 'tiles' },
};

function windowAt(p: Pen, x: number, y: number, w: number, h: number, curtains?: string) {
  p.rect(x - 4, y - 4, w + 8, h + 8, { fill: '#FBFAF6' });
  p.rect(x, y, w, h, { fill: 'var(--glass)', strokeWidth: 1.2 });
  p.line(x + w / 2, y, x + w / 2, y + h, { strokeWidth: 2.4, stroke: '#FBFAF6' });
  p.line(x, y + h / 2, x + w, y + h / 2, { strokeWidth: 2.4, stroke: '#FBFAF6' });
  p.line(x + w / 2, y, x + w / 2, y + h, { strokeWidth: 0.9 });
  p.line(x, y + h / 2, x + w, y + h / 2, { strokeWidth: 0.9 });
  p.rect(x - 8, y + h + 4, w + 16, 5, { fill: '#FBFAF6', strokeWidth: 1.2 });
  if (curtains) {
    p.line(x - 10, y - 8, x + w + 10, y - 8, { strokeWidth: 2 });
    p.path(`M${x - 8},${y - 8} L${x + w * 0.28},${y - 8} Q${x + w * 0.2},${y + h * 0.6} ${x - 2},${y + h + 6} L${x - 8},${y + h + 6} Z`, { fill: curtains, strokeWidth: 1.2 });
    p.path(`M${x + w + 8},${y - 8} L${x + w * 0.72},${y - 8} Q${x + w * 0.8},${y + h * 0.6} ${x + w + 2},${y + h + 6} L${x + w + 8},${y + h + 6} Z`, { fill: curtains, strokeWidth: 1.2 });
  }
}

function plant(p: Pen, x: number, baseY: number, s = 1) {
  p.poly([[x - 9 * s, baseY - 16 * s], [x + 9 * s, baseY - 16 * s], [x + 6 * s, baseY], [x - 6 * s, baseY]], { fill: '#CB5B43', strokeWidth: 1.2 });
  const leaves: [number, number][] = [[-12, -34], [-4, -44], [6, -40], [13, -30]];
  for (const [dx, dy] of leaves) {
    p.curve([[x, baseY - 16 * s], [x + dx * 0.5 * s, baseY + (dy * 0.6 - 16) * s * 0.9], [x + dx * s, baseY + dy * s]], { stroke: '#4E8A55', strokeWidth: 1.8 });
    p.ellipse(x + dx * s, baseY + dy * s, 11 * s, 6 * s, { fill: '#72AC6B', strokeWidth: 0.9 });
  }
}

function frame(p: Pen, x: number, y: number, w: number, h: number, mat: string, art: string) {
  p.rect(x, y, w, h, { fill: mat });
  p.rect(x + 4, y + 4, w - 8, h - 8, { fill: art, strokeWidth: 0.9 });
}

function floor(p: Pen, kind: RoomKind, w: number, h: number, rand: () => number) {
  const fy = h * FLOOR_AT;
  const f = FLOORS[kind];
  p.rect(0, fy, w, h - fy, { fill: f.fill, stroke: 'none', roughness: 0.4 });
  const line = shade(f.fill, -0.22);
  if (f.style === 'planks') {
    for (let i = 1; i < 4; i++) p.line(0, fy + ((h - fy) / 4) * i, w, fy + ((h - fy) / 4) * i, { stroke: line, strokeWidth: 0.9, roughness: 0.5 });
    for (let i = 0; i < 9; i++) {
      const x = rand() * w;
      const row = Math.floor(rand() * 4);
      p.line(x, fy + ((h - fy) / 4) * row, x, fy + ((h - fy) / 4) * (row + 1), { stroke: line, strokeWidth: 0.9, roughness: 0.4 });
    }
  } else if (f.style === 'tiles') {
    for (let i = 1; i < 3; i++) p.line(0, fy + ((h - fy) / 3) * i, w, fy + ((h - fy) / 3) * i, { stroke: line, strokeWidth: 0.8, roughness: 0.4 });
    for (let x = 20; x < w; x += 34) p.line(x, fy, x - 10, h, { stroke: line, strokeWidth: 0.8, roughness: 0.4 });
  } else if (f.style === 'concrete') {
    p.lines([[w * 0.3, fy + 6], [w * 0.34, fy + 20], [w * 0.31, fy + 34]], { stroke: line, strokeWidth: 0.9 });
    p.lines([[w * 0.72, fy + 10], [w * 0.69, fy + 26]], { stroke: line, strokeWidth: 0.9 });
  }
  // baseboard
  p.rect(0, fy - 6, w, 6, { fill: '#FBFAF6', strokeWidth: 1 });
}

function bricks(p: Pen, w: number, toY: number, color: string) {
  const line = shade(color, -0.2);
  const rowH = 18;
  for (let y = rowH, r = 0; y < toY; y += rowH, r++) {
    p.line(0, y, w, y, { stroke: line, strokeWidth: 0.8, roughness: 0.5 });
    for (let x = r % 2 ? 22 : 0; x < w; x += 44) p.line(x, y - rowH, x, y, { stroke: line, strokeWidth: 0.8, roughness: 0.4 });
  }
}

function drawAttic(p: Pen, w: number, h: number, wall: string, rand: () => number) {
  const fy = h * 0.88;
  p.rect(0, 0, w, fy, { fill: wall, stroke: 'none', roughness: 0.3 });
  const line = shade(wall, -0.2);
  for (let x = 14; x < w; x += 30) p.line(x, 0, x, fy, { stroke: line, strokeWidth: 0.9, roughness: 0.5 });
  // rafters following the roof, plus a collar tie
  const beam = '#8B6240';
  p.line(w * 0.5, -6, -20, h * 0.74, { stroke: beam, strokeWidth: 7, roughness: 0.6 });
  p.line(w * 0.5, -6, w + 20, h * 0.74, { stroke: beam, strokeWidth: 7, roughness: 0.6 });
  p.line(w * 0.33, h * 0.2, w * 0.67, h * 0.2, { stroke: beam, strokeWidth: 6, roughness: 0.6 });
  p.line(w * 0.5, 0, w * 0.5, h * 0.2, { stroke: beam, strokeWidth: 6, roughness: 0.6 });
  // round window
  p.circle(w * 0.5, h * 0.42, 40, { fill: '#FBFAF6' });
  p.circle(w * 0.5, h * 0.42, 31, { fill: 'var(--glass)', strokeWidth: 1.1 });
  p.line(w * 0.5 - 15, h * 0.42, w * 0.5 + 15, h * 0.42, { strokeWidth: 1 });
  p.line(w * 0.5, h * 0.42 - 15, w * 0.5, h * 0.42 + 15, { strokeWidth: 1 });
  // bare bulb
  p.line(w * 0.4, h * 0.2, w * 0.4, h * 0.36, { strokeWidth: 1 });
  p.circle(w * 0.4, h * 0.4, 11, { fill: '#FFD36B', strokeWidth: 1 });
  // floor
  p.rect(0, fy, w, h - fy, { fill: FLOORS.attic.fill, stroke: 'none', roughness: 0.4 });
  for (let x = 0; x < w; x += 46) p.line(x + rand() * 8, fy, x + rand() * 8 - 6, h, { stroke: shade(FLOORS.attic.fill, -0.25), strokeWidth: 0.9, roughness: 0.4 });
  p.line(0, fy, w, fy, { strokeWidth: 1.2 });
  // forgotten things along the low sides
  p.rect(w * 0.12, fy - 46, 34, 46, { fill: '#C9A77A', strokeWidth: 1.2 });
  frame(p, w * 0.175, fy - 38, 46, 38, '#97654A', '#62ABA2');
  p.poly([[w * 0.085, fy], [w * 0.1, fy - 58], [w * 0.115, fy - 58], [w * 0.11, fy]], { fill: '#CB5B43', strokeWidth: 1.1 });
  p.ellipse(w * 0.8, fy - 48, 26, 40, { fill: '#F2EADB', strokeWidth: 1.2 }); // dress form
  p.line(w * 0.8, fy - 28, w * 0.8, fy, { strokeWidth: 2 });
  p.line(w * 0.785, fy, w * 0.815, fy, { strokeWidth: 2 });
  p.rect(w * 0.84, fy - 12, 40, 12, { fill: '#3A568A', strokeWidth: 1 });
  p.rect(w * 0.845, fy - 22, 34, 10, { fill: '#E6BA43', strokeWidth: 1 });
  // cobwebs
  for (const sx of [w * 0.235, w * 0.765]) {
    const dir = sx < w / 2 ? 1 : -1;
    p.arc(sx, h * 0.5, 40, 40, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? 0 : Math.PI, false, { stroke: '#FFFFFF', strokeWidth: 0.8, opacity: 0.7 });
    p.arc(sx, h * 0.5, 22, 22, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? 0 : Math.PI, false, { stroke: '#FFFFFF', strokeWidth: 0.8, opacity: 0.7 });
  }
}

const cache = new Map<string, P[]>();

export function drawRoom(kind: RoomKind, w: number, h: number, wall: string, seed: number): P[] {
  const key = `${kind}:${Math.round(w)}x${Math.round(h)}:${wall}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const p = new Pen(seed, { roughness: 0.8 });
  const rand = rng(seed + 11);
  const fy = h * FLOOR_AT;

  if (kind === 'attic') {
    drawAttic(p, w, h, wall, rand);
  } else {
    p.rect(0, 0, w, fy, { fill: wall, stroke: 'none', roughness: 0.3 });
    const soft = shade(wall, -0.07);

    switch (kind) {
      case 'study':
        for (let x = 16; x < w; x += 22) p.line(x, 0, x, fy - 6, { stroke: soft, strokeWidth: 1, roughness: 0.4 });
        windowAt(p, w * 0.335, h * 0.11, w * 0.13, h * 0.28, '#3A568A');
        // pennant
        p.poly([[w * 0.53, h * 0.05], [w * 0.69, h * 0.09], [w * 0.53, h * 0.13]], { fill: '#3A568A', strokeWidth: 1.1 });
        break;
      case 'office':
        for (let x = 16; x < w; x += 22) p.line(x, 0, x, fy - 6, { stroke: soft, strokeWidth: 1, roughness: 0.4 });
        windowAt(p, w * 0.37, h * 0.11, w * 0.13, h * 0.28, '#8263A1');
        frame(p, w * 0.56, h * 0.12, w * 0.1, h * 0.2, '#3B4155', '#F2EADB');
        break;
      case 'bedroom': {
        for (let i = 0; i < 26; i++) p.circle(rand() * w, rand() * (fy - 14), 3, { fill: shade(wall, -0.1), stroke: 'none', roughness: 0.3 });
        windowAt(p, w * 0.1, h * 0.1, w * 0.2, h * 0.3, '#EBA9A9');
        frame(p, w * 0.45, h * 0.18, w * 0.1, h * 0.22, '#97654A', '#CFE8EA');
        // bed
        const bx = w * 0.03;
        const by = h * 0.56;
        p.rrect(bx, by - 28, w * 0.07, h - by + 18, 5, { fill: '#97654A' }); // headboard
        p.rect(bx + w * 0.05, by + 12, w * 0.33, h * 0.2, { fill: '#FBFAF6' }); // mattress
        p.rrect(bx + w * 0.06, by + 2, w * 0.1, 16, 6, { fill: '#FFFFFF', strokeWidth: 1.2 }); // pillow
        p.path(`M${bx + w * 0.17},${by + 10} L${bx + w * 0.38},${by + 10} L${bx + w * 0.38},${by + h * 0.3} L${bx + w * 0.17},${by + h * 0.3} Z`, { fill: '#8263A1' }); // blanket
        p.line(bx + w * 0.17, by + 24, bx + w * 0.38, by + 24, { stroke: '#F4DDD8', strokeWidth: 2 });
        p.rect(bx + w * 0.05, h * 0.92 - 4, 6, 10, { fill: '#74492F', strokeWidth: 1 });
        p.rect(bx + w * 0.36, h * 0.92 - 4, 6, 10, { fill: '#74492F', strokeWidth: 1 });
        break;
      }
      case 'bathroom': {
        const ty = h * 0.44;
        p.rect(0, ty, w, fy - ty, { fill: '#F3F7F8', stroke: 'none', roughness: 0.3 });
        for (let y = ty; y < fy - 6; y += 16) p.line(0, y, w, y, { stroke: '#BBD3D6', strokeWidth: 0.8, roughness: 0.4 });
        for (let x = 0; x < w; x += 16) p.line(x, ty, x, fy - 6, { stroke: '#BBD3D6', strokeWidth: 0.8, roughness: 0.4 });
        p.line(0, ty, w, ty, { stroke: '#62ABA2', strokeWidth: 3 });
        windowAt(p, w * 0.62, h * 0.1, w * 0.14, h * 0.24);
        // towel rail
        p.line(w * 0.82, h * 0.34, w * 0.96, h * 0.34, { strokeWidth: 2.2, stroke: '#97A1B2' });
        p.rect(w * 0.845, h * 0.34, w * 0.09, h * 0.16, { fill: '#EBA9A9', strokeWidth: 1.1 });
        break;
      }
      case 'kitchen': {
        const ty = h * 0.4;
        p.rect(w * 0.26, ty, w * 0.47, h * 0.17, { fill: '#FBFAF6', stroke: 'none', roughness: 0.3 });
        for (let x = w * 0.26; x <= w * 0.73; x += 14) p.line(x, ty, x, ty + h * 0.17, { stroke: '#D8CFB4', strokeWidth: 0.8, roughness: 0.4 });
        p.line(w * 0.26, ty + h * 0.085, w * 0.73, ty + h * 0.085, { stroke: '#D8CFB4', strokeWidth: 0.8, roughness: 0.4 });
        windowAt(p, w * 0.33, h * 0.09, w * 0.2, h * 0.26, '#CB5B43');
        // hanging pans
        p.line(w * 0.58, h * 0.12, w * 0.72, h * 0.12, { strokeWidth: 2 });
        p.line(w * 0.61, h * 0.12, w * 0.61, h * 0.18, { strokeWidth: 1 });
        p.circle(w * 0.61, h * 0.23, 22, { fill: '#3B4155', strokeWidth: 1.1 });
        p.line(w * 0.685, h * 0.12, w * 0.685, h * 0.17, { strokeWidth: 1 });
        p.circle(w * 0.685, h * 0.21, 16, { fill: '#CB5B43', strokeWidth: 1.1 });
        break;
      }
      case 'hall': {
        const py = h * 0.5;
        p.rect(0, py, w, fy - py, { fill: '#FBFAF6', stroke: 'none', roughness: 0.3 });
        p.line(0, py, w, py, { strokeWidth: 1.2 });
        for (let x = 10; x < w * 0.56; x += 56) p.rect(x, py + 9, 44, fy - py - 24, { strokeWidth: 0.9, stroke: '#CFCABB', fill: 'none' });
        // round mirror over the console
        p.circle(w * 0.2, h * 0.27, 62, { fill: '#E6BA43' });
        p.circle(w * 0.2, h * 0.27, 50, { fill: 'var(--glass)', strokeWidth: 1 });
        p.line(w * 0.17, h * 0.22, w * 0.2, h * 0.17, { stroke: '#FFFFFF', strokeWidth: 2 });
        // coat hooks
        p.line(w * 0.38, h * 0.2, w * 0.54, h * 0.2, { strokeWidth: 3, stroke: '#97654A' });
        p.poly([[w * 0.41, h * 0.2], [w * 0.45, h * 0.2], [w * 0.46, h * 0.46], [w * 0.4, h * 0.46]], { fill: '#3A568A', strokeWidth: 1.1 });
        p.curve([[w * 0.5, h * 0.2], [w * 0.49, h * 0.32], [w * 0.52, h * 0.42]], { stroke: '#CB5B43', strokeWidth: 4 });
        // staircase going up to the right
        const steps = 8;
        const sx = w * 0.58;
        const sw = (w * 0.42) / steps;
        const shh = (fy * 0.92) / steps;
        const pts: [number, number][] = [[sx, fy]];
        for (let i = 0; i < steps; i++) {
          pts.push([sx + i * sw, fy - (i + 1) * shh]);
          pts.push([sx + (i + 1) * sw, fy - (i + 1) * shh]);
        }
        pts.push([w, fy]);
        p.poly(pts, { fill: '#C79A66' });
        for (let i = 0; i < steps; i++) p.line(sx + i * sw, fy - (i + 1) * shh, sx + (i + 1) * sw, fy - (i + 1) * shh, { stroke: '#FBFAF6', strokeWidth: 3 });
        p.line(sx - 4, fy - shh - 34, w, fy - steps * shh - 40, { strokeWidth: 3, stroke: '#74492F' });
        for (let i = 0; i < steps; i += 2) p.line(sx + i * sw + sw / 2, fy - (i + 1) * shh, sx + i * sw + sw / 2, fy - (i + 1) * shh - 36, { strokeWidth: 1.6, stroke: '#74492F' });
        break;
      }
      case 'living': {
        p.line(0, h * 0.06, w, h * 0.06, { stroke: soft, strokeWidth: 2 });
        windowAt(p, w * 0.42, h * 0.06, w * 0.18, h * 0.18);
        break;
      }
      case 'workshop': {
        bricks(p, w, fy - 6, wall);
        // bare bulb + bike wheel on the wall
        p.line(w * 0.66, 0, w * 0.66, h * 0.1, { strokeWidth: 1 });
        p.circle(w * 0.66, h * 0.13, 12, { fill: '#FFD36B', strokeWidth: 1 });
        p.circle(w * 0.9, h * 0.3, 54, { strokeWidth: 2.4, fill: 'none' });
        p.circle(w * 0.9, h * 0.3, 8, { fill: '#97A1B2', strokeWidth: 1 });
        for (let a = 0; a < 6; a++) p.line(w * 0.9, h * 0.3, w * 0.9 + Math.cos((a * Math.PI) / 3) * 26, h * 0.3 + Math.sin((a * Math.PI) / 3) * 26, { strokeWidth: 0.7 });
        break;
      }
      case 'den': {
        for (let x = 0; x < w; x += 40) p.rect(x + 4, 6, 32, fy - 18, { fill: shade(wall, -0.06), stroke: 'none', roughness: 0.4 });
        // bean bag + string lights
        p.path(`M${w * 0.4},${h * 0.94} Q${w * 0.36},${h * 0.7} ${w * 0.5},${h * 0.7} Q${w * 0.66},${h * 0.72} ${w * 0.62},${h * 0.94} Z`, { fill: '#E6BA43' });
        p.curve([[0, h * 0.05], [w * 0.25, h * 0.1], [w * 0.5, h * 0.04], [w * 0.75, h * 0.1], [w, h * 0.05]], { strokeWidth: 1 });
        for (let i = 1; i < 10; i++) p.circle((w / 10) * i, h * (0.07 + (i % 2) * 0.025), 6, { fill: ['#FFD36B', '#EBA9A9', '#BFDDF5'][i % 3], strokeWidth: 0.7 });
        break;
      }
      case 'cellar': {
        bricks(p, w, fy - 6, wall);
        // pipes
        p.line(0, h * 0.08, w, h * 0.08, { stroke: '#97A1B2', strokeWidth: 6, roughness: 0.4 });
        p.line(w * 0.7, h * 0.08, w * 0.7, h * 0.34, { stroke: '#97A1B2', strokeWidth: 5, roughness: 0.4 });
        // water heater
        p.rrect(w * 0.76, h * 0.34, w * 0.15, h * 0.54, 14, { fill: '#E9EDF1' });
        p.rect(w * 0.8, h * 0.62, w * 0.07, h * 0.08, { fill: '#CB5B43', strokeWidth: 1 });
        p.circle(w * 0.835, h * 0.48, 12, { fill: '#FBFAF6', strokeWidth: 1 });
        p.rect(w * 0.78, h * 0.88, 6, h * 0.05, { fill: '#3B4155', strokeWidth: 1 });
        p.rect(w * 0.88, h * 0.88, 6, h * 0.05, { fill: '#3B4155', strokeWidth: 1 });
        // bulb
        p.line(w * 0.46, h * 0.08, w * 0.46, h * 0.18, { strokeWidth: 1 });
        p.circle(w * 0.46, h * 0.21, 12, { fill: '#FFD36B', strokeWidth: 1 });
        break;
      }
      case 'studio': {
        windowAt(p, w * 0.08, h * 0.08, w * 0.2, h * 0.18);
        const blots = ['#CB5B43', '#62ABA2', '#E6BA43', '#8263A1'];
        for (let i = 0; i < 9; i++) p.circle(w * (0.3 + rand() * 0.66), h * (0.46 + rand() * 0.3), 4 + rand() * 7, { fill: blots[i % 4], stroke: 'none', roughness: 1.4, opacity: 0.55 });
        break;
      }
      case 'library': {
        const py = h * 0.52;
        p.rect(0, py, w, fy - py, { fill: '#B08A62', stroke: 'none', roughness: 0.3 });
        p.line(0, py, w, py, { strokeWidth: 1.2 });
        windowAt(p, w * 0.42, h * 0.1, w * 0.16, h * 0.34, '#74492F');
        p.path(`M${w * 0.34},${h * 0.92} L${w * 0.34},${h * 0.62} Q${w * 0.34},${h * 0.54} ${w * 0.4},${h * 0.56} L${w * 0.4},${h * 0.92} Z`, { fill: '#5E8B6B' }); // wing chair back
        break;
      }
      case 'greenhouse': {
        p.rect(0, 0, w, fy - 6, { fill: 'var(--glass)', stroke: 'none', roughness: 0.3 });
        for (let x = 0; x <= w; x += w / 8) p.line(x, 0, x, fy - 6, { stroke: '#FBFAF6', strokeWidth: 3.4, roughness: 0.4 });
        for (let y = h * 0.26; y < fy - 10; y += h * 0.26) p.line(0, y, w, y, { stroke: '#FBFAF6', strokeWidth: 3.4, roughness: 0.4 });
        plant(p, w * 0.06, h * 0.9, 1.2);
        // hanging basket
        p.line(w * 0.5, 0, w * 0.5, h * 0.18, { strokeWidth: 1 });
        p.arc(w * 0.5, h * 0.18, 40, 30, 0, Math.PI, true, { fill: '#97654A' });
        p.curve([[w * 0.47, h * 0.18], [w * 0.45, h * 0.3], [w * 0.46, h * 0.36]], { stroke: '#4E8A55', strokeWidth: 1.8 });
        p.curve([[w * 0.53, h * 0.18], [w * 0.56, h * 0.28], [w * 0.54, h * 0.34]], { stroke: '#4E8A55', strokeWidth: 1.8 });
        break;
      }
    }
    floor(p, kind, w, h, rand);

    if (kind === 'bathroom') {
      // bath mat
      p.rrect(w * 0.44, h * 0.93, w * 0.26, h * 0.045, 4, { fill: '#62ABA2', strokeWidth: 1 });
    }
    if (kind === 'bedroom') {
      p.ellipse(w * 0.56, h * 0.95, w * 0.3, h * 0.06, { fill: '#FBFAF6', strokeWidth: 1 });
    }
    if (kind === 'living') {
      // rug, floor lamp, plant: drawn after the floor so they sit on it
      p.ellipse(w * 0.5, h * 0.925, w * 0.66, h * 0.12, { fill: '#CB5B43', strokeWidth: 1.2 });
      p.ellipse(w * 0.5, h * 0.925, w * 0.54, h * 0.08, { fill: 'none', stroke: '#F6E3D0', strokeWidth: 1.4 });
      p.line(w * 0.715, h * 0.3, w * 0.715, h * 0.9, { strokeWidth: 2 });
      p.poly([[w * 0.685, h * 0.3], [w * 0.745, h * 0.3], [w * 0.73, h * 0.2], [w * 0.7, h * 0.2]], { fill: '#E6BA43' });
      p.ellipse(w * 0.715, h * 0.905, 20, 5, { fill: '#3B4155', strokeWidth: 1 });
      plant(p, w * 0.285, h * 0.9, 1);
    }
  }

  if (cache.size > 80) cache.clear();
  cache.set(key, p.out);
  return p.out;
}

/** An unfinished cell: studs and a note. Shown for empty grid cells. */
export function drawEmptyCell(w: number, h: number, seed: number): P[] {
  const key = `empty:${Math.round(w)}x${Math.round(h)}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = new Pen(seed, { roughness: 0.9 });
  p.rect(0, 0, w, h, { fill: '#E7E1D4', stroke: 'none', roughness: 0.3 });
  for (let x = 18; x < w; x += 46) p.rect(x, 0, 9, h * FLOOR_AT, { fill: '#DDB780', strokeWidth: 1 });
  p.rect(0, h * 0.36, w, 8, { fill: '#DDB780', strokeWidth: 1 });
  p.rect(0, h * FLOOR_AT, w, h * (1 - FLOOR_AT), { fill: '#C9B79E', stroke: 'none', roughness: 0.4 });
  p.line(0, h * FLOOR_AT, w, h * FLOOR_AT, { strokeWidth: 1.2 });
  // sawhorse
  p.line(w * 0.62, h * 0.72, w * 0.86, h * 0.72, { strokeWidth: 3, stroke: '#97654A' });
  p.line(w * 0.65, h * 0.72, w * 0.62, h * 0.92, { strokeWidth: 2.4, stroke: '#97654A' });
  p.line(w * 0.83, h * 0.72, w * 0.86, h * 0.92, { strokeWidth: 2.4, stroke: '#97654A' });
  cache.set(key, p.out);
  return p.out;
}
