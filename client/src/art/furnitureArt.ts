/**
 * The furniture, drawn with the pen in sketch.ts and coloured from palette.ts.
 *
 * Each piece is a list of PARTS. A part can carry a "closed" and an "open"
 * transform, so opening a closet is just a CSS class flip: the doors swing, the
 * drawer slides, the lid lifts. SLOTS are rectangles where live content is
 * laid over the drawing: the TV picture, photos in frames, notes on the fridge.
 *
 * When hand-drawn art exists for a piece (see art/customArt.ts) none of this
 * runs for it. Units are lot pixels: a desk is roughly 176 x 105.
 */
import type { FurnitureKind } from '../model/types';
import { Pen, rng, shade, INK, type P } from './sketch';
import { C, BOOKS } from './palette';

export interface Part {
  key: string;
  paths: P[];
  closed?: string;
  open?: string;
  origin?: string;
  closedOpacity?: number;
  openOpacity?: number;
  delay?: number;
  cls?: string;
}

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  shape?: 'rect' | 'oval' | 'screen';
}

export interface FurnitureArt {
  parts: Part[];
  slots: Slot[];
}

export interface ArtCtx {
  w: number;
  h: number;
  seed: number;
  /** How many files are inside. The porch draws packages, the mailbox raises its flag. */
  count: number;
}

type Draw = (p: Pen) => void;

class Builder {
  parts: Part[] = [];
  slots: Slot[] = [];
  rand: () => number;

  constructor(
    public w: number,
    public h: number,
    public seed: number,
    public count: number,
  ) {
    this.rand = rng(seed + 3);
  }

  add(key: string, draw: Draw, anim: Omit<Part, 'key' | 'paths'> = {}): this {
    const pen = new Pen(this.seed + this.parts.length * 7 + 1);
    draw(pen);
    this.parts.push({ key, paths: pen.out, ...anim });
    return this;
  }

  slot(s: Slot): this {
    this.slots.push(s);
    return this;
  }

  done(): FurnitureArt {
    return { parts: this.parts, slots: this.slots };
  }
}

/* ---------- shared building blocks ---------- */

/** Swinging doors over a cavity. The cavity itself is drawn by the caller. */
function doors(
  b: Builder,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { double?: boolean; color: string; handle?: 'knob' | 'bar'; panel?: boolean; hinge?: 'left' | 'right'; key?: string },
) {
  const leaf = (lx: number, lw: number, side: 'left' | 'right', key: string) => {
    b.add(
      key,
      (p) => {
        p.rect(lx, y, lw, h, { fill: o.color });
        if (o.panel !== false) {
          const m = Math.min(7, lw * 0.14);
          p.rect(lx + m, y + m, lw - m * 2, h * 0.52 - m, { fill: shade(o.color, 0.12), strokeWidth: 1 });
          p.rect(lx + m, y + h * 0.52 + m * 0.4, lw - m * 2, h * 0.48 - m * 1.4, { fill: shade(o.color, 0.12), strokeWidth: 1 });
        }
        const hx = side === 'left' ? lx + lw - 7 : lx + 7;
        if (o.handle === 'bar') p.rrect(hx - 2, y + h * 0.38, 4, h * 0.24, 2, { fill: C.steelDark, strokeWidth: 1 });
        else p.circle(hx, y + h * 0.5, 6.5, { fill: C.mustard, strokeWidth: 1 });
      },
      {
        open: side === 'left' ? 'scaleX(0.13) skewY(-7deg)' : 'scaleX(0.13) skewY(7deg)',
        origin: side === 'left' ? '0% 50%' : '100% 50%',
      },
    );
  };
  if (o.double) {
    leaf(x, w / 2, 'left', (o.key ?? 'door') + '-l');
    leaf(x + w / 2, w / 2, 'right', (o.key ?? 'door') + '-r');
  } else {
    leaf(x, w, o.hinge ?? 'left', o.key ?? 'door');
  }
}

/** A stack of drawers. One of them opens. */
function drawers(b: Builder, x: number, y: number, w: number, h: number, n: number, openIndex: number, color: string, handle: 'knob' | 'bar' = 'knob') {
  const dh = h / n;
  for (let i = 0; i < n; i++) {
    const dy = y + i * dh;
    const isOpen = i === openIndex;
    if (isOpen) {
      // what you see inside when the front slides away
      b.add(`inside-${i}`, (p) => {
        p.rect(x + 3, dy + 1, w - 6, dh * 0.62, { fill: C.cavity, strokeWidth: 1 });
      });
      b.add(
        `papers-${i}`,
        (p) => {
          const step = (w - 16) / 5;
          for (let k = 0; k < 5; k++) {
            p.rect(x + 8 + k * step, dy + 3 + (k % 2) * 2, step - 2, dh * 0.5, { fill: k % 3 === 0 ? C.mustard : C.paper, strokeWidth: 0.8 });
          }
        },
        { closed: 'translateY(30%)', open: 'translateY(-8%)', delay: 120 },
      );
    }
    b.add(
      `drawer-${i}`,
      (p) => {
        p.rect(x + 2, dy + 2, w - 4, dh - 4, { fill: color });
        if (handle === 'bar') p.rrect(x + w * 0.32, dy + dh * 0.42, w * 0.36, 4, 2, { fill: C.steelDark, strokeWidth: 1 });
        else {
          p.circle(x + w * 0.5, dy + dh * 0.5, 7, { fill: C.mustard, strokeWidth: 1 });
        }
      },
      isOpen ? { open: `translateY(${Math.round(dh * 0.5)}px) scale(1.05)`, origin: '50% 0%' } : {},
    );
  }
}

/** Books (or albums, or tapes) along a shelf. */
function spines(p: Pen, rand: () => number, x: number, baseY: number, w: number, maxH: number, o: { minW: number; maxW: number; lean?: boolean; palette?: string[] }) {
  const palette = o.palette ?? BOOKS;
  let cx = x + 2;
  const end = x + w - 3;
  while (cx < end - o.minW) {
    const bw = Math.min(end - cx, o.minW + rand() * (o.maxW - o.minW));
    const bh = maxH * (0.62 + rand() * 0.36);
    const color = palette[Math.floor(rand() * palette.length)];
    if (rand() < 0.12) {
      cx += bw * 0.9; // a gap on the shelf
      continue;
    }
    p.rect(cx, baseY - bh, bw, bh, { fill: color, strokeWidth: 1, roughness: 0.6 });
    if (bw > 6) p.line(cx + 1.5, baseY - bh * 0.78, cx + bw - 1.5, baseY - bh * 0.78, { stroke: shade(color, 0.45), strokeWidth: 0.9, roughness: 0.4 });
    cx += bw + 0.6;
  }
}

function lampOn(b: Builder, cx: number, topY: number, spread: number, drop: number) {
  b.add(
    'light',
    (p) => {
      p.poly(
        [
          [cx - 8, topY],
          [cx + 8, topY],
          [cx + spread, topY + drop],
          [cx - spread, topY + drop],
        ],
        { fill: C.lamp, stroke: 'none', roughness: 0.4 },
      );
    },
    { closedOpacity: 0, openOpacity: 0.42 },
  );
}

/* ---------- the pieces ---------- */

function desk(b: Builder) {
  const { w, h } = b;
  const top = h * 0.44;
  lampOn(b, w * 0.16, top - 30, 40, 32);
  b.add('body', (p) => {
    p.rect(w * 0.86, top + 6, 7, h - top - 6, { fill: C.oakDark }); // right leg
    p.rect(w * 0.36, top + 22, w * 0.5, 5, { fill: C.oakDark, strokeWidth: 1 }); // stretcher
    p.rect(w * 0.04, top + 6, w * 0.32, h - top - 6, { fill: C.oak }); // pedestal
    p.rect(-2, top, w + 4, 8, { fill: C.oakDark }); // tabletop
    // lamp
    p.ellipse(w * 0.16, top - 2, 20, 5, { fill: C.charcoal, strokeWidth: 1 });
    p.lines([[w * 0.16, top - 3], [w * 0.13, top - 22], [w * 0.16, top - 34]], { strokeWidth: 2 });
    p.poly([[w * 0.16 - 12, top - 28], [w * 0.16 + 12, top - 28], [w * 0.16 + 7, top - 42], [w * 0.16 - 7, top - 42]], { fill: C.peri });
    // laptop
    p.rrect(w * 0.4, top - 36, 50, 32, 3, { fill: C.charcoal });
    p.rect(w * 0.4 + 4, top - 33, 42, 25, { fill: C.screen, strokeWidth: 0.8 });
    p.line(w * 0.4 + 9, top - 26, w * 0.4 + 30, top - 26, { stroke: C.denim, strokeWidth: 1.2 });
    p.line(w * 0.4 + 9, top - 20, w * 0.4 + 38, top - 20, { stroke: C.denim, strokeWidth: 1.2 });
    p.rrect(w * 0.37, top - 5, 62, 5, 2, { fill: C.steel });
    // mug with pencils
    p.rect(w * 0.29, top - 14, 11, 14, { fill: C.coral, strokeWidth: 1 });
    p.line(w * 0.31, top - 14, w * 0.3, top - 24, { stroke: C.mustard, strokeWidth: 2 });
    p.line(w * 0.335, top - 14, w * 0.35, top - 23, { stroke: C.denim, strokeWidth: 2 });
  });
  b.add(
    'papers',
    (p) => {
      p.poly([[w * 0.74, top - 3], [w * 0.97, top - 5], [w * 0.98, top - 1], [w * 0.75, top]], { fill: C.paper, strokeWidth: 1 });
      p.poly([[w * 0.73, top - 7], [w * 0.95, top - 8], [w * 0.96, top - 4], [w * 0.74, top - 3]], { fill: C.paperPink, strokeWidth: 1 });
      p.poly([[w * 0.75, top - 11], [w * 0.96, top - 12.5], [w * 0.97, top - 8], [w * 0.75, top - 7]], { fill: C.paper, strokeWidth: 1 });
    },
    { open: 'translate(-2px,-9px) rotate(-5deg)' },
  );
  drawers(b, w * 0.04, top + 8, w * 0.32, h - top - 12, 2, 0, C.oak);
}

