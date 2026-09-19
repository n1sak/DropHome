import { useMemo } from 'react';
import { cellRect, freeCells, furnitureRect, roomRect, yardRect } from '../model/layout';
import { YARD_ID } from '../model/types';
import { project } from '../store/camera';
import { contentsOf, useApp } from '../store/store';
import { Icon } from './Icon';
import { useStage } from './StageContext';

/**
 * Name plates and furniture tags. They sit OUTSIDE the camera, in screen
 * pixels, so text stays crisp and readable at any zoom and on a phone. They
 * fade out while the camera moves and back in when it settles.
 */
export function Labels() {
  const { cam, geo, settled } = useStage();
  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const view = useApp((s) => s.view);
  const renovate = useApp((s) => s.renovate);
  const selectedId = useApp((s) => s.selectedFurnitureId);
  const buildTarget = useApp((s) => s.buildTarget);
  const enterRoom = useApp((s) => s.enterRoom);
  const openFurniture = useApp((s) => s.openFurniture);
  const selectFurniture = useApp((s) => s.selectFurniture);
  const setBuildTarget = useApp((s) => s.setBuildTarget);

  const counts = useMemo(() => {
    const byRoom = new Map<string, number>();
    for (const f of files) if (!f.trashed) byRoom.set(f.roomId, (byRoom.get(f.roomId) ?? 0) + 1);
    return byRoom;
  }, [files]);

  const focusRoom = view.level === 'room' ? house.rooms.find((r) => r.id === view.roomId) : undefined;

  return (
    <div className={`labels${settled ? ' is-settled' : ''}`}>
      {view.level === 'house' &&
        house.rooms.map((room) => {
          const r = project(cam, roomRect(geo, room));
          const attic = room.floor === 'attic';
          const n = counts.get(room.id) ?? 0;
          return (
            <button
              key={room.id}
              className={`plate${attic ? ' plate-attic' : ''}`}
              style={attic ? { left: r.x + r.w / 2, top: r.y + r.h * 0.04 } : { left: r.x + 5, top: r.y + 5, maxWidth: Math.max(60, r.w - 10) }}
              onClick={() => enterRoom(room.id)}
              aria-label={`${room.name}, ${n} files. Step inside.`}
            >
              <span className="plate-name">{room.name}</span>
              {n > 0 && <span className="plate-count">{n}</span>}
            </button>
          );
        })}

      {view.level === 'house' &&
        house.yard.map((f) => {
          const r = project(cam, yardRect(geo, f));
          const n = contentsOf(f, null, files).length;
          return (
            <button key={f.id} className={`tag tag-yard${n ? ' has-files' : ''}`} style={{ left: r.x + r.w / 2, top: r.y - 4 }} onClick={() => openFurniture(YARD_ID, f.id)}>
              <span className="tag-name">{f.name}</span>
              {n > 0 && <span className="tag-count">{n}</span>}
            </button>
          );
        })}

      {view.level === 'house' &&
        renovate &&
        Array.from({ length: geo.topFloor - geo.bottomFloor + 1 }, (_, i) => geo.topFloor - i).flatMap((floor) =>
          freeCells(house, floor).map((free, col) => {
            if (!free) return null;
            const r = project(cam, cellRect(geo, floor, col));
            const active = buildTarget?.floor === floor && buildTarget.col === col;
            return (
              <button key={`${floor}:${col}`} className={`build-here${active ? ' is-active' : ''}`} style={{ left: r.x + r.w / 2, top: r.y + r.h / 2 }} onClick={() => setBuildTarget(active ? null : { floor, col })}>
                <Icon name="plus" size={16} /> Build a room
              </button>
            );
          }),
        )}

      {focusRoom &&
        focusRoom.furniture.map((f) => {
          const r = project(cam, furnitureRect(geo, focusRoom, f));
          const n = contentsOf(f, focusRoom, files).length;
          return (
            <button
              key={f.id}
              className={`tag${n ? ' has-files' : ''}${selectedId === f.id ? ' is-selected' : ''}`}
              style={{ left: r.x + r.w / 2, top: Math.max(r.y - 4, 96) }}
              onClick={() => (renovate ? selectFurniture(f.id) : openFurniture(focusRoom.id, f.id))}
              aria-label={`${f.name}, ${n} files. ${f.hint}`}
            >
              <span className="tag-name">{f.name}</span>
              {n > 0 && <span className="tag-count">{n}</span>}
              <span className="tag-hint">{f.hint}</span>
            </button>
          );
        })}
    </div>
  );
}
