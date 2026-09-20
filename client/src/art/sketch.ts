/**
 * A tiny pen on top of rough.js. Every drawing in DropHome goes through here,
 * which is what gives rooms and furniture the same look: one confident, slightly
 * wobbly marker line around a flat fill, and the line is a darker shade of
 * whatever it surrounds (brown around wood, deep red around a curtain).
 * Deterministic: the same seed always draws the same lines.
 */
import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';

/** The structural line: house frame, room edges, anything without a fill of its own. */
export const INK = '#2E2430';

/** Thin lines get a little heavier so they still read from the street. */
const WEIGHT = 1.22;

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
    const merged: Options = {
      roughness: 0.7,
      bowing: 1,
      strokeWidth: 1.6,
      fillStyle: 'solid',
      maxRandomnessOffset: 1.4,
      fixedDecimalPlaceDigits: 1,
      hachureGap: 5,
      fillWeight: 0.8,
      disableMultiStroke: true,
      disableMultiStrokeFill: true,
      preserveVertices: true,
      ...this.base,
      ...o,
      seed: this.seed * 131 + this.n * 17 + 1,
    };
    // the line takes its colour from what it surrounds, unless the caller chose one
    if (merged.stroke === undefined) merged.stroke = merged.fill && merged.fill !== 'none' ? outlineFor(merged.fill) : INK;
    const sw = merged.strokeWidth ?? 1.6;
    merged.strokeWidth = sw <= 2.6 ? sw * WEIGHT : sw;
    return merged;
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

function toHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

const outlines = new Map<string, string>();

/**
 * The line colour for a fill: same family, much darker. Whites and greys get a
 * warm brown, yellows and tans lean toward red-brown (the way a brown marker
 * looks over yellow), and anything already dark just gets ink.
 */
export function outlineFor(fill: string): string {
  const hit = outlines.get(fill);
  if (hit) return hit;
  let out = INK;
  const hsl = toHsl(fill);
  if (hsl) {
    let [h, s] = hsl;
    const l = hsl[2];
    if (l < 0.36) out = INK;
    else if (l > 0.9 || s < 0.16) out = '#7B625A';
    else {
      if (h >= 22 && h <= 70) h = 17 + (h - 22) * 0.42;
      const blue = h > 180 && h < 280;
      s = Math.min(blue ? 0.42 : 0.6, s * 0.9 + 0.06);
      out = fromHsl(h, s, Math.max(0.22, Math.min(0.34, l * 0.43)));
    }
  }
  if (outlines.size > 600) outlines.clear();
  outlines.set(fill, out);
  return out;
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
