/**
 * Lot geometry. Everything here is in LOT PIXELS: the coordinate system of the
 * whole scene at camera scale 1. A room cell is 400 x 250, so a room canvas is
 * 16:10. Hand-drawn room art should be made at that ratio (1600 x 1000 or
 * larger) so it drops straight in.
 */
import type { Furniture, House, Room } from './types';

export const COL_W = 400;
export const ROW_H = 250;
export const GAP = 10; // slabs between floors, walls between rooms
export const WALL = 12; // outer walls
export const ROOF_H = 300;
export const EAVE = 46;
export const YARD_W = 280;
export const SKY_TOP = 56;
export const SOIL_BOTTOM = 40;
export const ATTIC_W = 840;
export const ATTIC_H = 232;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Geometry {
  lot: { w: number; h: number };
  /** Outer bounds of the house body (walls included, roof excluded). */
  body: Rect;
  /** Bounds of house + roof: what the camera frames on narrow screens. */
  houseBounds: Rect;
  roof: { apex: { x: number; y: number }; left: { x: number; y: number }; right: { x: number; y: number } };
  groundY: number;
  topFloor: number;
  bottomFloor: number;
  columns: number;
  innerX: number;
}

export function floorRange(house: House): { top: number; bottom: number } {
  let top = house.levels?.top ?? 0;
  let bottom = house.levels?.bottom ?? 0;
  for (const r of house.rooms) {
    if (r.floor === 'attic') continue;
    top = Math.max(top, r.floor);
    bottom = Math.min(bottom, r.floor);
  }
  return { top, bottom };
}

export function geometry(house: House): Geometry {
  const columns = house.columns;
  const { top, bottom } = floorRange(house);
  const innerW = columns * COL_W + (columns - 1) * GAP;
  const outerW = innerW + WALL * 2;
  const bodyX = YARD_W;
  const roofBaseY = SKY_TOP + ROOF_H;
  const rows = top - bottom + 1;
  const bodyH = GAP + rows * (ROW_H + GAP) + (WALL - GAP);
  const groundY = roofBaseY + GAP + (top - 0 + 1) * (ROW_H + GAP) - GAP / 2;
  const lotH = roofBaseY + bodyH + (bottom < 0 ? SOIL_BOTTOM : 90);
  return {
    lot: { w: outerW + YARD_W * 2, h: lotH },
    body: { x: bodyX, y: roofBaseY, w: outerW, h: bodyH },
    houseBounds: { x: bodyX - EAVE, y: SKY_TOP - 20, w: outerW + EAVE * 2, h: ROOF_H + bodyH + 30 },
    roof: {
      apex: { x: bodyX + outerW / 2, y: SKY_TOP },
      left: { x: bodyX - EAVE, y: roofBaseY },
      right: { x: bodyX + outerW + EAVE, y: roofBaseY },
    },
    groundY,
    topFloor: top,
    bottomFloor: bottom,
    columns,
    innerX: bodyX + WALL,
  };
}

export function cellRect(geo: Geometry, floor: number, col: number, span = 1): Rect {
  const row = geo.topFloor - floor;
  return {
    x: geo.innerX + col * (COL_W + GAP),
    y: geo.body.y + GAP + row * (ROW_H + GAP),
    w: span * COL_W + (span - 1) * GAP,
    h: ROW_H,
  };
}

export function roomRect(geo: Geometry, room: Room): Rect {
  if (room.floor === 'attic') {
    return {
      x: geo.roof.apex.x - ATTIC_W / 2,
      y: geo.body.y - 6 - ATTIC_H,
      w: ATTIC_W,
      h: ATTIC_H,
    };
  }
  return cellRect(geo, room.floor, room.col, room.span);
}

/** What the camera frames when you step into a room. The attic is a long
 *  low triangle, so we frame its tall middle instead of the whole thing. */
export function roomFocus(geo: Geometry, room: Room): Rect {
  const r = roomRect(geo, room);
  if (room.floor === 'attic') {
    const w = r.h * 1.9;
    return { x: r.x + (r.w - w) / 2, y: r.y - 8, w, h: r.h + 16 };
  }
  return r;
}

/** Vertical thickness of the roof, as seen from inside the attic. */
export const ROOF_T = 26;

/** Attic outline as [x%, y%] points of the attic rect: it follows the underside of the roof. */
export function atticOutline(geo: Geometry): [number, number][] {
  const half = ATTIC_W / 2;
  const slope = ROOF_H / (geo.roof.right.x - geo.roof.apex.x); // rise per px of run
  const top = geo.body.y - 6 - ATTIC_H;
  const innerY = (dx: number) => geo.roof.apex.y + Math.abs(dx) * slope + ROOF_T;
  const wallTop = Math.min(100, Math.max(0, ((innerY(half) - top) / ATTIC_H) * 100));
  const dxTop = Math.max(24, (top - geo.roof.apex.y - ROOF_T) / slope);
  const l = ((half - dxTop) / ATTIC_W) * 100;
  const r = ((half + dxTop) / ATTIC_W) * 100;
  return [
    [0, 100],
    [0, wallTop],
    [l, 0],
    [r, 0],
    [100, wallTop],
    [100, 100],
  ];
}

/** CSS clip-path for a room. Only the attic is not a rectangle. */
export function roomClip(geo: Geometry, room: Room): string | undefined {
  if (room.floor !== 'attic') return undefined;
  return `polygon(${atticOutline(geo)
    .map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`)
    .join(', ')})`;
}

/** Yard furniture is anchored to the house, not the grid:
 *  x < 0 hangs off the left wall, x >= 0 off the right wall, y is relative to the ground line. */
export function yardRect(geo: Geometry, f: Furniture): Rect {
  const x = f.x < 0 ? geo.body.x + f.x : geo.body.x + geo.body.w + f.x;
  return { x, y: geo.groundY + f.y, w: f.w, h: f.h };
}

/** A furniture piece's rectangle in lot pixels. */
export function furnitureRect(geo: Geometry, room: Room | null, f: Furniture): Rect {
  if (!room) return yardRect(geo, f);
  const r = roomRect(geo, room);
  return { x: r.x + (f.x / 100) * r.w, y: r.y + (f.y / 100) * r.h, w: (f.w / 100) * r.w, h: (f.h / 100) * r.h };
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

/** Camera that fits `target` into the `frame` region of the stage. */
export function fit(target: Rect, frame: Rect, maxScale = 6): Camera {
  const scale = Math.min(frame.w / target.w, frame.h / target.h, maxScale);
  return {
    scale,
    x: frame.x + (frame.w - target.w * scale) / 2 - target.x * scale,
    y: frame.y + (frame.h - target.h * scale) / 2 - target.y * scale,
  };
}

export function pad(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 };
}

/** Which cells of a floor are free. */
export function freeCells(house: House, floor: number, ignoreRoomId?: string): boolean[] {
  const free = Array.from({ length: house.columns }, () => true);
  for (const r of house.rooms) {
    if (r.floor !== floor || r.id === ignoreRoomId) continue;
    for (let c = r.col; c < r.col + r.span; c++) free[c] = false;
  }
  return free;
}