function workbench(b: Builder) {
  const { w, h } = b;
  const top = h * 0.4;
  b.add('body', (p) => {
    p.rect(w * 0.05, top + 8, 10, h - top - 8, { fill: C.walnut });
    p.rect(w * 0.9, top + 8, 10, h - top - 8, { fill: C.walnut });
    p.rect(w * 0.05, h * 0.78, w * 0.9, 7, { fill: C.walnutDark });
    p.rect(w * 0.14, h * 0.62, w * 0.22, h * 0.16, { fill: C.card, strokeWidth: 1.2 });
    p.rect(w * 0.4, h * 0.66, w * 0.16, h * 0.12, { fill: C.coral, strokeWidth: 1.2 });
    p.rect(-3, top, w + 6, 11, { fill: C.oak });
    // vise
    p.rect(w * 0.02, top - 14, 22, 14, { fill: C.steelDark });
    p.line(w * 0.02 - 6, top - 7, w * 0.02 + 4, top - 7, { strokeWidth: 3 });
    // soldering iron + spool
    p.line(w * 0.7, top - 2, w * 0.86, top - 12, { stroke: C.mustard, strokeWidth: 3 });
    p.line(w * 0.86, top - 12, w * 0.92, top - 16, { strokeWidth: 1.6 });
    p.circle(w * 0.62, top - 7, 13, { fill: C.steel });
    p.circle(w * 0.62, top - 7, 5, { fill: C.charcoal, strokeWidth: 0.8 });
  });
  b.add(
    'robot',
    (p) => {
      const rx = w * 0.32;
      p.rrect(rx, top - 30, 30, 24, 4, { fill: C.peri });
      p.rrect(rx + 5, top - 46, 20, 16, 4, { fill: C.steel });
      p.circle(rx + 11, top - 38, 4, { fill: C.night, strokeWidth: 0.8 });
      p.circle(rx + 19, top - 38, 4, { fill: C.night, strokeWidth: 0.8 });
      p.line(rx + 15, top - 46, rx + 15, top - 54, { strokeWidth: 1.4 });
      p.circle(rx + 15, top - 56, 5, { fill: C.red, strokeWidth: 1 });
      p.rect(rx + 4, top - 6, 7, 6, { fill: C.charcoal, strokeWidth: 1 });
      p.rect(rx + 19, top - 6, 7, 6, { fill: C.charcoal, strokeWidth: 1 });
      p.line(rx + 8, top - 18, rx + 22, top - 18, { strokeWidth: 1.2 });
    },
    { open: 'translateY(-7px) rotate(-4deg)', origin: '50% 100%' },
  );
}

function coffeeTable(b: Builder) {
  const { w, h } = b;
  const top = h * 0.42;
  b.add('body', (p) => {
    p.rect(w * 0.08, top + 6, 7, h - top - 6, { fill: C.walnut });
    p.rect(w * 0.86, top + 6, 7, h - top - 6, { fill: C.walnut });
    p.rect(w * 0.08, h * 0.78, w * 0.85, 4, { fill: C.walnutDark, strokeWidth: 1 });
    p.rrect(-2, top, w + 4, 8, 3, { fill: C.walnut });
    p.rect(w * 0.74, top - 11, 11, 11, { fill: C.white, strokeWidth: 1 });
    p.arc(w * 0.74 + 11, top - 6, 8, 8, -Math.PI / 2, Math.PI / 2, false, { strokeWidth: 1.2 });
  });
  b.add(
    'photos',
    (p) => {
      const px = w * 0.2;
      p.poly([[px, top - 2], [px + 30, top - 4], [px + 31, top], [px + 1, top + 1]], { fill: C.paper, strokeWidth: 1 });
      p.poly([[px + 4, top - 7], [px + 35, top - 7.5], [px + 35, top - 3], [px + 4, top - 2.5]], { fill: C.paper, strokeWidth: 1 });
      p.poly([[px + 8, top - 6.5], [px + 31, top - 7], [px + 31, top - 4], [px + 8, top - 3.5]], { fill: C.peri, stroke: 'none' });
    },
    { open: 'translate(0,-7px) rotate(-6deg)' },
  );
}

function consoleTable(b: Builder) {
  const { w, h } = b;
  const top = h * 0.46;
  lampOn(b, w * 0.8, top - 34, 30, 34);
  b.add('body', (p) => {
    p.lines([[w * 0.1, top + 22], [w * 0.13, h]], { strokeWidth: 3.2, stroke: C.walnutDark });
    p.lines([[w * 0.9, top + 22], [w * 0.87, h]], { strokeWidth: 3.2, stroke: C.walnutDark });
    p.rect(w * 0.05, top + 6, w * 0.9, 18, { fill: C.walnut });
    p.rrect(-1, top, w + 2, 7, 3, { fill: C.walnutDark });
    p.circle(w * 0.28, top + 15, 4, { fill: C.mustard, strokeWidth: 0.8 });
    p.circle(w * 0.72, top + 15, 4, { fill: C.mustard, strokeWidth: 0.8 });
    p.line(w * 0.5, top + 7, w * 0.5, top + 23, { strokeWidth: 1 });
    // key bowl
    p.arc(w * 0.22, top - 9, 30, 18, 0, Math.PI, true, { fill: C.peri });
    p.circle(w * 0.2, top - 11, 6, { strokeWidth: 1.2, stroke: C.mustard });
    p.line(w * 0.22, top - 9, w * 0.28, top - 14, { stroke: C.mustard, strokeWidth: 1.4 });
    // lamp
    p.rect(w * 0.8 - 2, top - 20, 4, 20, { fill: C.charcoal, strokeWidth: 1 });
    p.poly([[w * 0.8 - 13, top - 20], [w * 0.8 + 13, top - 20], [w * 0.8 + 8, top - 38], [w * 0.8 - 8, top - 38]], { fill: C.cream });
  });
  b.add(
    'letters',
    (p) => {
      const lx = w * 0.42;
      p.poly([[lx, top - 3], [lx + 26, top - 4], [lx + 26, top], [lx, top]], { fill: C.paper, strokeWidth: 1 });
      p.poly([[lx + 2, top - 8], [lx + 28, top - 8], [lx + 28, top - 4], [lx + 2, top - 3.5]], { fill: C.paperPink, strokeWidth: 1 });
      p.circle(lx + 22, top - 6, 3, { fill: C.red, stroke: 'none' });
    },
    { open: 'translate(0,-8px) rotate(5deg)' },
  );
}

function vanity(b: Builder) {
  const { w, h } = b;
  const mh = h * 0.5;
  const top = h * 0.62;
  b.add(
    'glow',
    (p) => {
      p.ellipse(w * 0.5, mh * 0.52, w * 1.15, mh * 1.12, { fill: C.lamp, stroke: 'none', roughness: 0.3 });
    },
    { closedOpacity: 0, openOpacity: 0.3 },
  );
  b.add('mirror', (p) => {
    p.ellipse(w * 0.5, mh * 0.52, w * 0.78, mh * 0.96, { fill: C.mustard });
    p.ellipse(w * 0.5, mh * 0.52, w * 0.64, mh * 0.82, { fill: C.glass, strokeWidth: 1 });
    p.line(w * 0.36, mh * 0.3, w * 0.46, mh * 0.2, { stroke: '#FFFFFF', strokeWidth: 2 });
    p.line(w * 0.34, mh * 0.42, w * 0.4, mh * 0.36, { stroke: '#FFFFFF', strokeWidth: 1.4 });
    // sconces
    p.rect(w * 0.02, mh * 0.34, 6, 16, { fill: C.cream, strokeWidth: 1 });
    p.rect(w * 0.98 - 6, mh * 0.34, 6, 16, { fill: C.cream, strokeWidth: 1 });
  });
  b.slot({ x: w * 0.22, y: mh * 0.14, w: w * 0.56, h: mh * 0.76, shape: 'oval' });
  b.add('cabinet', (p) => {
    p.rect(w * 0.08, top + 8, w * 0.84, h - top - 8, { fill: C.white });
    p.rect(w * 0.12, top + 12, w * 0.76, h - top - 18, { fill: C.cavity, strokeWidth: 1 });
    p.rect(w * 0.18, h * 0.84, 12, 14, { fill: C.peri, strokeWidth: 1 });
    p.rect(w * 0.36, h * 0.86, 10, 11, { fill: C.pink, strokeWidth: 1 });
    p.rect(w * 0.6, h * 0.82, 16, 18, { fill: C.cream, strokeWidth: 1 });
    p.rrect(0, top, w, 9, 3, { fill: C.cream });
    p.arc(w * 0.5, top, w * 0.4, 16, 0, Math.PI, false, { strokeWidth: 1.2 });
    p.lines([[w * 0.5, top], [w * 0.5, top - 12], [w * 0.58, top - 12], [w * 0.58, top - 7]], { strokeWidth: 2.4, stroke: C.steelDark });
  });
  doors(b, w * 0.12, top + 12, w * 0.76, h - top - 18, { double: true, color: C.white, panel: false });
}

