/**
 * Room backgrounds: a pale wall, a warm floor, a window and a little decor.
 * Furniture is NOT drawn here; it is layered on top so it can open and move.
 * A hand-drawn background (room.background, or art/manifest.json) replaces
 * the whole thing.
 */
import type { RoomKind } from '../model/types';
import { C, FRAME } from './palette';
import { Pen, shade, type P } from './sketch';

const FLOOR_AT = 0.8;

const FLOORS: Record<RoomKind, { fill: string; style: 'planks' | 'tiles' | 'concrete' | 'carpet' }> = {
  attic: { fill: '#EFD3AC', style: 'planks' },
  study: { fill: '#F3DDB6', style: 'planks' },
  bedroom: { fill: '#FBE6E1', style: 'carpet' },
  bathroom: { fill: '#F2F4FB', style: 'tiles' },
  kitchen: { fill: '#FCF1DA', style: 'tiles' },
  hall: { fill: '#F1D8B2', style: 'planks' },
  living: { fill: '#F4DFBC', style: 'planks' },
  workshop: { fill: '#EDE8E3', style: 'concrete' },
  den: { fill: '#F3CBD2', style: 'carpet' },
  cellar: { fill: '#E6DCD3', style: 'concrete' },
  office: { fill: '#F2DAB3', style: 'planks' },
  studio: { fill: '#F7E8CC', style: 'planks' },
  library: { fill: '#EACBA2', style: 'planks' },
  greenhouse: { fill: '#F5EAD6', style: 'tiles' },
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

function floor(p: Pen, kind: RoomKind, w: number, h: number) {
  const fy = h * FLOOR_AT;
  const f = FLOORS[kind];
  p.rect(0, fy, w, h - fy, { fill: f.fill, stroke: 'none', roughness: 0.3 });
  if (f.style === 'planks' || f.style === 'tiles') p.line(0, fy + (h - fy) / 2, w, fy + (h - fy) / 2, { stroke: shade(f.fill, -0.1), strokeWidth: 0.9, roughness: 0.3 });
  // baseboard
  p.rect(-2, fy - 6, w + 4, 6, { fill: C.white, strokeWidth: 1 });
}

function bulb(p: Pen, x: number, fromY: number, toY: number) {
  p.line(x, fromY, x, toY, { strokeWidth: 1 });
  p.rect(x - 3, toY, 6, 5, { fill: C.steelDark, strokeWidth: 0.8 });
  p.circle(x, toY + 11, 13, { fill: C.lamp, strokeWidth: 1 });
}

function drawAttic(p: Pen, w: number, h: number, wall: string) {
  const fy = h * 0.88;
  p.rect(0, 0, w, fy, { fill: wall, stroke: 'none', roughness: 0.3 });
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
  p.line(0, fy, w, fy, { strokeWidth: 1.2, stroke: shade(FLOORS.attic.fill, -0.45) });
}

const cache = new Map<string, P[]>();

export function drawRoom(kind: RoomKind, w: number, h: number, wall: string, seed: number): P[] {
  const key = `${kind}:${Math.round(w)}x${Math.round(h)}:${wall}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const p = new Pen(seed, { roughness: 0.6 });
  const fy = h * FLOOR_AT;

  if (kind === 'attic') {
    drawAttic(p, w, h, wall);
  } else {
    p.rect(0, 0, w, fy, { fill: wall, stroke: 'none', roughness: 0.3 });
    const soft = shade(wall, -0.06);

    /* 1. wall treatments: almost none. A plain wall is what keeps the house calm. */
    switch (kind) {
      case 'bathroom': {
        const ty = h * 0.5;
        p.rect(0, ty, w, fy - ty, { fill: '#FAFBFF', stroke: 'none', roughness: 0.3 });
        p.line(0, ty, w, ty, { stroke: C.peri, strokeWidth: 3, roughness: 0.3 });
        break;
      }
      case 'greenhouse':
        p.rect(0, 0, w, fy - 6, { fill: 'var(--glass)', stroke: 'none', roughness: 0.3 });
        for (let x = 0; x <= w; x += w / 4) p.line(x, 0, x, fy - 6, { stroke: C.white, strokeWidth: 3.4, roughness: 0.3 });
        break;
    }

    floor(p, kind, w, h);

    /* 2. one window where it fits, and only the decor that tells you which room this is */
    switch (kind) {
      case 'study':
        windowAt(p, w * 0.335, h * 0.11, w * 0.13, h * 0.28, C.peri);
        break;
      case 'office':
        windowAt(p, w * 0.37, h * 0.11, w * 0.13, h * 0.28, C.salmon);
        break;
      case 'bedroom': {
        windowAt(p, w * 0.1, h * 0.1, w * 0.2, h * 0.3, C.salmon);
        const bx = w * 0.03;
        const by = h * 0.56;
        p.rect(bx + w * 0.05, h * 0.9, 6, h * 0.035, { fill: C.walnutDark, strokeWidth: 1 });
        p.rect(bx + w * 0.36, h * 0.9, 6, h * 0.035, { fill: C.walnutDark, strokeWidth: 1 });
        p.rrect(bx, by - 28, w * 0.07, h * 0.92 - by + 28, 6, { fill: C.oak }); // headboard
        p.rect(bx + w * 0.05, by + 12, w * 0.33, h * 0.9 - by - 12, { fill: C.white }); // mattress
        p.rrect(bx + w * 0.06, by + 1, w * 0.1, 17, 7, { fill: C.pink, strokeWidth: 1.2 }); // pillow
        p.rect(bx + w * 0.17, by + 10, w * 0.21, h * 0.9 - by - 10, { fill: C.salmon }); // blanket
        break;
      }
      case 'bathroom':
        windowAt(p, w * 0.62, h * 0.1, w * 0.14, h * 0.24);
        break;
      case 'kitchen':
        windowAt(p, w * 0.33, h * 0.09, w * 0.2, h * 0.26, C.coral);
        break;
      case 'hall': {
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
        p.line(sx - 4, fy - shh - 34, w, fy - steps * shh - 40, { strokeWidth: 3, stroke: C.walnutDark });
        break;
      }
      case 'living':
        windowAt(p, w * 0.42, h * 0.06, w * 0.18, h * 0.18);
        p.ellipse(w * 0.5, h * 0.925, w * 0.66, h * 0.12, { fill: C.blush, strokeWidth: 1.2 }); // rug
        plant(p, w * 0.285, h * 0.9, 1);
        break;
      case 'workshop':
        bulb(p, w * 0.66, 0, h * 0.08);
        break;
      case 'den':
        p.path(`M${w * 0.4},${h * 0.94} Q${w * 0.36},${h * 0.7} ${w * 0.5},${h * 0.7} Q${w * 0.66},${h * 0.72} ${w * 0.62},${h * 0.94} Z`, { fill: C.mustard }); // bean bag
        break;
      case 'cellar':
        bulb(p, w * 0.46, 0, h * 0.1);
        break;
      case 'studio':
        windowAt(p, w * 0.08, h * 0.08, w * 0.2, h * 0.18);
        break;
      case 'library':
        windowAt(p, w * 0.42, h * 0.1, w * 0.16, h * 0.34, C.coral);
        break;
      case 'greenhouse':
        plant(p, w * 0.06, h * 0.9, 1.2);
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
