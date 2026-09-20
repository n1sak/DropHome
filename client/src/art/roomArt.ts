/**
 * Room backgrounds: a pale wall, a warm floor, a window and a little decor.
 * Furniture is NOT drawn here; it is layered on top so it can open and move.
 * A hand-drawn background (room.background, or art/manifest.json) replaces
 * the whole thing.
 */
import type { RoomKind } from '../model/types';
import { C, FRAME } from './palette';
import { Pen, rng, shade, type P } from './sketch';

const FLOOR_AT = 0.8;

const FLOORS: Record<RoomKind, { fill: string; style: 'planks' | 'tiles' | 'concrete' | 'carpet' }> = {
  attic: { fill: '#E2B27C', style: 'planks' },
  study: { fill: '#EBC68D', style: 'planks' },
  bedroom: { fill: '#F9D9D2', style: 'carpet' },
  bathroom: { fill: '#EEF1FA', style: 'tiles' },
  kitchen: { fill: '#FBEBCB', style: 'tiles' },
  hall: { fill: '#E5B981', style: 'planks' },
  living: { fill: '#EDC891', style: 'planks' },
  workshop: { fill: '#E3DCD6', style: 'concrete' },
  den: { fill: '#E8A9B4', style: 'carpet' },
  cellar: { fill: '#D6C8BC', style: 'concrete' },
  office: { fill: '#E8C088', style: 'planks' },
  studio: { fill: '#F3DCB4', style: 'planks' },
  library: { fill: '#D9A66E', style: 'planks' },
  greenhouse: { fill: '#F0E0C4', style: 'tiles' },
};

function windowAt(p: Pen, x: number, y: number, w: number, h: number, curtains?: string) {
  p.rect(x - 4, y - 4, w + 8, h + 8, { fill: C.oak });
  p.rect(x, y, w, h, { fill: 'var(--glass)', stroke: '#8A6A4F', strokeWidth: 1.2 });
  p.line(x + w / 2, y, x + w / 2, y + h, { strokeWidth: 3, stroke: C.oak, roughness: 0.4 });
  p.line(x, y + h / 2, x + w, y + h / 2, { strokeWidth: 3, stroke: C.oak, roughness: 0.4 });
  p.rect(x - 8, y + h + 4, w + 16, 6, { fill: C.oakDark, strokeWidth: 1.2 });
  if (curtains) {
    const rod = y - 9;
    const hem = y + h + 9;
    const tie = y + h * 0.62;
    p.line(x - 13, rod, x + w + 13, rod, { strokeWidth: 3, stroke: C.oakDark, roughness: 0.4 });
    p.circle(x - 13, rod, 5, { fill: C.mustard, strokeWidth: 0.9 });
    p.circle(x + w + 13, rod, 5, { fill: C.mustard, strokeWidth: 0.9 });
    // each side hangs from the rod, gathers at a tie-back, then flares to the hem
    p.path(`M${x - 9},${rod} L${x + w * 0.44},${rod} Q${x + w * 0.38},${y + h * 0.42} ${x + w * 0.05},${tie} Q${x + w * 0.12},${y + h * 0.84} ${x + w * 0.16},${hem} L${x - 9},${hem} Z`, { fill: curtains, strokeWidth: 1.3 });
    p.path(`M${x + w + 9},${rod} L${x + w * 0.56},${rod} Q${x + w * 0.62},${y + h * 0.42} ${x + w * 0.95},${tie} Q${x + w * 0.88},${y + h * 0.84} ${x + w * 0.84},${hem} L${x + w + 9},${hem} Z`, { fill: curtains, strokeWidth: 1.3 });
    const fold = shade(curtains, -0.24);
    p.curve([[x + w * 0.14, rod + 3], [x + w * 0.11, y + h * 0.3], [x + w * 0.02, tie - 3]], { stroke: fold, strokeWidth: 1 });
    p.curve([[x + w * 0.28, rod + 3], [x + w * 0.24, y + h * 0.32], [x + w * 0.05, tie - 2]], { stroke: fold, strokeWidth: 1 });
    p.curve([[x + w * 0.86, rod + 3], [x + w * 0.89, y + h * 0.3], [x + w * 0.98, tie - 3]], { stroke: fold, strokeWidth: 1 });
    p.curve([[x + w * 0.72, rod + 3], [x + w * 0.76, y + h * 0.32], [x + w * 0.95, tie - 2]], { stroke: fold, strokeWidth: 1 });
    p.rrect(x - 10, tie - 3, w * 0.17, 6, 3, { fill: C.mustard, strokeWidth: 0.9 });
    p.rrect(x + w * 0.83 + 10 - w * 0.0, tie - 3, w * 0.17, 6, 3, { fill: C.mustard, strokeWidth: 0.9 });
  }
}