function counter(b: Builder) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rect(0, 9, w, h - 9, { fill: C.cream });
    p.rect(0, h - 7, w, 7, { fill: C.charcoal, strokeWidth: 1 });
    // left bay door
    p.rect(w * 0.04, 16, w * 0.27, h - 28, { fill: C.peri });
    p.circle(w * 0.27, h * 0.5, 5, { fill: C.mustard, strokeWidth: 1 });
    // right bay door
    p.rect(w * 0.69, 16, w * 0.27, h - 28, { fill: C.peri });
    p.circle(w * 0.73, h * 0.5, 5, { fill: C.mustard, strokeWidth: 1 });
    // kettle + board on top
    p.rrect(w * 0.06, -18, 24, 20, 6, { fill: C.steel });
    p.arc(w * 0.06 + 12, -18, 18, 14, Math.PI, Math.PI * 2, false, { strokeWidth: 1.6 });
    p.rect(w * 0.8, -24, 22, 26, { fill: C.oak, strokeWidth: 1.2 });
    p.rrect(-3, 0, w + 6, 10, 3, { fill: C.oakDark });
  });
  // junk poking out of the drawer even when shut
  b.add('junk', (p) => {
    p.curve([[w * 0.42, 22], [w * 0.4, 14], [w * 0.45, 12], [w * 0.47, 19]], { stroke: C.red, strokeWidth: 1.6 });
    p.line(w * 0.56, 22, w * 0.58, 13, { stroke: C.denim, strokeWidth: 2 });
  });
  drawers(b, w * 0.34, 14, w * 0.32, h - 24, 3, 0, C.peri);
}

function easel(b: Builder) {
  const { w, h } = b;
  b.add('legs', (p) => {
    p.line(w * 0.5, h * 0.04, w * 0.1, h, { strokeWidth: 3, stroke: C.oakDark });
    p.line(w * 0.5, h * 0.04, w * 0.9, h, { strokeWidth: 3, stroke: C.oakDark });
    p.line(w * 0.5, h * 0.04, w * 0.56, h * 0.96, { strokeWidth: 2.4, stroke: C.walnut });
    p.rect(w * 0.08, h * 0.66, w * 0.84, 6, { fill: C.oak, strokeWidth: 1.2 });
  });
  b.add(
    'canvas',
    (p) => {
      p.rect(w * 0.12, h * 0.14, w * 0.76, h * 0.52, { fill: C.paper });
      p.circle(w * 0.62, h * 0.3, w * 0.22, { fill: C.mustard, stroke: 'none' });
      p.poly([[w * 0.14, h * 0.64], [w * 0.4, h * 0.36], [w * 0.62, h * 0.64]], { fill: C.peri, stroke: 'none' });
      p.poly([[w * 0.42, h * 0.64], [w * 0.66, h * 0.44], [w * 0.86, h * 0.64]], { fill: C.denim, stroke: 'none' });
    },
    { open: 'scale(1.06) rotate(-2deg)' },
  );
}

function closet(b: Builder, color = C.white, trim = C.cream) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rect(0, 4, w, h - 4, { fill: trim });
    p.rect(-3, 0, w + 6, 9, { fill: shade(trim, -0.08) });
    p.rect(6, 14, w - 12, h - 26, { fill: C.cavity, strokeWidth: 1 });
    // rail + hanging clothes
    p.line(8, 26, w - 8, 26, { stroke: C.steel, strokeWidth: 2 });
    const colors = [C.denim, C.coral, C.mustard, C.peri, C.rose];
    const n = Math.max(3, Math.floor((w - 20) / 14));
    for (let i = 0; i < n; i++) {
      const cx = 12 + i * ((w - 24) / n);
      const len = h * (0.22 + ((i * 37) % 17) / 100);
      p.rect(cx, 28, (w - 24) / n - 3, len, { fill: colors[i % colors.length], strokeWidth: 0.9 });
    }
    // shelf + boxes
    p.line(6, h * 0.64, w - 6, h * 0.64, { stroke: C.oak, strokeWidth: 3 });
    p.rect(12, h * 0.68, w * 0.36, h * 0.2, { fill: C.card, strokeWidth: 1 });
    p.rect(w * 0.54, h * 0.72, w * 0.32, h * 0.16, { fill: C.cardDark, strokeWidth: 1 });
    p.rect(14, h * 0.55, w * 0.3, h * 0.09, { fill: C.paper, strokeWidth: 0.9 });
  });
  doors(b, 6, 14, w - 12, h - 26, { double: true, color });
}

function wardrobe(b: Builder) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rect(0, 8, w, h - 8, { fill: C.walnut });
    p.arc(w / 2, 10, w + 4, 22, Math.PI, Math.PI * 2, true, { fill: C.walnutDark });
    p.rect(6, 18, w - 12, h * 0.68, { fill: C.cavity, strokeWidth: 1 });
    p.line(8, 30, w - 8, 30, { stroke: C.steel, strokeWidth: 2 });
    const colors = [C.pink, C.cream, C.peri, C.denim];
    for (let i = 0; i < 4; i++) {
      p.rect(12 + i * ((w - 26) / 4), 32, (w - 26) / 4 - 3, h * (0.3 + (i % 2) * 0.12), { fill: colors[i], strokeWidth: 0.9 });
    }
    p.rect(12, h * 0.6, w - 26, h * 0.08, { fill: C.paper, strokeWidth: 0.9 });
    p.rect(3, h - 8, 8, 8, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(w - 11, h - 8, 8, 8, { fill: C.walnutDark, strokeWidth: 1 });
  });
  doors(b, 6, 18, w - 12, h * 0.68, { double: true, color: C.walnut });
  drawers(b, 5, h * 0.74, w - 10, h * 0.22, 1, -1, C.walnut);
}

function pantry(b: Builder) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rect(0, 4, w, h - 4, { fill: C.peach });
    p.rect(-3, 0, w + 6, 8, { fill: shade(C.peach, -0.1) });
    p.rect(6, 14, w - 12, h - 26, { fill: C.cavity, strokeWidth: 1 });
    const jars = [C.mustard, C.coral, C.cream, C.leaf, C.pink, C.peri];
    for (let s = 0; s < 4; s++) {
      const sy = 14 + ((h - 26) / 4) * (s + 1);
      p.line(6, sy, w - 6, sy, { stroke: C.oak, strokeWidth: 2.6 });
      const n = 3 + (s % 2);
      for (let i = 0; i < n; i++) {
        const jw = (w - 22) / n - 3;
        const jh = ((h - 26) / 4) * (0.5 + ((i + s) % 3) * 0.12);
        p.rrect(11 + i * (jw + 3), sy - jh - 1, jw, jh, 3, { fill: jars[(i + s * 2) % jars.length], strokeWidth: 0.9 });
      }
    }
  });
  doors(b, 6, 14, w - 12, h - 26, { double: true, color: C.peach });
}

function fridge(b: Builder) {
  const { w, h } = b;
  const split = h * 0.3;
  b.add('body', (p) => {
    p.rrect(0, 0, w, h - 4, 7, { fill: C.steel });
    p.rect(5, h - 6, 10, 6, { fill: C.charcoal, strokeWidth: 1 });
    p.rect(w - 15, h - 6, 10, 6, { fill: C.charcoal, strokeWidth: 1 });
    p.rect(5, split + 4, w - 10, h - split - 14, { fill: '#EAF0FB', strokeWidth: 1 });
    const food = [C.leaf, C.red, C.mustard, C.white, C.pink];
    for (let s = 0; s < 3; s++) {
      const sy = split + 4 + ((h - split - 14) / 3) * (s + 1) - 2;
      p.line(6, sy, w - 6, sy, { stroke: C.steelDark, strokeWidth: 1.6 });
      for (let i = 0; i < 3; i++) {
        const fw = (w - 22) / 3;
        p.rrect(9 + i * (fw + 2), sy - 12 - ((i + s) % 2) * 8, fw, 11 + ((i + s) % 2) * 8, 3, { fill: food[(i + s) % food.length], strokeWidth: 0.9 });
      }
    }
  });
  b.add('freezer', (p) => {
    p.rrect(3, 3, w - 6, split - 3, 5, { fill: '#F7F7FC' });
    p.rrect(w - 12, split * 0.3, 4, split * 0.45, 2, { fill: C.steelDark, strokeWidth: 1 });
  });
  b.add(
    'door',
    (p) => {
      p.rrect(3, split + 2, w - 6, h - split - 10, 5, { fill: '#F7F7FC' });
      p.rrect(w - 12, split + 12, 4, h * 0.2, 2, { fill: C.steelDark, strokeWidth: 1 });
    },
    { open: 'scaleX(0.14) skewY(-6deg)', origin: '0% 50%' },
  );
  const sw = (w - 22) / 2;
  b.slot({ x: 8, y: split + 14, w: sw, h: sw * 1.2, rot: -4 });
  b.slot({ x: 12 + sw, y: split + 22, w: sw, h: sw * 1.2, rot: 5 });
  b.slot({ x: 8, y: split + 20 + sw * 1.25, w: sw, h: sw * 1.2, rot: 3 });
  b.slot({ x: 12 + sw, y: split + 30 + sw * 1.25, w: sw, h: sw * 1.2, rot: -3 });
}

