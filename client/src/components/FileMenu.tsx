import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { saveFile } from '../lib/download';
import { useApp } from '../store/store';
import { Icon } from './Icon';

export interface MenuAt {
  fileId: string;
  x: number;
  y: number;
}

/** The little menu on every file: pin, move, share, download, bin. */
export function FileMenu({ at, onClose }: { at: MenuAt; onClose: () => void }) {
  const file = useApp((s) => s.files.find((f) => f.id === at.fileId));
  const app = useApp.getState();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: at.x, y: at.y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.max(8, Math.min(at.x - r.width, window.innerWidth - r.width - 8)), y: Math.max(8, Math.min(at.y + 4, window.innerHeight - r.height - 8)) });
    el.querySelector<HTMLButtonElement>('button')?.focus();
  }, [at.x, at.y]);

  useEffect(() => {
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [onClose]);

  if (!file) return null;
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const download = async () => {
    const blob = await app.fileBlob(file);
    if (!blob) return app.toast('That file has no contents to download.', { tone: 'warn' });
    const result = await saveFile(file, blob);
    if (result === 'unsupported') app.toast(`This viewer cannot save .${file.ext || 'this kind of'} files. Run Roomy from the repo to download anything.`, { tone: 'warn' });
  };

  return (
    <div className="menu" ref={ref} style={{ left: pos.x, top: pos.y }} role="menu">
      <button role="menuitem" onClick={run(() => app.openPreview(file.id))}>
        <Icon name="search" size={16} /> Open
      </button>
      {file.trashed ? (
        <>
          <button role="menuitem" onClick={run(() => app.restore([file.id]))}>
            <Icon name="undo" size={16} /> Put it back
          </button>
          <button role="menuitem" className="is-danger" onClick={run(() => void app.deleteForever([file.id]))}>
            <Icon name="trash" size={16} /> Delete for good
          </button>
        </>
      ) : (
        <>
          <button role="menuitem" onClick={run(() => app.togglePin(file.id))}>
            <Icon name="pin" size={16} /> {file.pinned ? 'Unpin' : 'Pin it up'}
          </button>
          <button role="menuitem" onClick={run(() => app.openMove([file.id]))}>
            <Icon name="move" size={16} /> Move to…
          </button>
          <button role="menuitem" onClick={run(() => void (file.shared ? app.unshare(file.id) : app.share(file.id)))}>
            <Icon name="link" size={16} /> {file.shared ? 'Stop sharing' : 'Share link'}
          </button>
          <button role="menuitem" onClick={run(() => void download())}>
            <Icon name="download" size={16} /> Download
          </button>
          <button role="menuitem" className="is-danger" onClick={run(() => app.trash([file.id]))}>
            <Icon name="trash" size={16} /> Put in the bins
          </button>
        </>
      )}
    </div>
  );
}
