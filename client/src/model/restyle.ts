/**
 * Houses saved before the warm repaint carry the old, stronger wall colours.
 * Those colours are no longer on offer and look wrong behind the new furniture,
 * so each one is swapped for its counterpart the first time the house loads.
 * Anything the person mixed themselves is left alone.
 */
import type { House } from './types';

const REPAINT: Record<string, string> = {
  '#d9def7': '#EEF1FB',
  '#f4ddd8': '#FFEEF0',
  '#cfe8ea': '#EDF3FC',
  '#f7e9bb': '#FFF5DA',
  '#d5e3d3': '#FFF9F0',
  '#f6e3d0': '#FFF0E4',
  '#dcdfe4': '#F4EFEA',
  '#d3c9e6': '#F8EAF2',
  '#cdb9ab': '#EFE3D7',
  '#d6e0ea': '#EFF3F9',
  '#f3e6ee': '#FFF0F4',
  '#ddebd2': '#F0F7E6',
  '#ddc7a4': '#FBE7D3',
  '#f2f0ea': '#FFFDF8',
  '#d9cdb8': '#F8EBDC',
};

/** Returns the repainted house, or the same object when nothing needed changing. */
export function repaint(house: House): House {
  let changed = false;
  const rooms = house.rooms.map((room) => {
    const next = REPAINT[room.wall?.toLowerCase()];
    if (!next) return room;
    changed = true;
    return { ...room, wall: next };
  });
  return changed ? { ...house, rooms } : house;
}
