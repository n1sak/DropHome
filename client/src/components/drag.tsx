import { useRef, type PointerEvent as RPointerEvent } from 'react';
import { create } from 'zustand';
import { dropTargetAt } from '../lib/dropTarget';
import { BINS_ID, type FileItem } from '../model/types';
import { placeName, useApp } from '../store/store';
import { FileObject } from './FileObject';

interface DragState {
  file: FileItem | null;
  x: number;
  y: number;
  label: string;
}

const useDrag = create<DragState>(() => ({ file: null, x: 0, y: 0, label: '' }));

/**
 * Pick a file up and carry it somewhere: onto furniture, onto a room, onto the
 * minimap, or into the bins. Mouse and pen only; on touch, "Move to" does the job
 * without fighting the scroll gesture.
 */
export function useFileDrag(file: FileItem, onTap: () => void) {
  const dragged = useRef(false);

  const onPointerDown = (e: RPointerEvent) => {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const start = { x: e.clientX, y: e.clientY };
    let active = false;
    let raf = 0;

    const onMove = (ev: PointerEvent) => {
      if (!active && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 7) {
        active = true;
        dragged.current = true;
        useApp.getState().setDragging([file.id]);
        document.body.classList.add('is-dragging-file');
      }
      if (!active) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const house = useApp.getState().house;
        const target = dropTargetAt(ev.clientX, ev.clientY, house);
        const same = target && target.furnitureId === file.furnitureId;
        useDrag.setState({ file, x: ev.clientX, y: ev.clientY, label: target && !same ? placeName(house, target.furnitureId) : '' });
      });
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      cancelAnimationFrame(raf);
      if (!active) return;
      document.body.classList.remove('is-dragging-file');
      const app = useApp.getState();
      const target = ev.type === 'pointercancel' ? null : dropTargetAt(ev.clientX, ev.clientY, app.house);
      useDrag.setState({ file: null, label: '' });
      app.setDragging(null);
      if (target && target.furnitureId !== file.furnitureId) {
        if (target.furnitureId === BINS_ID) app.trash([file.id]);
        else app.moveFiles([file.id], target.roomId, target.furnitureId, { fly: false });
      }
      setTimeout(() => (dragged.current = false), 0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const onClick = () => {
    if (!dragged.current) onTap();
  };

  return { onPointerDown, onClick };
}

/** The thing in your hand while you drag. */
export function DragLayer() {
  const { file, x, y, label } = useDrag();
  if (!file) return null;
  return (
    <div className="drag-ghost" style={{ transform: `translate(${x}px, ${y}px)` }} aria-hidden="true">
      <div className="drag-ghost-object">
        <FileObject file={file} mini flat />
      </div>
      {label && <div className="drag-ghost-label">{label}</div>}
    </div>
  );
}
