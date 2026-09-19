/**
 * Hand-drawn art plugs in here.
 *
 * Lookup order for a piece of furniture:
 *   1. art set on that one piece (Renovate mode > "Swap art")
 *   2. art/manifest.json, by furniture kind   <- drop drawings in client/public/art
 *   3. the built-in sketch
 *
 * See docs/ART_GUIDE.md for sizes and naming.
 */
import { useEffect, useState } from 'react';
import type { CustomArt, Furniture, Room } from '../model/types';
import { useApp } from '../store/store';

declare const __ARTIFACT__: boolean;

export interface ArtManifest {
  format: 'roomy.art/1';
  /** Whole-lot backdrop drawn behind the rooms (house shell, roof, yard). */
  shell?: string;
  /** Keyed by room id ("study") or room kind. An id wins over a kind. */
  rooms?: Record<string, { background?: string; bakedFurniture?: boolean }>;
  /** Keyed by furniture id ("study-desk") or furniture kind ("desk"). An id wins over a kind. */
  furniture?: Record<string, CustomArt>;
}

declare global {
  interface Window {
    /** The single-file build inlines art/manifest.json here, with every image as a data URI. */
    __ROOMY_ART__?: ArtManifest;
  }
}

let manifest: ArtManifest = { format: 'roomy.art/1' };
const listeners = new Set<() => void>();

export async function loadManifest(): Promise<void> {
  const inlined = typeof window !== 'undefined' ? window.__ROOMY_ART__ : undefined;
  if (inlined?.format === 'roomy.art/1') {
    manifest = inlined;
    listeners.forEach((fn) => fn());
    return;
  }
  if (__ARTIFACT__) return;
  try {
    const res = await fetch('art/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const data = (await res.json()) as ArtManifest;
    if (data && data.format === 'roomy.art/1') {
      manifest = data;
      listeners.forEach((fn) => fn());
    }
  } catch {
    /* no manifest: the sketches are used */
  }
}

export function useManifest(): ArtManifest {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    return () => void listeners.delete(fn);
  }, []);
  return manifest;
}

export function artFor(m: ArtManifest, room: Room | null, f: Furniture): CustomArt | undefined {
  if (f.art && (f.art.closed || f.art.open || f.art.frames?.length || f.art.parts?.length || f.art.baked)) return f.art;
  const fromManifest = m.furniture?.[f.id] ?? m.furniture?.[f.kind];
  if (fromManifest) return fromManifest;
  if (room && !room.background && (m.rooms?.[room.id] ?? m.rooms?.[room.kind])?.bakedFurniture) return { baked: true };
  return undefined;
}

export function backgroundFor(m: ArtManifest, room: Room): string | undefined {
  return room.background ?? (m.rooms?.[room.id] ?? m.rooms?.[room.kind])?.background;
}

const resolved = new Map<string, string>();

/** Turns an art reference (uploaded asset id, or a path inside /art) into a URL an <img> can load. */
export function useArtUrl(ref: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => (ref ? resolved.get(ref) : undefined));
  useEffect(() => {
    let alive = true;
    if (!ref) return setUrl(undefined);
    if (resolved.has(ref)) return setUrl(resolved.get(ref));
    if (!ref.startsWith('art:')) {
      const direct = /^(https?:|data:|\/)/.test(ref) ? ref : `art/${ref}`;
      resolved.set(ref, direct);
      return setUrl(direct);
    }
    void useApp
      .getState()
      .artUrl(ref)
      .then((u) => {
        if (u) resolved.set(ref, u);
        if (alive) setUrl(u ?? undefined);
      });
    return () => {
      alive = false;
    };
  }, [ref]);
  return url;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const boxes = new Map<string, Box>();
const FULL: Box = { x: 0, y: 0, w: 100, h: 100 };

/**
 * The outline of what is actually drawn on a transparent layer, in % of its canvas.
 * This is how "swing-left" finds the hinge on a layer that was exported at full canvas size.
 */
export function useInkBox(url: string | undefined): Box {
  const [box, setBox] = useState<Box>(() => (url && boxes.get(url)) || FULL);
  useEffect(() => {
    if (!url) return;
    const known = boxes.get(url);
    if (known) return setBox(known);
    let alive = true;
    const img = new Image();
    img.onload = () => {
      let found = FULL;
      try {
        const k = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight, 1));
        const w = Math.max(1, Math.round(img.naturalWidth * k));
        const h = Math.max(1, Math.round(img.naturalHeight * k));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const px = ctx.getImageData(0, 0, w, h).data;
          let x0 = w, y0 = h, x1 = -1, y1 = -1;
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++)
              if (px[(y * w + x) * 4 + 3] > 12) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
              }
          if (x1 >= x0 && y1 >= y0) found = { x: (x0 / w) * 100, y: (y0 / h) * 100, w: ((x1 - x0 + 1) / w) * 100, h: ((y1 - y0 + 1) / h) * 100 };
        }
      } catch {
        /* a tainted canvas: fall back to the whole layer */
      }
      boxes.set(url, found);
      if (alive) setBox(found);
    };
    img.src = url;
    return () => {
      alive = false;
    };
  }, [url]);
  return box;
}