function wallCabinet(b: Builder) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rect(0, 0, w, h, { fill: C.white });
    p.rect(4, 4, w - 8, h - 8, { fill: C.cavity, strokeWidth: 1 });
    p.line(4, h * 0.52, w - 4, h * 0.52, { stroke: C.steel, strokeWidth: 2 });
    const colors = [C.peri, C.pink, C.mustard, C.cream, C.rose];
    for (let i = 0; i < 5; i++) {
      p.rrect(8 + i * ((w - 16) / 5), h * 0.52 - 16 - (i % 2) * 5, (w - 16) / 5 - 3, 15 + (i % 2) * 5, 2, { fill: colors[i], strokeWidth: 0.8 });
      p.rrect(8 + i * ((w - 16) / 5), h - 6 - 14 - ((i + 1) % 2) * 6, (w - 16) / 5 - 3, 13 + ((i + 1) % 2) * 6, 2, { fill: colors[(i + 2) % 5], strokeWidth: 0.8 });
    }
  });
  doors(b, 4, 4, w - 8, h - 8, { double: true, color: C.blush, panel: false });
}

function safe(b: Builder) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rrect(0, 0, w, h - 4, 5, { fill: C.charcoal });
    p.rect(4, h - 6, 9, 6, { fill: C.night, strokeWidth: 1 });
    p.rect(w - 13, h - 6, 9, 6, { fill: C.night, strokeWidth: 1 });
    p.rect(6, 6, w - 12, h - 16, { fill: C.night, strokeWidth: 1 });
    p.line(6, h * 0.48, w - 6, h * 0.48, { stroke: C.steelDark, strokeWidth: 1.6 });
    p.rect(10, h * 0.48 - 9, w * 0.4, 8, { fill: C.paper, strokeWidth: 0.8 });
    p.rect(w * 0.58, h * 0.48 - 7, w * 0.26, 6, { fill: C.mustard, strokeWidth: 0.8 });
    p.rect(10, h - 20, w * 0.5, 9, { fill: C.card, strokeWidth: 0.8 });
  });
  b.add(
    'door',
    (p) => {
      p.rrect(4, 4, w - 8, h - 12, 4, { fill: '#8690B4' });
      p.circle(w * 0.42, h * 0.45, Math.min(w, h) * 0.34, { fill: C.steel });
      p.circle(w * 0.42, h * 0.45, Math.min(w, h) * 0.12, { fill: C.charcoal, strokeWidth: 1 });
      p.line(w * 0.42, h * 0.45 - Math.min(w, h) * 0.17, w * 0.42, h * 0.45 - Math.min(w, h) * 0.1, { strokeWidth: 1.4 });
      p.rrect(w * 0.74, h * 0.3, 5, h * 0.3, 2, { fill: C.steel, strokeWidth: 1 });
    },
    { open: 'scaleX(0.14) skewY(-6deg)', origin: '0% 50%' },
  );
}

