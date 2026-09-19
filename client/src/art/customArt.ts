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
  rooms?: Record<string, { background?: string; bakedFurniture?: boolean }>;
  furniture?: Record<string, CustomArt>;
  /** Frames for file objects, by file kind: image, note, pdf... */
  items?: Record<string, string>;
}

let manifest: ArtManifest = { format: 'roomy.art/1' };
const listeners = new Set<() => void>();

export async function loadManifest(): Promise<void> {
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
  if (f.art && (f.art.closed || f.art.open || f.art.frames?.length || f.art.baked)) return f.art;
  const byKind = m.furniture?.[f.kind];
  if (byKind) return byKind;
  if (room && !room.background && m.rooms?.[room.kind]?.bakedFurniture) return { baked: true };
  return undefined;
}

export function backgroundFor(m: ArtManifest, room: Room): string | undefined {
  return room.background ?? m.rooms?.[room.kind]?.background;
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
