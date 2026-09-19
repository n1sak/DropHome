import { fit, furnitureRect, pad, roomFocus, type Camera, type Geometry, type Rect } from '../model/layout';
import type { House, View } from '../model/types';
import { findFurniture } from './store';

export const TOPBAR = 58;

export interface StageSize {
  w: number;
  h: number;
}

export const isNarrow = (s: StageSize) => s.w < 760;

/** Where the contents panel sits when a piece of furniture is open. */
export function panelRect(s: StageSize): Rect {
  if (isNarrow(s)) {
    const h = Math.round((s.h - TOPBAR) * 0.64);
    return { x: 0, y: s.h - h, w: s.w, h };
  }
  const w = Math.round(Math.min(s.w * 0.6, Math.max(420, s.w - 420)));
  return { x: s.w - w - 16, y: TOPBAR + 46, w, h: s.h - TOPBAR - 46 - 16 };
}

/** The camera for a view: whole lot, one room, or pushed in on one piece of furniture. */
export function cameraFor(view: View, geo: Geometry, house: House, s: StageSize, renovate: boolean, hint = false): Camera {
  const narrow = isNarrow(s);
  const side = renovate && !narrow ? 300 : 0; // leave room for the renovate panel

  if (view.level === 'container' && view.furnitureId) {
    const hit = findFurniture(house, view.furnitureId);
    if (hit) {
      const r = furnitureRect(geo, hit.room, hit.furniture);
      const target = pad(r, Math.max(16, Math.min(r.w, r.h) * 0.22));
      const panel = panelRect(s);
      const frame: Rect = narrow
        ? { x: 10, y: TOPBAR + 44, w: s.w - 20, h: Math.max(90, panel.y - TOPBAR - 52) }
        : { x: 16, y: TOPBAR + 50, w: Math.max(200, panel.x - 40), h: s.h - TOPBAR - 110 };
      return fit(target, frame, 5);
    }
  }

  if (view.level !== 'house' && view.roomId) {
    const room = house.rooms.find((r) => r.id === view.roomId);
    if (room) {
      const target = pad(roomFocus(geo, room), 8);
      const frame: Rect = narrow
        ? { x: 6, y: TOPBAR + 44, w: s.w - 12, h: (s.h - TOPBAR) * 0.5 }
        : { x: 16 + side, y: TOPBAR + 44, w: s.w - 32 - side, h: s.h - TOPBAR - 44 - 76 };
      return fit(target, frame, 5);
    }
  }

  const wide = s.w / Math.max(1, s.h) > 1.15;
  const target: Rect = wide ? { x: 0, y: 0, w: geo.lot.w, h: geo.lot.h } : pad(geo.houseBounds, 6);
  const frame: Rect = { x: 8 + side, y: TOPBAR + 4, w: s.w - 16 - side, h: s.h - TOPBAR - (narrow ? 84 : 66) - (hint && !narrow ? 40 : 0) };
  return fit(target, frame, 2);
}

/** Lot rectangle -> screen rectangle, for labels that live outside the camera. */
export function project(cam: Camera, r: Rect): Rect {
  return { x: cam.x + r.x * cam.scale, y: cam.y + r.y * cam.scale, w: r.w * cam.scale, h: r.h * cam.scale };
}