function nightstand(b: Builder) {
  const { w, h } = b;
  const top = h * 0.44;
  lampOn(b, w * 0.5, top - 30, w * 0.7, 30);
  b.add('body', (p) => {
    p.rect(3, h - 8, 6, 8, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(w - 9, h - 8, 6, 8, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(0, top + 5, w, h - top - 12, { fill: C.oak });
    p.rect(-2, top, w + 4, 6, { fill: C.oakDark });
    p.rect(w * 0.5 - 2, top - 16, 4, 16, { fill: C.charcoal, strokeWidth: 1 });
    p.poly([[w * 0.5 - 14, top - 14], [w * 0.5 + 14, top - 14], [w * 0.5 + 8, top - 34], [w * 0.5 - 8, top - 34]], { fill: C.pink });
  });
  drawers(b, 1, top + 7, w - 2, h - top - 17, 2, 0, C.oak);
}

function dresser(b: Builder) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rect(4, h - 8, 7, 8, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(w - 11, h - 8, 7, 8, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(0, 6, w, h - 14, { fill: C.pine });
    p.rect(-2, 0, w + 4, 7, { fill: C.oakDark });
    p.rrect(w * 0.12, -20, 16, 20, 5, { fill: C.peri, strokeWidth: 1.1 });
    p.curve([[w * 0.12 + 8, -20], [w * 0.12 + 2, -32], [w * 0.12 + 10, -40]], { stroke: C.leafDark, strokeWidth: 1.6 });
    p.curve([[w * 0.12 + 8, -20], [w * 0.12 + 16, -30], [w * 0.12 + 12, -38]], { stroke: C.leafDark, strokeWidth: 1.6 });
  });
  drawers(b, 2, 8, w - 4, h - 18, 3, 1, C.pine, 'bar');
}

function filingCabinet(b: Builder) {
  const { w, h } = b;
  b.add('body', (p) => {
    p.rect(0, 0, w, h, { fill: C.steel });
  });
  drawers(b, 1, 2, w - 2, h - 4, 3, 0, '#EDEFF7', 'bar');
}

function shelfUnit(b: Builder, o: { frame: string; back: string; shelves: number; style: 'books' | 'albums' | 'storage' | 'tapes' }) {
  const { w, h } = b;
  const inner = { x: 5, y: 6, w: w - 10, h: h - 12 };
  const sh = inner.h / o.shelves;
  b.add('body', (p) => {
    p.rect(0, 0, w, h, { fill: o.frame });
    p.rect(inner.x, inner.y, inner.w, inner.h, { fill: o.back, strokeWidth: 1 });
    for (let s = 0; s < o.shelves; s++) {
      const baseY = inner.y + sh * (s + 1);
      if (s < o.shelves - 1) p.line(inner.x, baseY, inner.x + inner.w, baseY, { stroke: o.frame, strokeWidth: 3.4 });
      const base = baseY - 2;
      if (o.style === 'books') {
        if (s === 0) {
          spines(p, b.rand, inner.x, base, inner.w * 0.55, sh - 8, { minW: 5, maxW: 10 });
          p.circle(inner.x + inner.w * 0.78, base - 10, 18, { fill: C.peri, strokeWidth: 1 }); // globe
          p.line(inner.x + inner.w * 0.78, base - 1, inner.x + inner.w * 0.78, base, { strokeWidth: 2 });
        } else spines(p, b.rand, inner.x, base, inner.w, sh - 8, { minW: 5, maxW: 11 });
      } else if (o.style === 'albums') {
        if (s === 0) {
          p.rect(inner.x + 6, base - sh * 0.62, inner.w * 0.38, sh * 0.62, { fill: C.paper, strokeWidth: 1.1 });
          p.rect(inner.x + 10, base - sh * 0.62 + 4, inner.w * 0.38 - 8, sh * 0.62 - 12, { fill: C.peri, stroke: 'none' });
          p.rrect(inner.x + inner.w * 0.56, base - 16, 26, 16, 3, { fill: C.charcoal, strokeWidth: 1 }); // camera
          p.circle(inner.x + inner.w * 0.56 + 13, base - 8, 9, { fill: C.steel, strokeWidth: 1 });
        } else spines(p, b.rand, inner.x, base, inner.w, sh - 8, { minW: 11, maxW: 17, palette: [C.coral, C.denim, C.walnut, C.leafDark, C.rose, C.mustard] });
      } else if (o.style === 'tapes') {
        const rows = Math.floor((sh - 8) / 9);
        for (let r = 0; r < rows; r++) {
          const tw = inner.w * (0.6 + b.rand() * 0.3);
          p.rect(inner.x + 4 + b.rand() * 6, base - 9 * (r + 1), tw, 8, { fill: r % 2 ? C.charcoal : C.night, strokeWidth: 0.8, roughness: 0.5 });
          p.rect(inner.x + 10, base - 9 * (r + 1) + 2, tw * 0.5, 4, { fill: [C.paper, C.mustard, C.pink][r % 3], stroke: 'none', roughness: 0.4 });
        }
      } else {
        const n = 2;
        for (let i = 0; i < n; i++) {
          const bw = inner.w / n - 8;
          const bh = (sh - 10) * (0.62 + b.rand() * 0.3);
          const fill = [C.card, C.peri, C.cardDark, C.steel, C.coral][Math.floor(b.rand() * 5)];
          p.rect(inner.x + 5 + i * (bw + 6), base - bh, bw, bh, { fill, strokeWidth: 1.1 });
          p.rect(inner.x + 5 + i * (bw + 6) + bw * 0.25, base - bh * 0.62, bw * 0.5, bh * 0.26, { fill: C.paper, strokeWidth: 0.8 });
        }
      }
    }
  });
  // a few things that lean out when you open the shelf
  const s = Math.min(1, o.shelves - 1);
  const baseY = inner.y + sh * (s + 1) - 2;
  b.add(
    'pulled',
    (p) => {
      const colors = [C.mustard, C.coral, C.denim];
      for (let i = 0; i < 3; i++) {
        const bw = o.style === 'books' ? 7 : 12;
        p.rect(inner.x + inner.w * 0.34 + i * (bw + 1), baseY - (sh - 10) * (0.8 + i * 0.05), bw, (sh - 10) * (0.8 + i * 0.05), { fill: colors[i], strokeWidth: 1 });
      }
    },
    { open: 'translateY(-7px) rotate(-7deg)', origin: '0% 100%' },
  );
}

function chest(b: Builder, o: { body: string; lid: string; straps?: string; rounded?: boolean; stars?: boolean; stuff: 'papers' | 'toys' }) {
  const { w, h } = b;
  const lidH = h * (o.rounded ? 0.36 : 0.22);
  b.add(
    'stuff',
    (p) => {
      if (o.stuff === 'toys') {
        p.circle(w * 0.3, lidH + 4, w * 0.2, { fill: C.card });
        p.circle(w * 0.3 - w * 0.08, lidH - w * 0.07, w * 0.08, { fill: C.card, strokeWidth: 1 });
        p.circle(w * 0.3 + w * 0.08, lidH - w * 0.07, w * 0.08, { fill: C.card, strokeWidth: 1 });
        p.rect(w * 0.55, lidH - 6, w * 0.18, w * 0.18, { fill: C.red, strokeWidth: 1 });
        p.rect(w * 0.7, lidH - 2, w * 0.16, w * 0.14, { fill: C.mustard, strokeWidth: 1 });
      } else {
        p.rect(w * 0.16, lidH - 8, w * 0.3, 22, { fill: C.paper, strokeWidth: 1 });
        p.rect(w * 0.4, lidH - 14, w * 0.26, 26, { fill: C.paperPink, strokeWidth: 1 });
        p.rect(w * 0.62, lidH - 6, w * 0.22, 20, { fill: C.paper, strokeWidth: 1 });
      }
    },
    { closed: 'translateY(34%)', open: 'translateY(-22%)', delay: 140 },
  );
  b.add('body', (p) => {
    p.rect(0, lidH, w, h - lidH, { fill: o.body });
    if (o.straps) {
      p.rect(w * 0.18, lidH, 8, h - lidH, { fill: o.straps, strokeWidth: 1 });
      p.rect(w * 0.82 - 8, lidH, 8, h - lidH, { fill: o.straps, strokeWidth: 1 });
    }
    if (o.stars) {
      p.circle(w * 0.25, lidH + (h - lidH) * 0.5, 9, { fill: C.mustard, strokeWidth: 0.9 });
      p.circle(w * 0.72, lidH + (h - lidH) * 0.38, 7, { fill: C.paper, strokeWidth: 0.9 });
      p.circle(w * 0.55, lidH + (h - lidH) * 0.7, 6, { fill: C.pink, strokeWidth: 0.9 });
    }
    p.rect(w * 0.5 - 6, lidH + 2, 12, 12, { fill: C.mustard, strokeWidth: 1 });
  });
  b.add(
    'lid',
    (p) => {
      if (o.rounded) {
        p.path(`M0,${lidH + 2} L0,${lidH * 0.5} Q0,0 ${w * 0.16},0 L${w * 0.84},0 Q${w},0 ${w},${lidH * 0.5} L${w},${lidH + 2} Z`, { fill: o.lid });
        if (o.straps) {
          p.rect(w * 0.18, 1, 8, lidH, { fill: o.straps, strokeWidth: 1 });
          p.rect(w * 0.82 - 8, 1, 8, lidH, { fill: o.straps, strokeWidth: 1 });
        }
      } else {
        p.rect(-3, 0, w + 6, lidH + 2, { fill: o.lid });
      }
    },
    { open: 'translateY(-64%) rotate(-7deg)', origin: '0% 100%' },
  );
}

function boxes(b: Builder) {
  const { w, h } = b;
  const bh = h * 0.46;
  b.add('lower', (p) => {
    p.rect(0, h - bh, w * 0.54, bh, { fill: C.card });
    p.line(w * 0.27, h - bh, w * 0.27, h - bh * 0.62, { stroke: C.paper, strokeWidth: 5 });
    p.rect(w * 0.08, h - bh * 0.5, w * 0.24, bh * 0.28, { fill: C.paper, strokeWidth: 0.9 });
    p.rect(w * 0.5, h - bh * 0.84, w * 0.5, bh * 0.84, { fill: C.cardDark });
    p.line(w * 0.75, h - bh * 0.84, w * 0.75, h - bh * 0.5, { stroke: C.paper, strokeWidth: 5 });
    p.rect(w * 0.58, h - bh * 0.4, w * 0.22, bh * 0.22, { fill: C.paper, strokeWidth: 0.9 });
  });
  const tx = w * 0.16;
  const tw = w * 0.56;
  const ty = h - bh - h * 0.4;
  b.add(
    'stuff',
    (p) => {
      p.rect(tx + 8, ty - 4, tw * 0.3, 20, { fill: C.paper, strokeWidth: 1 });
      p.rect(tx + tw * 0.42, ty - 10, tw * 0.24, 24, { fill: C.paperPink, strokeWidth: 1 });
      p.rect(tx + tw * 0.68, ty - 2, tw * 0.2, 16, { fill: C.mustard, strokeWidth: 1 });
    },
    { closed: 'translateY(40%)', open: 'translateY(-18%)', delay: 140 },
  );
  b.add('top', (p) => {
    p.rect(tx, ty, tw, h * 0.4, { fill: shade(C.card, 0.08) });
    p.rect(tx + tw * 0.2, ty + h * 0.14, tw * 0.5, h * 0.14, { fill: C.paper, strokeWidth: 0.9 });
    p.line(tx + tw * 0.28, ty + h * 0.19, tx + tw * 0.62, ty + h * 0.19, { strokeWidth: 1 });
    p.line(tx + tw * 0.28, ty + h * 0.24, tx + tw * 0.5, ty + h * 0.24, { strokeWidth: 1 });
  });
  b.add('flap-l', (p) => p.rect(tx - 1, ty - 4, tw / 2, 6, { fill: C.cardDark, strokeWidth: 1.1 }), { open: 'rotate(-118deg)', origin: '0% 100%' });
  b.add('flap-r', (p) => p.rect(tx + tw / 2 + 1, ty - 4, tw / 2, 6, { fill: C.cardDark, strokeWidth: 1.1 }), { open: 'rotate(118deg)', origin: '100% 100%' });
}

function hamper(b: Builder) {
  const { w, h } = b;
  b.add(
    'clothes',
    (p) => {
      p.ellipse(w * 0.4, h * 0.2, w * 0.5, h * 0.2, { fill: C.pink });
      p.ellipse(w * 0.66, h * 0.17, w * 0.4, h * 0.18, { fill: C.screen });
    },
    { closed: 'translateY(18%)', open: 'translateY(-12%)', delay: 120 },
  );
  b.add('body', (p) => {
    p.poly([[w * 0.04, h * 0.22], [w * 0.96, h * 0.22], [w * 0.84, h], [w * 0.16, h]], { fill: C.cream, stroke: 'none' });
    p.poly([[w * 0.04, h * 0.22], [w * 0.96, h * 0.22], [w * 0.84, h], [w * 0.16, h]], { fill: C.oakDark, fillStyle: 'cross-hatch', hachureGap: 7, fillWeight: 1, stroke: 'none' });
    p.poly([[w * 0.04, h * 0.22], [w * 0.96, h * 0.22], [w * 0.84, h], [w * 0.16, h]], { fill: 'none', stroke: C.walnutDark });
    p.rrect(w * 0.02, h * 0.2, w * 0.96, 8, 3, { fill: C.oak });
    // a sleeve that did not make it in
    p.poly([[w * 0.7, h * 0.24], [w * 0.92, h * 0.24], [w * 1.02, h * 0.56], [w * 0.86, h * 0.58]], { fill: C.pink, strokeWidth: 1.1 });
  });
  b.add('lid', (p) => p.rrect(0, h * 0.1, w, h * 0.12, 5, { fill: C.oak }), { open: 'translateY(-90%) rotate(-10deg)', origin: '0% 100%' });
}

function recipeBox(b: Builder) {
  const { w, h } = b;
  b.add(
    'cards',
    (p) => {
      const colors = [C.paper, '#FFEFCB', C.paper, C.paperPink];
      for (let i = 0; i < 4; i++) {
        p.rect(w * 0.12 + i * 3, h * 0.12 + (i % 2) * 3, w * 0.62, h * 0.5, { fill: colors[i], strokeWidth: 0.9 });
      }
      p.rect(w * 0.2, h * 0.04, w * 0.2, h * 0.14, { fill: C.red, strokeWidth: 0.8 });
      p.rect(w * 0.52, h * 0.06, w * 0.2, h * 0.12, { fill: C.leaf, strokeWidth: 0.8 });
    },
    { open: 'translateY(-26%)' },
  );
  b.add('box', (p) => {
    p.rect(0, h * 0.42, w, h * 0.58, { fill: C.coral });
    p.rect(w * 0.34, h * 0.56, w * 0.32, h * 0.22, { fill: C.paper, strokeWidth: 0.9 });
  });
}

function recordCrate(b: Builder) {
  const { w, h } = b;
  b.add(
    'record',
    (p) => {
      p.circle(w * 0.62, h * 0.3, h * 0.46, { fill: C.night });
      p.circle(w * 0.62, h * 0.3, h * 0.18, { fill: C.mustard, strokeWidth: 1 });
      p.circle(w * 0.62, h * 0.3, 3, { fill: C.night, stroke: 'none' });
    },
    { closed: 'translateY(16%)', open: 'translateY(-22%) rotate(24deg)', origin: '50% 50%' },
  );
  b.add('sleeves', (p) => {
    const colors = [C.coral, C.peri, C.rose, C.mustard, C.denim, C.pink];
    const n = 6;
    for (let i = 0; i < n; i++) {
      p.rect(w * 0.08 + i * ((w * 0.84) / n), h * 0.18 + ((i * 7) % 3) * 3, (w * 0.84) / n - 1, h * 0.5, { fill: colors[i], strokeWidth: 1 });
    }
  });
  b.add('crate', (p) => {
    p.rect(0, h * 0.5, w, h * 0.16, { fill: C.oak });
    p.rect(0, h * 0.7, w, h * 0.16, { fill: C.oak });
    p.rect(0, h * 0.46, 8, h * 0.54, { fill: C.oakDark });
    p.rect(w - 8, h * 0.46, 8, h * 0.54, { fill: C.oakDark });
    p.rect(0, h * 0.9, w, h * 0.1, { fill: C.oakDark });
  });
}

function toolbox(b: Builder) {
  const { w, h } = b;
  b.add(
    'tools',
    (p) => {
      p.line(w * 0.3, h * 0.5, w * 0.24, h * 0.18, { stroke: C.steelDark, strokeWidth: 3.4 });
      p.circle(w * 0.23, h * 0.15, 9, { strokeWidth: 2.4, stroke: C.steelDark });
      p.line(w * 0.62, h * 0.5, w * 0.68, h * 0.2, { stroke: C.mustard, strokeWidth: 4 });
      p.line(w * 0.68, h * 0.2, w * 0.7, h * 0.08, { stroke: C.steelDark, strokeWidth: 2 });
    },
    { closed: 'translateY(30%)', open: 'translateY(-4%)', delay: 140 },
  );
  b.add('body', (p) => {
    p.rect(0, h * 0.5, w, h * 0.5, { fill: C.red });
    p.rect(w * 0.12, h * 0.62, 9, 12, { fill: C.steel, strokeWidth: 1 });
    p.rect(w * 0.88 - 9, h * 0.62, 9, 12, { fill: C.steel, strokeWidth: 1 });
  });
  b.add(
    'lid',
    (p) => {
      p.rrect(-2, h * 0.36, w + 4, h * 0.16, 4, { fill: shade(C.red, -0.12) });
      p.arc(w * 0.5, h * 0.36, w * 0.5, h * 0.22, Math.PI, Math.PI * 2, false, { strokeWidth: 2.6 });
    },
    { open: 'translateY(-70%) rotate(-9deg)', origin: '0% 100%' },
  );
}

function corkboard(b: Builder) {
  const { w, h } = b;
  b.add('board', (p) => {
    p.rect(0, 0, w, h, { fill: C.oakDark });
    p.rect(5, 5, w - 10, h - 10, { fill: C.cork, strokeWidth: 1 });
    p.rect(5, 5, w - 10, h - 10, { fill: shade(C.cork, -0.18), fillStyle: 'dots', hachureGap: 9, fillWeight: 0.6, stroke: 'none' });
  });
  const sw = (w - 28) / 3;
  const shh = (h - 24) / 2;
  const rots = [-5, 3, -2, 4, -4, 2];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) b.slot({ x: 9 + c * (sw + 5), y: 9 + r * (shh + 4), w: sw, h: shh, rot: rots[r * 3 + c] });
}

