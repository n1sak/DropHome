import { useApp } from '../store/store';
import { Icon } from './Icon';

const GRAMMAR: [string, string][] = [
  ['Surfaces', 'Desks, benches and tables hold what you are working on right now.'],
  ['Closets and shelves', 'Finished work, put away and grouped by year.'],
  ['Walls and screens', 'Anything you pin in a room shows up on its corkboard, fridge door or photo wall. The TV plays this month.'],
  ['The tub and the hamper', 'Rough ideas soak in the tub. Messy files wait in the hamper for a tidy-up.'],
  ['The attic', 'Cold storage. Spring cleaning carries dusty things up there for you.'],
  ['The porch', 'Everything new lands here. One click and the house unpacks it into the right rooms.'],
];

export function AboutDialog() {
  const open = useApp((s) => s.dialog === 'about');
  const storeKind = useApp((s) => s.storeKind);
  const brain = useApp((s) => s.brain);
  const setDialog = useApp((s) => s.setDialog);
  if (!open) return null;
  const close = () => setDialog(null);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="How DropHome works" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog dialog-about">
        <header>
          <div>
            <h2>A house for your files</h2>
            <p>You already know where things go in a house. DropHome uses that instead of folders.</p>
          </div>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="dialog-scroll">
          <dl className="grammar">
            {GRAMMAR.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            Dust shows how long something has gone untouched. A room's lights are on when you have used it in the last two weeks. Every room follows the same
            grammar, so a room you build yourself in Renovate mode works the same way.
          </p>
          <p className="status-line">
            <span className="chip chip-soft">Storage: {storeKind === 'server' ? 'DropHome server' : storeKind === 'local' ? 'this browser' : 'memory only'}</span>
            <span className="chip chip-soft">Sorting: {brain === 'rules' ? 'built-in rules' : 'Claude'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