/** A bushy plant in a pot, with a few flowers. */
function plant(p: Pen, x: number, baseY: number, s = 1) {
  p.poly([[x - 10 * s, baseY - 18 * s], [x + 10 * s, baseY - 18 * s], [x + 7 * s, baseY], [x - 7 * s, baseY]], { fill: C.mustard, strokeWidth: 1.2 });
  p.rrect(x - 12 * s, baseY - 22 * s, 24 * s, 6 * s, 2, { fill: C.oakDark, strokeWidth: 1 });
  const blobs: [number, number, number][] = [[-9, -30, 17], [8, -31, 18], [0, -40, 19], [-3, -27, 14]];
  for (const [dx, dy, d] of blobs) p.circle(x + dx * s, baseY + dy * s, d * s, { fill: C.leaf, strokeWidth: 1.1 });
  for (const [dx, dy] of [[-8, -34], [6, -38], [1, -28]] as const) p.circle(x + dx * s, baseY + dy * s, 5 * s, { fill: C.pink, strokeWidth: 0.7 });
}

function frame(p: Pen, x: number, y: number, w: number, h: number, mat: string, art: string) {
  p.rect(x, y, w, h, { fill: mat });
  p.rect(x + 4, y + 4, w - 8, h - 8, { fill: art, strokeWidth: 0.9 });
}

function floor(p: Pen, kind: RoomKind, w: number, h: number, rand: () => number) {
  const fy = h * FLOOR_AT;
  const f = FLOORS[kind];
  p.rect(0, fy, w, h - fy, { fill: f.fill, stroke: 'none', roughness: 0.3 });
  const line = shade(f.fill, -0.2);
  if (f.style === 'planks') {
    for (let i = 1; i < 4; i++) p.line(0, fy + ((h - fy) / 4) * i, w, fy + ((h - fy) / 4) * i, { stroke: line, strokeWidth: 0.9, roughness: 0.4 });
    for (let i = 0; i < 9; i++) {
      const x = rand() * w;
      const row = Math.floor(rand() * 4);
      p.line(x, fy + ((h - fy) / 4) * row, x, fy + ((h - fy) / 4) * (row + 1), { stroke: line, strokeWidth: 0.9, roughness: 0.3 });
    }
  } else if (f.style === 'tiles') {
    for (let i = 1; i < 3; i++) p.line(0, fy + ((h - fy) / 3) * i, w, fy + ((h - fy) / 3) * i, { stroke: line, strokeWidth: 0.8, roughness: 0.3 });
    for (let x = 20; x < w; x += 34) p.line(x, fy, x - 10, h, { stroke: line, strokeWidth: 0.8, roughness: 0.3 });
  } else if (f.style === 'concrete') {
    p.lines([[w * 0.3, fy + 6], [w * 0.34, fy + 20], [w * 0.31, fy + 34]], { stroke: line, strokeWidth: 0.9 });
    p.lines([[w * 0.72, fy + 10], [w * 0.69, fy + 26]], { stroke: line, strokeWidth: 0.9 });
  }
  // baseboard
  p.rect(-2, fy - 6, w + 4, 6, { fill: C.white, strokeWidth: 1 });
}

function bricks(p: Pen, w: number, toY: number, color: string) {
  const line = shade(color, -0.13);
  const rowH = 18;
  for (let y = rowH, r = 0; y < toY; y += rowH, r++) {
    p.line(0, y, w, y, { stroke: line, strokeWidth: 0.8, roughness: 0.4 });
    for (let x = r % 2 ? 22 : 0; x < w; x += 44) p.line(x, y - rowH, x, y, { stroke: line, strokeWidth: 0.8, roughness: 0.3 });
  }
}