function pegboard(b: Builder) {
  const { w, h } = b;
  b.add('board', (p) => {
    p.rect(0, 0, w, h, { fill: '#FBEEDC' });
    p.rect(3, 3, w - 6, h - 6, { fill: shade('#FBEEDC', -0.25), fillStyle: 'dots', hachureGap: 11, fillWeight: 0.7, stroke: 'none' });
  });
  b.add(
    'tools',
    (p) => {
      const x0 = w * 0.56;
      // hammer
      p.line(x0, h * 0.2, x0, h * 0.78, { stroke: C.oakDark, strokeWidth: 3.6 });
      p.rect(x0 - 10, h * 0.14, 22, 10, { fill: C.steelDark, strokeWidth: 1.1 });
      // wrench
      p.line(x0 + w * 0.12, h * 0.26, x0 + w * 0.12, h * 0.8, { stroke: C.steelDark, strokeWidth: 4 });
      p.circle(x0 + w * 0.12, h * 0.2, 13, { strokeWidth: 3, stroke: C.steelDark });
      // tape
      p.circle(x0 + w * 0.27, h * 0.32, 24, { fill: C.mustard });
      p.circle(x0 + w * 0.27, h * 0.32, 10, { fill: '#FBEEDC', strokeWidth: 1 });
      // scissors
      p.line(x0 + w * 0.22, h * 0.58, x0 + w * 0.33, h * 0.88, { strokeWidth: 2 });
      p.line(x0 + w * 0.33, h * 0.58, x0 + w * 0.22, h * 0.88, { strokeWidth: 2 });
      p.circle(x0 + w * 0.22, h * 0.9, 8, { strokeWidth: 2, stroke: C.red });
      p.circle(x0 + w * 0.33, h * 0.9, 8, { strokeWidth: 2, stroke: C.red });
    },
    { open: 'rotate(1.5deg)', origin: '50% 0%' },
  );
  const sw = w * 0.22;
  b.slot({ x: w * 0.04, y: h * 0.1, w: sw, h: h * 0.78, rot: -2 });
  b.slot({ x: w * 0.29, y: h * 0.12, w: sw, h: h * 0.78, rot: 2 });
}

function photoWall(b: Builder) {
  const { w, h } = b;
  const frames = [
    { x: 0, y: h * 0.12, w: w * 0.3, h: h * 0.62, c: C.walnut, rot: -1.5 },
    { x: w * 0.35, y: 0, w: w * 0.36, h: h * 0.5, c: C.charcoal, rot: 1 },
    { x: w * 0.35, y: h * 0.58, w: w * 0.28, h: h * 0.42, c: C.mustard, rot: -1 },
    { x: w * 0.76, y: h * 0.18, w: w * 0.24, h: h * 0.56, c: C.white, rot: 2 },
  ];
  b.add('frames', (p) => {
    for (const f of frames) {
      p.rect(f.x, f.y, f.w, f.h, { fill: f.c });
      p.rect(f.x + 4, f.y + 4, f.w - 8, f.h - 8, { fill: C.cream, strokeWidth: 1 });
    }
  });
  for (const f of frames) b.slot({ x: f.x + 5, y: f.y + 5, w: f.w - 10, h: f.h - 10 });
}

