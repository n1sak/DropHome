import { useMemo } from 'react';
import { atticOutline, geometry, roomRect } from '../model/layout';
import { BINS_ID, type House } from '../model/types';
import { Icon } from './Icon';

interface Props {
  house: House;
  width: number;
  currentRoomId?: string;
  onPick(roomId: string): void;
  /** Rooms accept dragged files (used by the minimap). */
  droppable?: boolean;
  showBins?: boolean;
  onBins?(): void;
  labels?: boolean;
}

/** The whole house as a tiny floor plan. Used for the minimap and for "Move to". */
export function HouseMap({ house, width, currentRoomId, onPick, droppable, showBins, onBins, labels = true }: Props) {
  const geo = useMemo(() => geometry(house), [house]);
  const b = geo.houseBounds;
  const k = width / b.w;
  const height = b.h * k;
  const outline = atticOutline(geo)
    .map(([x, y]) => `${x}% ${y}%`)
    .join(', ');

  return (
    <div className="housemap" style={{ width, height }}>
      <div
        className="housemap-roof"
        style={{
          left: (geo.roof.left.x - b.x) * k,
          top: (geo.roof.apex.y - b.y) * k,
          width: (geo.roof.right.x - geo.roof.left.x) * k,
          height: (geo.roof.left.y - geo.roof.apex.y) * k,
        }}
      />
      <div className="housemap-body" style={{ left: (geo.body.x - b.x) * k, top: (geo.body.y - b.y) * k, width: geo.body.w * k, height: geo.body.h * k }} />
      {house.rooms.map((room) => {
        const r = roomRect(geo, room);
        const attic = room.floor === 'attic';
        return (
          <button
            key={room.id}
            className={`housemap-room${room.id === currentRoomId ? ' is-current' : ''}`}
            style={{ left: (r.x - b.x) * k, top: (r.y - b.y) * k, width: r.w * k, height: r.h * k, background: room.wall, clipPath: attic ? `polygon(${outline})` : undefined }}
            onClick={() => onPick(room.id)}
            data-drop-room={droppable ? room.id : undefined}
            data-mini-room={room.id}
            title={room.name}
            aria-label={room.name}
          >
            {labels && <span>{room.name}</span>}
          </button>
        );
      })}
      {showBins && (
        <button className="housemap-bins" data-drop-furniture={droppable ? BINS_ID : undefined} data-mini-room="yard" onClick={onBins} title="The bins" aria-label="The bins">
          <Icon name="trash" size={14} />
        </button>
      )}
    </div>
  );
}