function bulb(p: Pen, x: number, fromY: number, toY: number) {
  p.line(x, fromY, x, toY, { strokeWidth: 1 });
  p.rect(x - 3, toY, 6, 5, { fill: C.steelDark, strokeWidth: 0.8 });
  p.circle(x, toY + 11, 13, { fill: C.lamp, strokeWidth: 1 });
}

function drawAttic(p: Pen, w: number, h: number, wall: string, rand: () => number) {
  const fy = h * 0.88;
  p.rect(0, 0, w, fy, { fill: wall, stroke: 'none', roughness: 0.3 });
  const line = shade(wall, -0.12);
  for (let x = 14; x < w; x += 30) p.line(x, 0, x, fy, { stroke: line, strokeWidth: 0.9, roughness: 0.4 });
  // rafters following the roof, plus a collar tie
  p.line(w * 0.5, -6, -20, h * 0.74, { stroke: FRAME, strokeWidth: 7, roughness: 0.5 });
  p.line(w * 0.5, -6, w + 20, h * 0.74, { stroke: FRAME, strokeWidth: 7, roughness: 0.5 });
  p.line(w * 0.33, h * 0.2, w * 0.67, h * 0.2, { stroke: FRAME, strokeWidth: 6, roughness: 0.5 });
  p.line(w * 0.5, 0, w * 0.5, h * 0.2, { stroke: FRAME, strokeWidth: 6, roughness: 0.5 });
  // round window
  p.circle(w * 0.5, h * 0.42, 42, { fill: C.oak });
  p.circle(w * 0.5, h * 0.42, 31, { fill: 'var(--glass)', stroke: '#8A6A4F', strokeWidth: 1.1 });
  p.line(w * 0.5 - 15, h * 0.42, w * 0.5 + 15, h * 0.42, { strokeWidth: 2.6, stroke: C.oak, roughness: 0.3 });
  p.line(w * 0.5, h * 0.42 - 15, w * 0.5, h * 0.42 + 15, { strokeWidth: 2.6, stroke: C.oak, roughness: 0.3 });
  bulb(p, w * 0.4, h * 0.2, h * 0.33);
  // floor
  p.rect(0, fy, w, h - fy, { fill: FLOORS.attic.fill, stroke: 'none', roughness: 0.3 });
  for (let x = 0; x < w; x += 46) p.line(x + rand() * 8, fy, x + rand() * 8 - 6, h, { stroke: shade(FLOORS.attic.fill, -0.22), strokeWidth: 0.9, roughness: 0.3 });
  p.line(0, fy, w, fy, { strokeWidth: 1.2, stroke: shade(FLOORS.attic.fill, -0.45) });
  // forgotten things along the low sides
  p.rect(w * 0.12, fy - 46, 34, 46, { fill: C.card, strokeWidth: 1.2 });
  frame(p, w * 0.175, fy - 38, 46, 38, C.walnut, C.peri);
  p.poly([[w * 0.085, fy], [w * 0.1, fy - 58], [w * 0.115, fy - 58], [w * 0.11, fy]], { fill: C.coral, strokeWidth: 1.1 });
  p.ellipse(w * 0.8, fy - 48, 26, 40, { fill: C.cream, strokeWidth: 1.2 }); // dress form
  p.line(w * 0.8, fy - 28, w * 0.8, fy, { strokeWidth: 2.4, stroke: C.walnutDark });
  p.line(w * 0.785, fy, w * 0.815, fy, { strokeWidth: 2.4, stroke: C.walnutDark });
  p.rect(w * 0.84, fy - 12, 40, 12, { fill: C.denim, strokeWidth: 1 });
  p.rect(w * 0.845, fy - 22, 34, 10, { fill: C.mustard, strokeWidth: 1 });
  // cobwebs
  for (const sx of [w * 0.235, w * 0.765]) {
    const dir = sx < w / 2 ? 1 : -1;
    p.arc(sx, h * 0.5, 40, 40, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? 0 : Math.PI, false, { stroke: '#FFFFFF', strokeWidth: 0.9, opacity: 0.9 });
    p.arc(sx, h * 0.5, 22, 22, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? 0 : Math.PI, false, { stroke: '#FFFFFF', strokeWidth: 0.9, opacity: 0.9 });
  }
}