function tv(b: Builder) {
  const { w, h } = b;
  const sh = h * 0.6;
  b.add(
    'glow',
    (p) => p.rect(w * 0.02, -6, w * 0.96, sh + 12, { fill: C.screen, stroke: 'none', roughness: 0.3 }),
    { closedOpacity: 0, openOpacity: 0.35 },
  );
  b.add('set', (p) => {
    p.rrect(w * 0.06, 0, w * 0.88, sh, 4, { fill: C.night });
    p.rect(w * 0.09, 4, w * 0.82, sh - 9, { fill: '#2A2233', strokeWidth: 0.8 });
    p.rect(w * 0.46, sh, w * 0.08, h * 0.08, { fill: C.charcoal, strokeWidth: 1 });
    p.rrect(w * 0.36, sh + h * 0.07, w * 0.28, 4, 2, { fill: C.charcoal, strokeWidth: 1 });
  });
  b.slot({ x: w * 0.09 + 1, y: 5, w: w * 0.82 - 2, h: sh - 11, shape: 'screen' });
  b.add('console', (p) => {
    const cy = h * 0.72;
    p.rect(0, cy, w, h - cy - 6, { fill: C.walnut });
    p.rect(w * 0.06, h - 7, 6, 7, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(w * 0.94 - 6, h - 7, 6, 7, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(w * 0.04, cy + 4, w * 0.28, h - cy - 14, { fill: shade(C.walnut, 0.1), strokeWidth: 1 });
    p.rect(w * 0.68, cy + 4, w * 0.28, h - cy - 14, { fill: shade(C.walnut, 0.1), strokeWidth: 1 });
    p.rect(w * 0.36, cy + 6, w * 0.28, 7, { fill: C.night, strokeWidth: 0.9 });
    p.circle(w * 0.4, cy + 9.5, 2.4, { fill: C.leaf, stroke: 'none' });
  });
}

function projector(b: Builder) {
  const { w, h } = b;
  b.add(
    'glow',
    (p) => p.rect(w * 0.02, h * 0.06, w * 0.96, h * 0.88, { fill: '#FFF6D8', stroke: 'none', roughness: 0.3 }),
    { closedOpacity: 0, openOpacity: 0.4 },
  );
  b.add('screen', (p) => {
    p.rrect(0, 0, w, h * 0.09, 3, { fill: C.charcoal });
    p.rect(w * 0.04, h * 0.09, w * 0.92, h * 0.82, { fill: C.night });
    p.rect(w * 0.07, h * 0.13, w * 0.86, h * 0.74, { fill: C.white, strokeWidth: 1 });
    p.line(w * 0.5, h * 0.91, w * 0.5, h * 0.97, { strokeWidth: 1.2 });
    p.circle(w * 0.5, h * 0.98, 5, { fill: C.mustard, strokeWidth: 1 });
  });
  b.slot({ x: w * 0.07 + 1, y: h * 0.13 + 1, w: w * 0.86 - 2, h: h * 0.74 - 2, shape: 'screen' });
}

function guestBook(b: Builder) {
  const { w, h } = b;
  b.add('stand', (p) => {
    p.rect(w * 0.42, h * 0.34, w * 0.16, h * 0.56, { fill: C.walnut });
    p.rrect(w * 0.14, h * 0.9, w * 0.72, h * 0.1, 3, { fill: C.walnutDark });
    p.poly([[w * 0.02, h * 0.36], [w * 0.98, h * 0.26], [w * 0.98, h * 0.32], [w * 0.02, h * 0.42]], { fill: C.walnutDark });
  });
  b.add('book', (p) => {
    p.poly([[w * 0.08, h * 0.3], [w * 0.5, h * 0.22], [w * 0.5, h * 0.32], [w * 0.08, h * 0.37]], { fill: C.paper, strokeWidth: 1.1 });
    p.poly([[w * 0.5, h * 0.22], [w * 0.93, h * 0.18], [w * 0.93, h * 0.26], [w * 0.5, h * 0.32]], { fill: C.paper, strokeWidth: 1.1 });
    p.line(w * 0.16, h * 0.31, w * 0.42, h * 0.27, { strokeWidth: 0.8, stroke: C.denim });
    p.line(w * 0.58, h * 0.25, w * 0.84, h * 0.22, { strokeWidth: 0.8, stroke: C.denim });
  });
  b.add('pen', (p) => p.line(w * 0.7, h * 0.22, w * 0.92, h * 0.02, { stroke: C.coral, strokeWidth: 2.2 }), { open: 'rotate(-16deg) translate(-4px,-2px)', origin: '0% 100%' });
}

function bathtub(b: Builder) {
  const { w, h } = b;
  b.add(
    'bubbles',
    (p) => {
      const xs = [0.18, 0.28, 0.4, 0.52, 0.63, 0.72];
      xs.forEach((fx, i) => p.circle(w * fx, h * (0.3 - (i % 2) * 0.09), h * (0.26 - (i % 3) * 0.05), { fill: '#FFFFFF', strokeWidth: 1 }));
    },
    { open: 'translateY(-9px) scale(1.06)', origin: '50% 100%' },
  );
  b.add(
    'duck',
    (p) => {
      p.ellipse(w * 0.34, h * 0.27, 20, 13, { fill: C.mustard, strokeWidth: 1 });
      p.circle(w * 0.34 + 8, h * 0.27 - 9, 10, { fill: C.mustard, strokeWidth: 1 });
      p.poly([[w * 0.34 + 12, h * 0.27 - 9], [w * 0.34 + 18, h * 0.27 - 7], [w * 0.34 + 12, h * 0.27 - 5]], { fill: C.coral, strokeWidth: 0.8 });
    },
    { open: 'translate(8px,-7px) rotate(10deg)' },
  );
  b.add('tub', (p) => {
    p.path(`M${w * 0.04},${h * 0.36} L${w * 0.9},${h * 0.36} Q${w * 0.9},${h * 0.88} ${w * 0.7},${h * 0.88} L${w * 0.22},${h * 0.88} Q${w * 0.04},${h * 0.88} ${w * 0.04},${h * 0.36} Z`, { fill: C.white });
    p.rrect(0, h * 0.3, w * 0.94, h * 0.1, 5, { fill: C.white });
    p.line(w * 0.1, h * 0.6, w * 0.86, h * 0.6, { stroke: C.peri, strokeWidth: 3 });
    p.path(`M${w * 0.2},${h * 0.88} Q${w * 0.16},${h} ${w * 0.12},${h}`, { strokeWidth: 3, stroke: C.mustard });
    p.path(`M${w * 0.72},${h * 0.88} Q${w * 0.76},${h} ${w * 0.8},${h}`, { strokeWidth: 3, stroke: C.mustard });
    p.lines([[w * 0.97, h * 0.4], [w * 0.97, h * 0.06], [w * 0.84, h * 0.06], [w * 0.84, h * 0.16]], { strokeWidth: 3, stroke: C.steelDark });
  });
}

function backupRack(b: Builder) {
  const { w, h } = b;
  const units = 6;
  const uh = (h - 22) / units;
  b.add('body', (p) => {
    p.rect(0, 0, w, h, { fill: C.night });
    for (let i = 0; i < units; i++) {
      const y = 10 + i * uh;
      p.rect(7, y, w - 14, uh - 5, { fill: C.charcoal, strokeWidth: 1 });
      for (let v = 0; v < 4; v++) p.line(w * 0.46 + v * 6, y + 5, w * 0.46 + v * 6, y + uh - 10, { stroke: C.steelDark, strokeWidth: 1 });
    }
    p.rect(4, h - 5, 9, 5, { fill: C.night, strokeWidth: 1 });
    p.rect(w - 13, h - 5, 9, 5, { fill: C.night, strokeWidth: 1 });
  });
  for (let i = 0; i < units; i++) {
    const y = 10 + i * uh;
    b.add(
      `led-${i}`,
      (p) => {
        p.circle(14, y + (uh - 5) / 2, 4.5, { fill: '#6EE7A0', stroke: 'none', roughness: 0.3 });
        p.circle(22, y + (uh - 5) / 2, 4.5, { fill: i % 3 === 1 ? C.mustard : '#6EE7A0', stroke: 'none', roughness: 0.3 });
      },
      { cls: `blink blink-${i % 3}` },
    );
  }
  b.add(
    'door',
    (p) => {
      p.rect(3, 4, w - 6, h - 12, { fill: '#9FB3D1', strokeWidth: 1.2, opacity: 0.28 });
      p.rrect(w - 11, h * 0.42, 4, h * 0.14, 2, { fill: C.steel, strokeWidth: 1 });
    },
    { open: 'scaleX(0.12) skewY(-6deg)', origin: '0% 50%' },
  );
}

function planter(b: Builder) {
  const { w, h } = b;
  const top = h * 0.56;
  b.add(
    'sprouts',
    (p) => {
      const xs = [0.14, 0.3, 0.48, 0.66, 0.84];
      const hs = [0.22, 0.4, 0.3, 0.5, 0.18];
      xs.forEach((fx, i) => {
        const x = w * fx;
        const tipY = top - h * hs[i];
        p.curve([[x, top + 2], [x - 3, (top + tipY) / 2], [x, tipY]], { stroke: C.leafDark, strokeWidth: 2 });
        p.ellipse(x - 7, tipY + 8, 14, 7, { fill: C.leaf, strokeWidth: 1 });
        p.ellipse(x + 7, tipY + 3, 14, 7, { fill: C.leaf, strokeWidth: 1 });
        if (i === 3) p.circle(x, tipY - 3, 11, { fill: C.pink, strokeWidth: 1 });
        if (i === 1) p.circle(x, tipY - 3, 9, { fill: C.mustard, strokeWidth: 1 });
      });
    },
    { open: 'scaleY(1.18)', origin: '50% 100%' },
  );
  b.add('box', (p) => {
    p.rect(w * 0.08, top + h * 0.28, 8, h * 0.16, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(w * 0.92 - 8, top + h * 0.28, 8, h * 0.16, { fill: C.walnutDark, strokeWidth: 1 });
    p.rect(0, top, w, h * 0.3, { fill: C.oak });
    p.line(0, top + h * 0.15, w, top + h * 0.15, { strokeWidth: 1 });
    p.rect(3, top - 3, w - 6, 7, { fill: C.soil, strokeWidth: 1 });
  });
}

function porch(b: Builder) {
  const { w, h, count } = b;
  const deckY = h - 34;
  b.add('shelter', (p) => {
    // lean-to roof fixed to the house wall on the right, held up by a post
    p.line(w * 0.3, h * 0.27, w * 0.3, deckY, { strokeWidth: 5, stroke: C.white });
    p.line(w * 0.3 - 2.5, h * 0.27, w * 0.3 - 2.5, deckY, { strokeWidth: 1.1 });
    p.line(w * 0.3 + 2.5, h * 0.27, w * 0.3 + 2.5, deckY, { strokeWidth: 1.1 });
    p.poly([[w * 0.16, h * 0.27], [w + 3, h * 0.05], [w + 3, h * 0.15], [w * 0.16, h * 0.36]], { fill: C.coral });
    p.line(w * 0.16, h * 0.36, w + 3, h * 0.15, { stroke: C.white, strokeWidth: 3 });
    // lantern
    p.line(w * 0.7, h * 0.2, w * 0.7, h * 0.3, { strokeWidth: 1 });
    p.rrect(w * 0.7 - 6, h * 0.3, 12, 16, 3, { fill: C.lamp, strokeWidth: 1.1 });
  });
  b.add('deck', (p) => {
    p.rect(w * 0.3, deckY + 9, w * 0.7, h - deckY - 9, { fill: C.oakDark, fillStyle: 'cross-hatch', hachureGap: 7, fillWeight: 0.9, strokeWidth: 1.2 });
    p.rect(w * 0.14, deckY + 12, w * 0.18, h - deckY - 12, { fill: C.oak });
    p.rect(0, deckY + 23, w * 0.16, h - deckY - 23, { fill: C.oak });
    p.rect(w * 0.26, deckY, w * 0.74 + 2, 10, { fill: C.oak });
    p.rrect(w * 0.74, deckY - 4, w * 0.22, 5, 2, { fill: C.coral, strokeWidth: 1 }); // doormat
  });
  // packages: drawn from the number of files waiting outside
  const spots: [number, number, number, number, string][] = [
    [w * 0.36, 36, 42, 36, C.card],
    [w * 0.62, 28, 32, 28, C.cardDark],
    [w * 0.42, 66, 32, 30, shade(C.card, 0.1)],
    [w * 0.82, 22, 24, 22, C.card],
    [w * 0.64, 50, 26, 22, shade(C.cardDark, 0.12)],
  ];
  const n = Math.min(count, spots.length);
  for (let i = 0; i < n; i++) {
    const [x, up, bw, bh, fill] = spots[i];
    b.add(
      `pkg-${i}`,
      (p) => {
        p.rect(x, deckY - up, bw, bh, { fill });
        p.line(x + bw / 2, deckY - up, x + bw / 2, deckY - up + bh, { stroke: C.cream, strokeWidth: 4 });
        p.rect(x + 3, deckY - up + bh * 0.55, bw * 0.4, bh * 0.28, { fill: C.paper, strokeWidth: 0.8 });
      },
      { open: `translateY(-${3 + (i % 2) * 3}px) rotate(${i % 2 ? 3 : -3}deg)`, origin: '50% 100%', delay: i * 50 },
    );
  }
}

function mailbox(b: Builder) {
  const { w, h, count } = b;
  b.add('post', (p) => {
    p.rect(w * 0.42, h * 0.38, 10, h * 0.62, { fill: C.oakDark });
  });
  b.add('box', (p) => {
    p.path(`M${w * 0.06},${h * 0.4} L${w * 0.06},${h * 0.2} Q${w * 0.06},${h * 0.04} ${w * 0.3},${h * 0.04} L${w * 0.94},${h * 0.04} L${w * 0.94},${h * 0.4} Z`, { fill: C.coral });
    p.line(w * 0.3, h * 0.04, w * 0.3, h * 0.4, { strokeWidth: 1, stroke: shade(C.coral, -0.3) });
  });
  b.add(
    'flag',
    (p) => {
      p.line(w * 0.78, h * 0.3, w * 0.78, h * 0.02, { strokeWidth: 2 });
      p.rect(w * 0.78, h * 0.0, w * 0.2, h * 0.1, { fill: C.mustard, strokeWidth: 1 });
    },
    count > 0 ? { origin: '0% 100%' } : { closed: 'rotate(90deg)', open: 'rotate(90deg)', origin: '0% 100%' },
  );
  b.add('door', (p) => p.ellipse(w * 0.18, h * 0.23, w * 0.2, h * 0.32, { fill: C.salmon, strokeWidth: 1.2 }), { open: 'scaleY(0.3) translateY(60%)', origin: '50% 100%' });
  if (count > 0) b.add('mail', (p) => p.rect(w * 0.1, h * 0.14, w * 0.18, h * 0.1, { fill: C.paper, strokeWidth: 0.9 }), { open: 'translateX(-6px)' });
}

function bins(b: Builder) {
  const { w, h, count } = b;
  const one = (key: string, x: number, bw: number, color: string, full: boolean) => {
    if (full)
      b.add(`${key}-trash`, (p) => {
        p.circle(x + bw * 0.34, h * 0.2, bw * 0.34, { fill: C.paper, strokeWidth: 1 });
        p.circle(x + bw * 0.62, h * 0.17, bw * 0.3, { fill: C.paperPink, strokeWidth: 1 });
      });
    b.add(`${key}-body`, (p) => {
      p.poly([[x, h * 0.24], [x + bw, h * 0.24], [x + bw * 0.9, h * 0.94], [x + bw * 0.1, h * 0.94]], { fill: color });
      p.line(x + bw * 0.3, h * 0.36, x + bw * 0.34, h * 0.84, { strokeWidth: 1, stroke: shade(color, -0.3) });
      p.line(x + bw * 0.5, h * 0.36, x + bw * 0.5, h * 0.84, { strokeWidth: 1, stroke: shade(color, -0.3) });
      p.line(x + bw * 0.7, h * 0.36, x + bw * 0.66, h * 0.84, { strokeWidth: 1, stroke: shade(color, -0.3) });
      p.circle(x + bw * 0.2, h * 0.95, 9, { fill: C.night, strokeWidth: 1 });
      p.circle(x + bw * 0.8, h * 0.95, 9, { fill: C.night, strokeWidth: 1 });
    });
    b.add(`${key}-lid`, (p) => p.rrect(x - 3, h * 0.16, bw + 6, h * 0.1, 3, { fill: shade(color, -0.15) }), {
      closed: full ? 'rotate(8deg)' : undefined,
      open: 'rotate(38deg)',
      origin: '100% 100%',
    });
  };
  one('a', 2, w * 0.44, '#9CCB6B', count > 0);
  one('b', w * 0.52, w * 0.44, C.peri, count > 4);
}

/* ---------- dispatch ---------- */

const PIECES: Record<FurnitureKind, (b: Builder) => void> = {
  desk,
  workbench,
  coffeeTable,
  consoleTable,
  vanity,
  counter,
  easel,
  closet: (b) => closet(b),
  wardrobe,
  pantry,
  fridge,
  wallCabinet,
  safe,
  nightstand,
  dresser,
  filingCabinet,
  bookshelf: (b) => shelfUnit(b, { frame: C.walnut, back: '#A8714F', shelves: 4, style: 'books' }),
  albumShelf: (b) => shelfUnit(b, { frame: C.oak, back: '#C99A6B', shelves: 4, style: 'albums' }),
  storageShelves: (b) => shelfUnit(b, { frame: C.steelDark, back: '#EEF0F8', shelves: 4, style: 'storage' }),
  tapeShelf: (b) => shelfUnit(b, { frame: C.walnutDark, back: '#7A5443', shelves: 4, style: 'tapes' }),
  trunk: (b) => chest(b, { body: C.walnut, lid: shade(C.walnut, -0.1), straps: C.mustard, rounded: true, stuff: 'papers' }),
  toyChest: (b) => chest(b, { body: C.peach, lid: C.coral, stars: true, stuff: 'toys' }),
  boxes,
  hamper,
  recipeBox,
  recordCrate,
  toolbox,
  corkboard,
  pegboard,
  photoWall,
  tv,
  projector,
  guestBook,
  bathtub,
  backupRack,
  planter,
  porch,
  mailbox,
  bins,
};

const cache = new Map<string, FurnitureArt>();

export function drawFurniture(kind: FurnitureKind, ctx: ArtCtx): FurnitureArt {
  // only the yard pieces change shape with how many files they hold
  const countKey = kind === 'porch' ? Math.min(ctx.count, 5) : kind === 'mailbox' ? Math.min(ctx.count, 1) : kind === 'bins' ? (ctx.count > 4 ? 2 : Math.min(ctx.count, 1)) : 0;
  const key = `${kind}:${Math.round(ctx.w)}x${Math.round(ctx.h)}:${ctx.seed}:${countKey}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const b = new Builder(ctx.w, ctx.h, ctx.seed, ctx.count);
  PIECES[kind](b);
  const art = b.done();
  if (cache.size > 400) cache.clear();
  cache.set(key, art);
  return art;
}

export { INK };
