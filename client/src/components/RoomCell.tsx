import { memo, useMemo } from 'react';
import { backgroundFor, useArtUrl, useManifest } from '../art/customArt';
import { drawRoom } from '../art/roomArt';
import { SketchSvg } from '../art/Sketch';
import { hashSeed } from '../art/sketch';
import { furnitureRect, roomClip, roomRect, type Geometry } from '../model/layout';
import type { FileItem, Room } from '../model/types';
import { contentsOf, isLit, useApp } from '../store/store';
import { FurniturePiece } from './FurniturePiece';

interface Props {
  room: Room;
  geo: Geometry;
  files: FileItem[];
}

export const RoomCell = memo(function RoomCell({ room, geo, files }: Props) {
  const manifest = useManifest();
  const view = useApp((s) => s.view);
  const renovate = useApp((s) => s.renovate);
  const dropping = useApp((s) => !!s.dragging);
  const pulse = useApp((s) => s.pulses[room.id] ?? 0);
  const enterRoom = useApp((s) => s.enterRoom);
  const back = useApp((s) => s.back);

  const rect = roomRect(geo, room);
  const clip = roomClip(geo, room);
  const bgRef = backgroundFor(manifest, room);
  const bgUrl = useArtUrl(bgRef);
  const sketch = useMemo(() => (bgRef ? null : drawRoom(room.kind, rect.w, rect.h, room.wall, hashSeed(room.id))), [bgRef, room.kind, room.id, room.wall, rect.w, rect.h]);

  const focused = view.level !== 'house' && view.roomId === room.id;
  const lit = useMemo(() => isLit(room, files), [room, files]);
  const contents = useMemo(() => new Map(room.furniture.map((f) => [f.id, contentsOf(f, room, files)])), [room, files]);

  const onClick = () => {
    if (!focused) return enterRoom(room.id);
    if (view.level === 'container') back();
  };

  return (
    <div
      className={`room room-${room.kind}${focused ? ' is-focus' : ''}${lit ? ' is-lit' : ''}${view.level === 'house' ? ' is-far' : ''}${dropping ? ' is-target' : ''}${renovate ? ' is-blueprint' : ''}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, clipPath: clip }}
      data-room-id={room.id}
      data-drop-room={room.id}
      onClick={onClick}
    >
      {bgUrl ? <img className="room-bg" src={bgUrl} alt="" draggable={false} /> : sketch && <SketchSvg className="room-bg" w={rect.w} h={rect.h} paths={sketch} />}
      {room.furniture.map((f) => (
        <FurniturePiece
          key={f.id}
          room={room}
          f={f}
          rect={furnitureRect(geo, room, f)}
          live={focused}
          open={view.level === 'container' && view.furnitureId === f.id}
          contents={contents.get(f.id) ?? []}
        />
      ))}
      <div className="room-shade" />
      <div className="room-glow" />
      {pulse > 0 && <div key={pulse} className="room-pulse" />}
    </div>
  );
});
