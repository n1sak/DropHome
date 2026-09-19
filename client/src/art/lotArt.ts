/**
 * Everything around the rooms: ground, soil, fence, tree, the house shell and
 * the roof. Replaceable as a whole with hand-drawn art (manifest: house.shell).
 */
import { type Geometry, ROOF_H } from '../model/layout';
import { Pen, rng, type P } from './sketch';

const cache = new Map<string, P[]>();

export function drawLot(geo: Geometry, seed = 7): P[] {
  const key = `${geo.lot.w}x${geo.lot.h}:${geo.groundY}:${geo.body.w}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const p = new Pen(seed, { roughness: 1 });
  const rand = rng(seed);
  const { lot, body, groundY, roof } = geo;
  const right = body.x + body.w;

  /* ground */
  p.rect(-5000, groundY, lot.w + 10000, lot.h - groundY + 3000, { fill: 'var(--soil)', stroke: 'none', roughness: 0 });
  for (let i = 0; i < 90; i++) {
    const x = -700 + rand() * (lot.w + 1400);
    const y = groundY + 26 + rand() * (lot.h - groundY - 30);
    if (x > body.x - 10 && x < right + 10 && y < body.y + body.h + 8) continue;
    p.ellipse(x, y, 6 + rand() * 12, 4 + rand() * 6, { fill: 'var(--soil-dark)', stroke: 'none', roughness: 0.8 });
  }
  // a little something buried on each side
  p.ellipse(body.x - 150, Math.min(lot.h - 40, groundY + 120), 34, 18, { fill: '#B9B4AA', strokeWidth: 1.1 });
  p.rect(right + 120, Math.min(lot.h - 60, groundY + 140), 38, 24, { fill: '#97654A', strokeWidth: 1.1 });
  p.rect(right + 120 + 14, Math.min(lot.h - 60, groundY + 140) + 8, 10, 9, { fill: '#E6BA43', strokeWidth: 0.9 });

  /* fence behind the yard */
  const fenceTop = groundY - 46;
  const runs: [number, number][] = [
    [-460, body.x - 196],
    [right + 168, lot.w + 460],
  ];
  for (const [from, to] of runs) {
    p.line(from, fenceTop + 14, to, fenceTop + 14, { strokeWidth: 3, stroke: 'var(--fence)' });
    p.line(from, fenceTop + 34, to, fenceTop + 34, { strokeWidth: 3, stroke: 'var(--fence)' });
    for (let x = from + 6; x < to - 8; x += 16) {
      p.poly([[x, groundY], [x, fenceTop + 6], [x + 5, fenceTop], [x + 10, fenceTop + 6], [x + 10, groundY]], { fill: 'var(--fence)', strokeWidth: 1, roughness: 0.6 });
    }
  }

  /* tree */
  const tx = right + 212;
  p.path(`M${tx - 9},${groundY} L${tx - 6},${groundY - 110} L${tx + 8},${groundY - 110} L${tx + 11},${groundY} Z`, { fill: '#97654A' });
  p.line(tx + 2, groundY - 86, tx + 34, groundY - 118, { strokeWidth: 5, stroke: '#97654A' });
  p.circle(tx - 30, groundY - 142, 96, { fill: 'var(--leaf)' });
  p.circle(tx + 34, groundY - 150, 104, { fill: 'var(--leaf)' });
  p.circle(tx + 2, groundY - 196, 104, { fill: 'var(--leaf-light)' });
  for (const [ax, ay] of [[-34, -128], [22, -170], [46, -128], [-4, -214]] as const) p.circle(tx + ax, groundY + ay, 9, { fill: '#D8503F', strokeWidth: 0.9 });

  /* bushes and flowers by the mailbox */
  const bx = body.x - 236;
  p.circle(bx - 8, groundY - 16, 40, { fill: 'var(--leaf)' });
  p.circle(bx + 22, groundY - 12, 32, { fill: 'var(--leaf-light)' });
  for (const [fx, c] of [[-16, '#EBA9A9'], [2, '#E6BA43'], [24, '#FBFAF6']] as const) p.circle(bx + fx, groundY - 24 - Math.abs(fx) * 0.2, 8, { fill: c, strokeWidth: 0.8 });

  /* grass */
  p.rect(-5000, groundY - 5, lot.w + 10000, 13, { fill: 'var(--grass)', stroke: 'none', roughness: 0 });
  p.line(-5000, groundY - 5, body.x, groundY - 5, { strokeWidth: 1.2, roughness: 0.3 });
  p.line(right, groundY - 5, lot.w + 5000, groundY - 5, { strokeWidth: 1.2, roughness: 0.3 });
  for (let i = 0; i < 70; i++) {
    const x = -500 + rand() * (lot.w + 1000);
    if (x > body.x - 4 && x < right + 4) continue;
    p.line(x, groundY - 4, x + (rand() - 0.5) * 6, groundY - 11 - rand() * 5, { stroke: 'var(--leaf)', strokeWidth: 1.2 });
  }

  /* chimney, tucked behind the roof */
  const slope = ROOF_H / (roof.right.x - roof.apex.x);
  const cx = roof.apex.x + 236;
  const roofYAt = roof.apex.y + (cx - roof.apex.x) * slope;
  p.rect(cx, roofYAt - 62, 46, 96, { fill: '#C9694F' });
  for (let y = roofYAt - 50; y < roofYAt + 20; y += 12) p.line(cx, y, cx + 46, y, { stroke: '#9E4B37', strokeWidth: 0.8, roughness: 0.5 });
  p.rect(cx - 5, roofYAt - 70, 56, 10, { fill: '#E9E4DA' });

  /* house shell */
  p.rect(body.x - 7, body.y + body.h - 8, body.w + 14, 16, { fill: '#B9B4AA' }); // footing
  p.rect(body.x, body.y, body.w, body.h, { fill: '#EFE9DD' });

  /* roof */
  p.poly(
    [
      [roof.apex.x, roof.apex.y],
      [roof.right.x, roof.right.y],
      [roof.left.x, roof.left.y],
    ],
    { fill: 'var(--roof)' },
  );
  for (let y = roof.apex.y + 26; y < roof.right.y - 4; y += 20) {
    const half = (y - roof.apex.y) / slope - 8;
    p.line(roof.apex.x - half, y, roof.apex.x + half, y, { stroke: 'var(--roof-line)', strokeWidth: 1, roughness: 0.8 });
    const offset = (Math.round(y / 20) % 2) * 14;
    for (let x = roof.apex.x - half + offset; x < roof.apex.x + half; x += 28) p.line(x, y, x, Math.min(y + 20, roof.right.y - 4), { stroke: 'var(--roof-line)', strokeWidth: 0.8, roughness: 0.5 });
  }
  p.rect(roof.left.x - 4, roof.left.y - 5, roof.right.x - roof.left.x + 8, 11, { fill: '#FBFAF6' }); // fascia

  if (cache.size > 12) cache.clear();
  cache.set(key, p.out);
  return p.out;
}
