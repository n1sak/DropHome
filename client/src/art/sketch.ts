/**
 * A tiny pen on top of rough.js. Every placeholder drawing in Roomy goes
 * through here, which is what gives rooms and furniture the same wobbly,
 * hand-inked look. Deterministic: the same seed always draws the same lines.
 */
import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';

export const INK = '#2A2F45';

/** One SVG path, ready to render. */
export interface P {
  d: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  o?: number;
}

export type PenOptions = Options & { opacity?: number };

const gen = rough.generator();

export class Pen {
  out: P[] = [];
  private n = 0;

  constructor(
    private seed: number,
    private base: PenOptions = {},
  ) {}

  private opts(o?: PenOptions): Options {
    this.n += 1;
    return {
      roughness: 0.9,
      bowing: 0.8,
      stroke: INK,
      strokeWidth: 1.5,
      fillStyle: 'solid',
      maxRandomnessOffset: 1.5,
      fixedDecimalPlaceDigits: 1,
      hachureGap: 5,
      fillWeight: 0.8,
      ...this.base,
      ...o,
      seed: this.seed * 131 + this.n * 17 + 1,
    };
  }

  private push(drawable: ReturnType<typeof gen.rectangle>, o?: PenOptions): this {
    const opacity = o?.opacity ?? this.base.opacity;
    for (const p of gen.toPaths(drawable)) {
      const stroke = p.stroke && p.stroke !== 'none' ? p.stroke : undefined;
      const fill = p.fill && p.fill !== 'none' ? p.fill : undefined;
      if (!stroke && !fill) continue;
      this.out.push({ d: p.d, fill, stroke, sw: stroke ? p.strokeWidth : undefined, o: opacity });
    }
    return this;
  }

  rect(x: number, y: number, w: number, h: number, o?: PenOptions): this {
    const oo = this.calm(Math.min(w, h) * 1.6, o);
    return this.push(gen.rectangle(x, y, w, h, this.opts(oo)), oo);
  }

  /** Rounded rectangle. */
  rrect(x: number, y: number, w: number, h: number, r: number, o?: PenOptions): this {
    const rr = Math.min(r, w / 2, h / 2);
    const d = `M${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} L${x + rr},${y + h} Q${x},${y + h} ${x},${y + h - rr} L${x},${y + rr} Q${x},${y} ${x + rr},${y} Z`;
    return this.push(gen.path(d, this.opts(o)), o);
  }

  line(x1: number, y1: number, x2: number, y2: number, o?: PenOptions): this {
    return this.push(gen.line(x1, y1, x2, y2, this.opts(o)), o);
  }

  /** Small shapes get a steadier hand, or they turn into scribbles. */
  private calm(size: number, o?: PenOptions): PenOptions | undefined {
    if (size >= 22 || o?.roughness !== undefined) return o;
    return { ...o, roughness: Math.max(0.25, (size / 22) * 0.8), bowing: 0.4 };
  }

  ellipse(cx: number, cy: number, w: number, h: number, o?: PenOptions): this {
    const oo = this.calm(Math.min(w, h), o);
    return this.push(gen.ellipse(cx, cy, w, h, this.opts(oo)), oo);
  }

  circle(cx: number, cy: number, d: number, o?: PenOptions): this {
    const oo = this.calm(d, o);
    return this.push(gen.circle(cx, cy, d, this.opts(oo)), oo);
  }

  poly(points: [number, number][], o?: PenOptions): this {
    return this.push(gen.polygon(points, this.opts(o)), o);
  }

  /** Open polyline. */
  lines(points: [number, number][], o?: PenOptions): this {
    return this.push(gen.linearPath(points, this.opts(o)), o);
  }

  curve(points: [number, number][], o?: PenOptions): this {
    return this.push(gen.curve(points, this.opts(o)), o);
  }

  arc(cx: number, cy: number, w: number, h: number, start: number, stop: number, closed = false, o?: PenOptions): this {
    return this.push(gen.arc(cx, cy, w, h, start, stop, closed, this.opts(o)), o);
  }

  path(d: string, o?: PenOptions): this {
    return this.push(gen.path(d, this.opts(o)), o);
  }
}

/** Deterministic pseudo-random numbers for decoration (book heights, plank seams...). */
export function rng(seed: number): () => number {
  let s = (seed * 2654435761) % 4294967296 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

/** Mix a hex colour toward white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const ch = (v: number) => Math.round(v + (target - v) * t);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
