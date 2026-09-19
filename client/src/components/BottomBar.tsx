import { useRef } from 'react';
import { BINS_ID, MAILBOX_ID, PORCH_ID, YARD_ID } from '../model/types';
import { useApp } from '../store/store';
import { Icon } from './Icon';

/** Bottom of the house view: first-run hints, the porch status, and unpacking progress. */
export function BottomBar() {
  const view = useApp((s) => s.view);
  const waiting = useApp((s) => s.files.filter((f) => f.furnitureId === PORCH_ID && !f.trashed).length);
  const unpacking = useApp((s) => s.unpacking);
  const brain = useApp((s) => s.brain);
  const hintsSeen = useApp((s) => s.prefs.hintsSeen);
  const renovate = useApp((s) => s.renovate);
  const app = useApp.getState();
  const input = useRef<HTMLInputElement>(null);

  if (unpacking) {
    const thinking = unpacking.done === 0;
    const who = unpacking.brain === 'rules' ? 'The house' : 'Claude';
    return (
      <div className="bottombar">
        <div className="pill pill-busy">
          <Icon name="sparkle" />
          <span>{thinking ? `${who} is reading the labels on ${unpacking.total} ${unpacking.total === 1 ? 'box' : 'boxes'}…` : `Carrying things in: ${unpacking.done} of ${unpacking.total}`}</span>
          <span className="pill-progress">
            <i style={{ width: `${(unpacking.done / unpacking.total) * 100}%` }} />
          </span>
          {thinking && unpacking.brain !== 'rules' && (
            <button className="link" onClick={app.cancelUnpack}>
              Use the built-in rules instead
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view.level !== 'house' || renovate) return null;

  return (
    <div className="bottombar">
      {!hintsSeen && (
        <div className="hint">
          <span>
            <b>Click a room</b> to step inside. <b>Drop files</b> anywhere on the house. Press <kbd>/</kbd> to find anything.
          </span>
          <button className="icon-btn" onClick={app.dismissHints} aria-label="Got it">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <div className="pill">
        <button className="pill-label" onClick={() => app.openFurniture(YARD_ID, PORCH_ID)} aria-label="Open the porch">
          <Icon name="box" />
          <span>{waiting ? `${waiting} ${waiting === 1 ? 'box' : 'boxes'} on the porch` : 'The porch is clear'}</span>
        </button>
        {waiting > 0 && (
          <button className="btn btn-primary" onClick={() => void app.unpack(PORCH_ID)}>
            <Icon name="sparkle" size={16} /> Unpack{brain === 'rules' ? '' : ' with Claude'}
          </button>
        )}
        <button className="btn" onClick={() => input.current?.click()}>
          <Icon name="upload" size={16} /> Bring in files
        </button>
        <span className="pill-yard">
          <button className="icon-btn" onClick={() => app.openFurniture(YARD_ID, MAILBOX_ID)} aria-label="Open the mailbox">
            <Icon name="mail" size={17} />
          </button>
          <button className="icon-btn" onClick={() => app.openFurniture(YARD_ID, BINS_ID)} aria-label="Open the bins">
            <Icon name="trash" size={17} />
          </button>
        </span>
        <input
          id="bring-in-files"
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const list = [...(e.target.files ?? [])];
            e.target.value = '';
            void app.addFiles(list);
          }}
        />
      </div>
    </div>
  );
}
