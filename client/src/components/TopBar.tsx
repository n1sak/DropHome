import { useEffect, useRef, useState } from 'react';
import { prettySize } from '../lib/fileKinds';
import { YARD_ID } from '../model/types';
import { findFurniture, useApp } from '../store/store';
import { Icon } from './Icon';
import { SearchBox } from './SearchBox';

export function TopBar({ night }: { night: boolean }) {
  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const view = useApp((s) => s.view);
  const renovate = useApp((s) => s.renovate);
  const prefs = useApp((s) => s.prefs);
  const storeKind = useApp((s) => s.storeKind);
  const app = useApp.getState();
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState<'samples' | 'empty' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return setConfirming(null);
    const close = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  const live = files.filter((f) => !f.trashed);
  const bytes = live.reduce((n, f) => n + f.size, 0);
  const room = view.roomId && view.roomId !== YARD_ID ? house.rooms.find((r) => r.id === view.roomId) : undefined;
  const piece = view.level === 'container' && view.furnitureId ? findFurniture(house, view.furnitureId)?.furniture : undefined;

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={app.goHome} aria-label="DropHome. Back to the whole house">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <path d="M4 15 16 4l12 11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.500 14v13h17V14" fill="var(--lamp)" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M13.500 27v-7h5v7" fill="var(--panel)" stroke="currentColor" strokeWidth="2.200" strokeLinejoin="round" />
          </svg>
          <span>DropHome</span>
        </button>

        <SearchBox />

        <div className="topbar-actions">
          {renovate ? (
            <button className="bar-btn is-on" onClick={() => app.setRenovate(false)} aria-pressed="true" title="Finish renovating">
              <Icon name="ruler" /> <span>Done</span>
            </button>
          ) : (
            <button className="icon-btn" onClick={() => app.setRenovate(true)} aria-pressed="false" aria-label="Renovate: design your house" title="Renovate">
              <Icon name="ruler" />
            </button>
          )}
          <button className="icon-btn" onClick={() => app.setScene(night ? 'day' : 'night')} aria-label={night ? 'Switch to daytime' : 'Switch to night'} title={night ? 'Daytime' : 'Night'}>
            <Icon name={night ? 'sun' : 'moon'} />
          </button>
          <div className="menu-wrap" ref={menuRef}>
            <button className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="More" aria-expanded={menu}>
              <Icon name="more" />
            </button>
            {menu && (
              <div className="menu menu-bar" role="menu">
                <button role="menuitem" onClick={() => (setMenu(false), app.setDialog('clean'))}>
                  <Icon name="broom" size={16} /> Spring clean
                </button>
                <button role="menuitem" onClick={() => (setMenu(false), app.setDialog('about'))}>
                  <Icon name="info" size={16} /> How DropHome works
                </button>
                <button role="menuitem" onClick={() => app.setSound(!prefs.sound)}>
                  <Icon name={prefs.sound ? 'soundOn' : 'soundOff'} size={16} /> Sound {prefs.sound ? 'on' : 'off'}
                </button>
                <button role="menuitem" onClick={() => (setMenu(false), app.setScene('auto'))}>
                  <Icon name="clock" size={16} /> Follow my device theme
                </button>
                <p className="menu-note" title={storeKind === 'server' ? 'Stored on the DropHome server' : 'Stored in this browser'}>
                  {live.length} things · {prettySize(bytes)}
                </p>
                <hr />
                {/* both of these erase everything, so they ask twice (window.confirm is blocked in sandboxed pages) */}
                <button role="menuitem" className={confirming === 'samples' ? 'is-danger' : ''} onClick={() => (confirming === 'samples' ? (setMenu(false), void app.resetDemo(true)) : setConfirming('samples'))}>
                  <Icon name="reset" size={16} /> {confirming === 'samples' ? 'Erase everything and reset? Click again' : 'Reset the sample house'}
                </button>
                <button role="menuitem" className={confirming === 'empty' ? 'is-danger' : ''} onClick={() => (confirming === 'empty' ? (setMenu(false), void app.resetDemo(false)) : setConfirming('empty'))}>
                  <Icon name="door" size={16} /> {confirming === 'empty' ? 'Erase everything? Click again' : 'Start with an empty house'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {view.level !== 'house' && (
        <nav className="crumbs" aria-label="Where you are">
          <button className="crumb-back" onClick={app.back} aria-label="Step back">
            <Icon name="back" size={16} />
          </button>
          <button onClick={app.goHome}>{house.name}</button>
          {room && (
            <>
              <i>›</i>
              <button onClick={() => app.enterRoom(room.id)} aria-current={view.level === 'room' ? 'page' : undefined}>
                {room.name}
              </button>
            </>
          )}
          {piece && (
            <>
              <i>›</i>
              <b aria-current="page">{piece.name}</b>
            </>
          )}
        </nav>
      )}
    </>
  );
}
