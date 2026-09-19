import { BINS_ID, YARD_ID } from '../model/types';
import { useApp } from '../store/store';
import { HouseMap } from './HouseMap';

/** Bottom-left floor plan: shows where you are, jumps between rooms, and catches dragged files. */
export function Minimap() {
  const house = useApp((s) => s.house);
  const view = useApp((s) => s.view);
  const dragging = useApp((s) => !!s.dragging);
  const enterRoom = useApp((s) => s.enterRoom);
  const openFurniture = useApp((s) => s.openFurniture);
  if (view.level === 'house') return null;
  return (
    <nav className={`minimap${dragging ? ' is-target' : ''}`} aria-label="House map">
      <HouseMap house={house} width={dragging ? 210 : 168} currentRoomId={view.roomId} onPick={enterRoom} droppable showBins onBins={() => openFurniture(YARD_ID, BINS_ID)} labels={dragging} />
      {dragging && <p>Drop on a room to move it there</p>}
    </nav>
  );
}
