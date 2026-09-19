import { useMemo, useState } from 'react';
import { relative } from '../lib/time';
import { PORCH_ID } from '../model/types';
import { cleanupPlan, placeName, useApp } from '../store/store';
import { FileObject } from './FileObject';
import { Icon } from './Icon';

/** Spring cleaning: box up what is gathering dust, bin the doubles, unpack what never got unpacked. */
export function SpringClean() {
  const open = useApp((s) => s.dialog === 'clean');
  if (!open) return null;
  return <CleanDialog />;
}

function CleanDialog() {
  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const app = useApp.getState();
  const plan = useMemo(() => cleanupPlan(house, files), [house, files]);
  const [skip, setSkip] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSkip((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const dusty = plan.dusty.filter((d) => !skip.has(d.file.id));
  const doubles = plan.duplicates.filter((d) => !skip.has(d.extra.id));
  const nothing = !plan.dusty.length && !plan.duplicates.length && !plan.porch.length;
  const close = () => app.setDialog(null);

  const run = () => {
    close();
    app.goHome();
    setTimeout(() => {
      if (dusty.length) app.applyPlacements(dusty.map((d) => ({ id: d.file.id, roomId: d.to!.roomId, furnitureId: d.to!.furnitureId, reason: 'Boxed up during spring cleaning' })), 'Boxed up');
      if (doubles.length) app.trash(doubles.map((d) => d.extra.id));
    }, 700);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Spring cleaning" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog dialog-clean">
        <header>
          <div>
            <h2>Spring cleaning</h2>
            <p>The house noticed a few things. Untick anything you want left alone.</p>
          </div>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>

        <div className="dialog-scroll">
          {nothing && <p className="empty-note">Spotless. Nothing is gathering dust and there are no doubles.</p>}

          {plan.dusty.length > 0 && (
            <section>
              <h3>
                Gathering dust <span className="chip chip-soft">{plan.dusty.length}</span>
              </h3>
              <p className="muted">Untouched for over a year, and still sitting out. These can be boxed up and carried to the attic.</p>
              {plan.dusty.map(({ file, to }) => (
                <label key={file.id} className="clean-row" htmlFor={`dust-${file.id}`}>
                  <input id={`dust-${file.id}`} type="checkbox" checked={!skip.has(file.id)} onChange={() => toggle(file.id)} />
                  <span className="clean-object">
                    <FileObject file={file} mini flat />
                  </span>
                  <span className="clean-text">
                    <b>{file.name}</b>
                    <small>
                      {placeName(house, file.furnitureId)} → {to ? placeName(house, to.furnitureId) : 'attic'} · last touched {relative(Math.max(file.touchedAt, file.modifiedAt))}
                    </small>
                  </span>
                </label>
              ))}
            </section>
          )}

          {plan.duplicates.length > 0 && (
            <section>
              <h3>
                Doubles <span className="chip chip-soft">{plan.duplicates.length}</span>
              </h3>
              <p className="muted">Same name, same size. The extra copy goes to the bins, where it can still be rescued for 30 days.</p>
              {plan.duplicates.map(({ keep, extra }) => (
                <label key={extra.id} className="clean-row" htmlFor={`dup-${extra.id}`}>
                  <input id={`dup-${extra.id}`} type="checkbox" checked={!skip.has(extra.id)} onChange={() => toggle(extra.id)} />
                  <span className="clean-object">
                    <FileObject file={extra} mini flat />
                  </span>
                  <span className="clean-text">
                    <b>{extra.name}</b>
                    <small>
                      in {placeName(house, extra.furnitureId)}, same as "{keep.name}" in {placeName(house, keep.furnitureId)}
                    </small>
                  </span>
                </label>
              ))}
            </section>
          )}

          {plan.porch.length > 0 && (
            <section>
              <h3>
                Still on the porch <span className="chip chip-soft">{plan.porch.length}</span>
              </h3>
              <p className="muted">Delivered, never unpacked.</p>
              <button
                className="btn"
                onClick={() => {
                  close();
                  void app.unpack(PORCH_ID);
                }}
              >
                <Icon name="sparkle" size={16} /> Unpack them now
              </button>
            </section>
          )}
        </div>

        <footer>
          <button className="btn" onClick={close}>
            Not now
          </button>
          <button className="btn btn-primary" disabled={!dusty.length && !doubles.length} onClick={run}>
            <Icon name="broom" size={16} /> Tidy {dusty.length + doubles.length} {dusty.length + doubles.length === 1 ? 'thing' : 'things'}
          </button>
        </footer>
      </div>
    </div>
  );
}