const cache = new Map<string, P[]>();

export function drawRoom(kind: RoomKind, w: number, h: number, wall: string, seed: number): P[] {
  const key = `${kind}:${Math.round(w)}x${Math.round(h)}:${wall}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const p = new Pen(seed, { roughness: 0.6 });
  const rand = rng(seed + 11);
  const fy = h * FLOOR_AT;

  if (kind === 'attic') {
    drawAttic(p, w, h, wall, rand);
  } else {
    p.rect(0, 0, w, fy, { fill: wall, stroke: 'none', roughness: 0.3 });
    const soft = shade(wall, -0.06);

    /* 1. wall treatments, which the baseboard and floor then sit on top of */
    switch (kind) {
      case 'study':
      case 'office':
        for (let x = 16; x < w; x += 22) p.line(x, 0, x, fy - 6, { stroke: soft, strokeWidth: 1, roughness: 0.3 });
        break;
      case 'bedroom':
        for (let i = 0; i < 26; i++) p.circle(rand() * w, rand() * (fy - 14), 3.4, { fill: shade(wall, -0.08), stroke: 'none', roughness: 0.3 });
        break;
      case 'bathroom': {
        const ty = h * 0.44;
        p.rect(0, ty, w, fy - ty, { fill: '#FAFBFF', stroke: 'none', roughness: 0.3 });
        for (let y = ty; y < fy - 6; y += 16) p.line(0, y, w, y, { stroke: '#D3DAF0', strokeWidth: 0.8, roughness: 0.3 });
        for (let x = 0; x < w; x += 16) p.line(x, ty, x, fy - 6, { stroke: '#D3DAF0', strokeWidth: 0.8, roughness: 0.3 });
        p.line(0, ty, w, ty, { stroke: C.peri, strokeWidth: 3.4, roughness: 0.3 });
        break;
      }
      case 'kitchen': {
        const ty = h * 0.4;
        p.rect(w * 0.26, ty, w * 0.47, h * 0.17, { fill: C.white, stroke: 'none', roughness: 0.3 });
        for (let x = w * 0.26; x <= w * 0.73; x += 14) p.line(x, ty, x, ty + h * 0.17, { stroke: '#F0DCC0', strokeWidth: 0.8, roughness: 0.3 });
        p.line(w * 0.26, ty + h * 0.085, w * 0.73, ty + h * 0.085, { stroke: '#F0DCC0', strokeWidth: 0.8, roughness: 0.3 });
        break;
      }
      case 'hall': {
        const py = h * 0.5;
        p.rect(0, py, w, fy - py, { fill: C.white, stroke: 'none', roughness: 0.3 });
        p.line(0, py, w, py, { strokeWidth: 1.2, stroke: '#B99B86' });
        for (let x = 10; x < w * 0.56; x += 56) p.rect(x, py + 9, 44, fy - py - 24, { strokeWidth: 0.9, stroke: '#E6D3C3', fill: 'none' });
        break;
      }
      case 'living':
        p.line(0, h * 0.06, w, h * 0.06, { stroke: soft, strokeWidth: 2 });
        break;
      case 'workshop':
      case 'cellar':
        bricks(p, w, fy - 6, wall);
        break;
      case 'den':
        for (let x = 0; x < w; x += 40) p.rect(x + 4, 6, 32, fy - 18, { fill: shade(wall, -0.045), stroke: 'none', roughness: 0.3 });
        break;
      case 'library': {
        const py = h * 0.52;
        p.rect(0, py, w, fy - py, { fill: C.oak, stroke: 'none', roughness: 0.3 });
        p.line(0, py, w, py, { strokeWidth: 1.2, stroke: C.walnutDark });
        break;
      }
      case 'greenhouse':
        p.rect(0, 0, w, fy - 6, { fill: 'var(--glass)', stroke: 'none', roughness: 0.3 });
        for (let x = 0; x <= w; x += w / 8) p.line(x, 0, x, fy - 6, { stroke: C.white, strokeWidth: 3.4, roughness: 0.3 });
        for (let y = h * 0.26; y < fy - 10; y += h * 0.26) p.line(0, y, w, y, { stroke: C.white, strokeWidth: 3.4, roughness: 0.3 });
        break;
      case 'studio': {
        const blots = [C.coral, C.peri, C.mustard, C.rose];
        for (let i = 0; i < 9; i++) p.circle(w * (0.3 + rand() * 0.66), h * (0.46 + rand() * 0.3), 4 + rand() * 7, { fill: blots[i % 4], stroke: 'none', roughness: 1.2, opacity: 0.6 });
        break;
      }
    }

    floor(p, kind, w, h, rand);

    /* 2. windows and everything that hangs on the wall or stands on the floor */
    switch (kind) {
      case 'study':
        windowAt(p, w * 0.335, h * 0.11, w * 0.13, h * 0.28, C.denim);
        p.poly([[w * 0.53, h * 0.05], [w * 0.69, h * 0.09], [w * 0.53, h * 0.13]], { fill: C.coral, strokeWidth: 1.1 }); // pennant
        break;
      case 'office':
        windowAt(p, w * 0.37, h * 0.11, w * 0.13, h * 0.28, C.salmon);
        frame(p, w * 0.56, h * 0.12, w * 0.1, h * 0.2, C.walnut, C.cream);
        break;
      case 'bedroom': {
        windowAt(p, w * 0.1, h * 0.1, w * 0.2, h * 0.3, C.salmon);
        frame(p, w * 0.45, h * 0.18, w * 0.1, h * 0.22, C.oak, C.blush);
        p.ellipse(w * 0.56, h * 0.95, w * 0.3, h * 0.06, { fill: C.white, strokeWidth: 1 }); // rug
        const bx = w * 0.03;
        const by = h * 0.56;
        p.rect(bx + w * 0.05, h * 0.9, 6, h * 0.035, { fill: C.walnutDark, strokeWidth: 1 });
        p.rect(bx + w * 0.36, h * 0.9, 6, h * 0.035, { fill: C.walnutDark, strokeWidth: 1 });
        p.rrect(bx, by - 28, w * 0.07, h * 0.92 - by + 28, 6, { fill: C.oak }); // headboard
        p.rect(bx + w * 0.05, by + 12, w * 0.33, h * 0.9 - by - 12, { fill: C.white }); // mattress
        p.rrect(bx + w * 0.06, by + 1, w * 0.1, 17, 7, { fill: C.pink, strokeWidth: 1.2 }); // pillow
        p.rect(bx + w * 0.17, by + 10, w * 0.21, h * 0.9 - by - 10, { fill: C.salmon }); // blanket
        p.line(bx + w * 0.17, by + 24, bx + w * 0.38, by + 24, { stroke: C.blush, strokeWidth: 2.4 });
        break;
      }
      case 'bathroom':
        windowAt(p, w * 0.62, h * 0.1, w * 0.14, h * 0.24);
        p.line(w * 0.82, h * 0.34, w * 0.96, h * 0.34, { strokeWidth: 2.6, stroke: C.steelDark }); // towel rail
        p.rect(w * 0.845, h * 0.34, w * 0.09, h * 0.16, { fill: C.salmon, strokeWidth: 1.1 });
        p.line(w * 0.845, h * 0.46, w * 0.935, h * 0.46, { stroke: C.blush, strokeWidth: 2 });
        p.rrect(w * 0.44, h * 0.93, w * 0.26, h * 0.045, 4, { fill: C.peri, strokeWidth: 1 }); // bath mat
        break;
      case 'kitchen':
        windowAt(p, w * 0.33, h * 0.09, w * 0.2, h * 0.26, C.coral);
        p.line(w * 0.58, h * 0.12, w * 0.72, h * 0.12, { strokeWidth: 2.4, stroke: C.walnutDark }); // hanging pans
        p.line(w * 0.61, h * 0.12, w * 0.61, h * 0.18, { strokeWidth: 1 });
        p.circle(w * 0.61, h * 0.23, 22, { fill: C.charcoal, strokeWidth: 1.1 });
        p.line(w * 0.685, h * 0.12, w * 0.685, h * 0.17, { strokeWidth: 1 });
        p.circle(w * 0.685, h * 0.21, 16, { fill: C.coral, strokeWidth: 1.1 });
        break;
      case 'hall': {
        p.circle(w * 0.2, h * 0.27, 62, { fill: C.mustard }); // round mirror over the console
        p.circle(w * 0.2, h * 0.27, 50, { fill: 'var(--glass)', stroke: '#8A6A4F', strokeWidth: 1 });
        p.line(w * 0.17, h * 0.22, w * 0.2, h * 0.17, { stroke: '#FFFFFF', strokeWidth: 2.6 });
        p.line(w * 0.38, h * 0.2, w * 0.54, h * 0.2, { strokeWidth: 3.4, stroke: C.walnutDark }); // coat hooks
        p.poly([[w * 0.41, h * 0.2], [w * 0.45, h * 0.2], [w * 0.46, h * 0.46], [w * 0.4, h * 0.46]], { fill: C.denim, strokeWidth: 1.1 });
        p.curve([[w * 0.5, h * 0.2], [w * 0.49, h * 0.32], [w * 0.52, h * 0.42]], { stroke: C.coral, strokeWidth: 4.4 });
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
        p.poly(pts, { fill: C.oak });
        for (let i = 0; i < steps; i++) p.line(sx + i * sw, fy - (i + 1) * shh, sx + (i + 1) * sw, fy - (i + 1) * shh, { stroke: C.coral, strokeWidth: 3.4, roughness: 0.3 });
        p.line(sx - 4, fy - shh - 34, w, fy - steps * shh - 40, { strokeWidth: 3.4, stroke: C.walnutDark });
        for (let i = 0; i < steps; i += 2) p.line(sx + i * sw + sw / 2, fy - (i + 1) * shh, sx + i * sw + sw / 2, fy - (i + 1) * shh - 36, { strokeWidth: 2, stroke: C.walnutDark });
        break;
      }
      case 'living':
        windowAt(p, w * 0.42, h * 0.06, w * 0.18, h * 0.18);
        p.ellipse(w * 0.5, h * 0.925, w * 0.66, h * 0.12, { fill: C.salmon, strokeWidth: 1.2 }); // rug
        p.ellipse(w * 0.5, h * 0.925, w * 0.54, h * 0.08, { fill: 'none', stroke: C.blush, strokeWidth: 1.6 });
        p.line(w * 0.715, h * 0.3, w * 0.715, h * 0.9, { strokeWidth: 2.6, stroke: C.walnutDark }); // floor lamp
        p.poly([[w * 0.685, h * 0.3], [w * 0.745, h * 0.3], [w * 0.73, h * 0.2], [w * 0.7, h * 0.2]], { fill: C.mustard });
        p.ellipse(w * 0.715, h * 0.905, 20, 5, { fill: C.walnutDark, strokeWidth: 1 });
        plant(p, w * 0.285, h * 0.9, 1);
        break;
      case 'workshop':
        bulb(p, w * 0.66, 0, h * 0.08);
        p.circle(w * 0.9, h * 0.3, 54, { strokeWidth: 2.6, fill: 'none', stroke: C.charcoal }); // bike wheel on the wall
        p.circle(w * 0.9, h * 0.3, 8, { fill: C.steelDark, strokeWidth: 1 });
        for (let a = 0; a < 6; a++) p.line(w * 0.9, h * 0.3, w * 0.9 + Math.cos((a * Math.PI) / 3) * 26, h * 0.3 + Math.sin((a * Math.PI) / 3) * 26, { strokeWidth: 0.7, stroke: C.charcoal });
        break;
      case 'den':
        p.path(`M${w * 0.4},${h * 0.94} Q${w * 0.36},${h * 0.7} ${w * 0.5},${h * 0.7} Q${w * 0.66},${h * 0.72} ${w * 0.62},${h * 0.94} Z`, { fill: C.mustard }); // bean bag
        p.curve([[0, h * 0.05], [w * 0.25, h * 0.1], [w * 0.5, h * 0.04], [w * 0.75, h * 0.1], [w, h * 0.05]], { strokeWidth: 1, stroke: C.charcoal }); // string lights
        for (let i = 1; i < 10; i++) p.circle((w / 10) * i, h * (0.07 + (i % 2) * 0.025), 6.5, { fill: [C.lamp, C.pink, C.peri][i % 3], strokeWidth: 0.7 });
        break;
      case 'cellar':
        p.line(0, h * 0.08, w, h * 0.08, { stroke: C.steelDark, strokeWidth: 6, roughness: 0.3 }); // pipes
        p.line(w * 0.7, h * 0.08, w * 0.7, h * 0.34, { stroke: C.steelDark, strokeWidth: 5, roughness: 0.3 });
        p.rrect(w * 0.76, h * 0.34, w * 0.15, h * 0.54, 14, { fill: C.steel }); // water heater
        p.rect(w * 0.8, h * 0.62, w * 0.07, h * 0.08, { fill: C.coral, strokeWidth: 1 });
        p.circle(w * 0.835, h * 0.48, 12, { fill: C.white, strokeWidth: 1 });
        p.rect(w * 0.78, h * 0.88, 6, h * 0.05, { fill: C.charcoal, strokeWidth: 1 });
        p.rect(w * 0.88, h * 0.88, 6, h * 0.05, { fill: C.charcoal, strokeWidth: 1 });
        bulb(p, w * 0.46, h * 0.08, h * 0.16);
        break;
      case 'studio':
        windowAt(p, w * 0.08, h * 0.08, w * 0.2, h * 0.18);
        break;
      case 'library':
        windowAt(p, w * 0.42, h * 0.1, w * 0.16, h * 0.34, C.coral);
        p.path(`M${w * 0.34},${h * 0.92} L${w * 0.34},${h * 0.62} Q${w * 0.34},${h * 0.54} ${w * 0.4},${h * 0.56} L${w * 0.4},${h * 0.92} Z`, { fill: C.salmon }); // wing chair
        break;
      case 'greenhouse':
        plant(p, w * 0.06, h * 0.9, 1.2);
        p.line(w * 0.5, 0, w * 0.5, h * 0.18, { strokeWidth: 1 }); // hanging basket
        p.arc(w * 0.5, h * 0.18, 40, 30, 0, Math.PI, true, { fill: C.walnut });
        p.curve([[w * 0.47, h * 0.18], [w * 0.45, h * 0.3], [w * 0.46, h * 0.36]], { stroke: C.leafDark, strokeWidth: 2 });
        p.curve([[w * 0.53, h * 0.18], [w * 0.56, h * 0.28], [w * 0.54, h * 0.34]], { stroke: C.leafDark, strokeWidth: 2 });
        break;
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
  const p = new Pen(seed, { roughness: 0.7 });
  p.rect(0, 0, w, h, { fill: '#FBF1E4', stroke: 'none', roughness: 0.3 });
  for (let x = 18; x < w; x += 46) p.rect(x, 0, 9, h * FLOOR_AT, { fill: C.oak, strokeWidth: 1 });
  p.rect(0, h * 0.36, w, 8, { fill: C.oak, strokeWidth: 1 });
  p.rect(0, h * FLOOR_AT, w, h * (1 - FLOOR_AT), { fill: '#EBD6B8', stroke: 'none', roughness: 0.3 });
  p.line(0, h * FLOOR_AT, w, h * FLOOR_AT, { strokeWidth: 1.2, stroke: '#9C7C5A' });
  // sawhorse
  p.line(w * 0.62, h * 0.72, w * 0.86, h * 0.72, { strokeWidth: 3.4, stroke: C.walnutDark });
  p.line(w * 0.65, h * 0.72, w * 0.62, h * 0.92, { strokeWidth: 2.8, stroke: C.walnutDark });
  p.line(w * 0.83, h * 0.72, w * 0.86, h * 0.92, { strokeWidth: 2.8, stroke: C.walnutDark });
  cache.set(key, p.out);
  return p.out;
}
