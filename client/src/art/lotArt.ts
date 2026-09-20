/**
 * Everything around the rooms: ground, soil, a tree, the house shell and
 * the roof. Replaceable as a whole with hand-drawn art (manifest: house.shell).
 */
import { type Geometry, ROOF_H } from '../model/layout';
import { C } from './palette';
import { INK, Pen, rng, type P } from './sketch';

const cache = new Map<string, P[]>();

/** A tuft of grass: a few blades fanning out of one spot. */
function tuft(p: Pen, x: number, y: number, s: number) {
  const pts: [number, number][] = [
    [x - 9 * s, y],
    [x - 7 * s, y - 13 * s],
    [x - 3 * s, y - 4 * s],
    [x, y - 19 * s],
    [x + 3 * s, y - 4 * s],
    [x + 8 * s, y - 12 * s],
    [x + 9 * s, y],
  ];
  p.poly(pts, { fill: 'var(--leaf-light)', stroke: 'var(--leaf-line)', strokeWidth: 1.3, roughness: 0.5 });
}

export function drawLot(geo: Geometry, seed = 7): P[] {
  const key = `${geo.lot.w}x${geo.lot.h}:${geo.groundY}:${geo.body.w}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const p = new Pen(seed, { roughness: 0.8 });
  const rand = rng(seed);
  const { lot, body, groundY, roof } = geo;
  const right = body.x + body.w;

  /* ground */
  p.rect(-5000, groundY, lot.w + 10000, lot.h - groundY + 3000, { fill: 'var(--soil)', stroke: 'none', roughness: 0 });
  for (let i = 0; i < 22; i++) {
    const x = -700 + rand() * (lot.w + 1400);
    const y = groundY + 26 + rand() * (lot.h - groundY - 30);
    if (x > body.x - 14 && x < right + 14 && y < body.y + body.h + 10) continue;
    p.ellipse(x, y, 7 + rand() * 12, 4 + rand() * 5, { fill: 'var(--soil-dark)', stroke: 'none', roughness: 0.6 });
  }
  /* tree */
  const tx = right + 212;
  p.path(`M${tx - 10},${groundY} L${tx - 6},${groundY - 112} L${tx + 8},${groundY - 112} L${tx + 12},${groundY} Z`, { fill: 'var(--trunk)', stroke: 'var(--trunk-line)' });
  p.line(tx + 3, groundY - 86, tx + 34, groundY - 118, { strokeWidth: 5, stroke: 'var(--trunk-line)' });
  p.circle(tx - 30, groundY - 142, 96, { fill: 'var(--leaf)', stroke: 'var(--leaf-line)' });
  p.circle(tx + 34, groundY - 150, 104, { fill: 'var(--leaf)', stroke: 'var(--leaf-line)' });
  p.circle(tx + 2, groundY - 196, 104, { fill: 'var(--leaf-light)', stroke: 'var(--leaf-line)' });
  for (const [ax, ay] of [[-34, -128], [22, -170], [46, -128], [-4, -214]] as const) p.circle(tx + ax, groundY + ay, 10, { fill: C.coral, strokeWidth: 1 });

  /* bushes and flowers by the mailbox */
  const bx = body.x - 236;
  p.circle(bx - 8, groundY - 16, 40, { fill: 'var(--leaf)', stroke: 'var(--leaf-line)' });
  p.circle(bx + 22, groundY - 12, 32, { fill: 'var(--leaf-light)', stroke: 'var(--leaf-line)' });
  for (const [fx, c] of [[-16, C.pink], [2, C.mustard], [24, C.white]] as const) p.circle(bx + fx, groundY - 24 - Math.abs(fx) * 0.2, 9, { fill: c, strokeWidth: 0.9 });

  /* grass */
  p.rect(-5000, groundY - 5, lot.w + 10000, 13, { fill: 'var(--grass)', stroke: 'none', roughness: 0 });
  p.line(-5000, groundY - 5, body.x, groundY - 5, { strokeWidth: 1.4, roughness: 0.3, stroke: 'var(--leaf-line)' });
  p.line(right, groundY - 5, lot.w + 5000, groundY - 5, { strokeWidth: 1.4, roughness: 0.3, stroke: 'var(--leaf-line)' });
  for (let i = 0; i < 7; i++) {
    const x = -520 + rand() * (lot.w + 1040);
    if (x > body.x - 24 && x < right + 24) continue;
    tuft(p, x, groundY - 4, 0.7 + rand() * 0.5);
  }

  /* chimney, tucked behind the roof */
  const slope = ROOF_H / (roof.right.x - roof.apex.x);
  const cx = roof.apex.x + 236;
  const roofYAt = roof.apex.y + (cx - roof.apex.x) * slope;
  p.rect(cx, roofYAt - 62, 46, 96, { fill: 'var(--chimney)', stroke: INK });
  for (let y = roofYAt - 46; y < roofYAt + 20; y += 13) p.line(cx + 2, y, cx + 44, y, { stroke: 'var(--chimney-line)', strokeWidth: 1, roughness: 0.4 });
  p.rect(cx - 6, roofYAt - 72, 58, 12, { fill: 'var(--roof)', stroke: INK });

  /* house shell: the brown frame every room sits in */
  p.rect(body.x - 8, body.y + body.h - 8, body.w + 16, 17, { fill: 'var(--frame-dark)', stroke: INK, strokeWidth: 1.8 }); // footing
  p.rect(body.x, body.y, body.w, body.h, { fill: 'var(--frame)', stroke: INK, strokeWidth: 1.8 });

  /* roof: fish-scale tiles on one lattice, so the rows interlock */
  p.poly(
    [
      [roof.apex.x, roof.apex.y],
      [roof.right.x, roof.right.y],
      [roof.left.x, roof.left.y],
    ],
    { fill: 'var(--roof)', stroke: INK, strokeWidth: 2 },
  );
  const R = 15;
  const rows: { y: number; from: number; to: number; odd: boolean }[] = [];
  for (let k = 0, y = roof.apex.y + 34; y < roof.right.y - R - 8; y += R, k++) {
    const half = (y - roof.apex.y) / slope - 9;
    const odd = k % 2 === 1;
    const shift = odd ? R : 0;
    // tile edges sit at apex.x + shift + i * 2R: keep the ones that fit under the slope
    const iMin = Math.ceil((-half - shift) / (2 * R));
    const iMax = Math.floor((half - shift) / (2 * R));
    if (iMax - iMin < 1) continue;
    rows.push({ y, from: roof.apex.x + shift + iMin * 2 * R, to: roof.apex.x + shift + iMax * 2 * R, odd });
  }
  for (const row of rows) {
    let d = `M${row.from},${row.y}`;
    for (let x = row.from; x < row.to - 1; x += 2 * R) d += ` a${R},${R} 0 0 0 ${2 * R},0`;
    p.path(d, { stroke: 'var(--roof-line)', strokeWidth: 1.1, roughness: 0.35, bowing: 0.4 });
  }
  p.rect(roof.left.x - 5, roof.left.y - 6, roof.right.x - roof.left.x + 10, 13, { fill: 'var(--frame)', stroke: INK, strokeWidth: 1.8 }); // eave beam

  if (cache.size > 12) cache.clear();
  cache.set(key, p.out);
  return p.out;
}
