import { useState } from 'react';
import { SMART_ROLES } from '../ai/rules';
import { useApp } from '../store/store';
import { HouseMap } from './HouseMap';
import { Icon } from './Icon';

/** "Move to": pick a room on the floor plan, then a piece of furniture in it. */
export function MovePicker() {
  const ids = useApp((s) => s.moveIds);
  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const openMove = useApp((s) => s.openMove);
  const moveFiles = useApp((s) => s.moveFiles);
  const first = files.find((f) => f.id === ids?.[0]);
  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  if (!ids || !first) return null;

  const room = house.rooms.find((r) => r.id === (roomId ?? first.roomId)) ?? house.rooms[0];
  const pieces = room?.furniture.filter((f) => !SMART_ROLES.includes(f.role)) ?? [];
  const close = () => {
    setRoomId(undefined);
    openMove(null);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Move to" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog dialog-move">
        <header>
          <h2>Where should {ids.length === 1 ? `"${first.name}"` : `these ${ids.length} things`} live?</h2>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="move-cols">
          <HouseMap house={house} width={300} currentRoomId={room?.id} onPick={setRoomId} />
          <div className="move-list">
            <h3>{room?.name}</h3>
            {pieces.length === 0 && <p className="muted">Nothing in this room can hold files.</p>}
            {pieces.map((f) => (
              <button
                key={f.id}
                className="move-spot"
                disabled={ids.length === 1 && first.furnitureId === f.id}
                onClick={() => {
                  moveFiles(ids, room.id, f.id);
                  close();
                }}
              >
                <b>{f.name}</b>
                <span>{f.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
