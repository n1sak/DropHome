import { contentsOf, useApp } from '../store/store';

/** Phones only: the room's furniture as a tappable list under the picture. */
export function RoomShelf() {
  const view = useApp((s) => s.view);
  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const renovate = useApp((s) => s.renovate);
  const openFurniture = useApp((s) => s.openFurniture);
  const room = view.level === 'room' ? house.rooms.find((r) => r.id === view.roomId) : undefined;
  if (!room || renovate) return null;
  return (
    <div className="roomshelf" aria-label={`Furniture in the ${room.name}`}>
      <p className="roomshelf-purpose">{room.purpose}</p>
      {room.furniture.map((f) => {
        const n = contentsOf(f, room, files).length;
        return (
          <button key={f.id} onClick={() => openFurniture(room.id, f.id)}>
            <b>{f.name}</b>
            <span>{f.hint}</span>
            <i>{n}</i>
          </button>
        );
      })}
    </div>
  );
}
