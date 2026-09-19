import { SMART_ROLES } from '../ai/rules';
import { BINS_ID, PORCH_ID, YARD_ID, type House, type Room } from '../model/types';
import { findFurniture } from '../store/store';

export interface DropTarget {
  roomId: string;
  furnitureId: string;
}

/** Where a file lands when it is dropped on a room rather than on a piece of furniture. */
export function defaultSpot(room: Room): DropTarget | null {
  const usable = room.furniture.filter((f) => !SMART_ROLES.includes(f.role));
  const f = usable.find((x) => x.role === 'active') ?? usable.find((x) => x.role !== 'display') ?? usable[0];
  return f ? { roomId: room.id, furnitureId: f.id } : null;
}

/** Find what is under the pointer: a piece of furniture, a room (also on the minimap), or the bins. */
export function dropTargetAt(x: number, y: number, house: House): DropTarget | null {
  const els = document.elementsFromPoint(x, y) as HTMLElement[];
  for (const el of els) {
    const fid = el.dataset?.dropFurniture;
    if (fid) {
      if (fid === BINS_ID) return { roomId: YARD_ID, furnitureId: BINS_ID };
      if (fid === PORCH_ID) return { roomId: YARD_ID, furnitureId: PORCH_ID };
      const hit = findFurniture(house, fid);
      if (hit && !SMART_ROLES.includes(hit.furniture.role)) return { roomId: hit.room ? hit.room.id : YARD_ID, furnitureId: fid };
      if (hit?.room) return defaultSpot(hit.room);
    }
    const rid = el.dataset?.dropRoom;
    if (rid && rid !== YARD_ID) {
      const room = house.rooms.find((r) => r.id === rid);
      if (room) return defaultSpot(room);
    }
  }
  return null;
}
