import { useEffect, useState, type DragEvent } from 'react';
import { loadManifest } from './art/customArt';
import { AboutDialog } from './components/AboutDialog';
import { BottomBar } from './components/BottomBar';
import { ContainerPanel } from './components/ContainerPanel';
import { DragLayer } from './components/drag';
import { Flights } from './components/Flights';
import { Minimap } from './components/Minimap';
import { MovePicker } from './components/MovePicker';
import { Preview } from './components/Preview';
import { RenovatePanel } from './components/RenovatePanel';
import { RoomShelf } from './components/RoomShelf';
import { Sky } from './components/Sky';
import { Splash } from './components/Splash';
import { SpringClean } from './components/SpringClean';
import { Stage } from './components/Stage';
import { Toasts } from './components/Toasts';
import { TopBar } from './components/TopBar';
import { dropTargetAt } from './lib/dropTarget';
import { sounds } from './lib/sound';
import { useApp } from './store/store';

/** Day or night: the person's toggle wins, then the host page's theme, then the device setting. */
function useNight(): boolean {
  const scene = useApp((s) => s.prefs.scene);
  const [ambientDark, setAmbientDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      const stamped = document.documentElement.getAttribute('data-theme');
      setAmbientDark(stamped ? stamped === 'dark' : mq.matches);
    };
    read();
    mq.addEventListener('change', read);
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq.removeEventListener('change', read);
      mo.disconnect();
    };
  }, []);
  return scene === 'night' || (scene === 'auto' && ambientDark);
}

export default function App() {
  const ready = useApp((s) => s.ready);
  const renovate = useApp((s) => s.renovate);
  const level = useApp((s) => s.view.level);
  const night = useNight();

  useEffect(() => {
    sounds.enabled = useApp.getState().prefs.sound;
    void loadManifest();
    void useApp.getState().init();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // a text field or an open menu handles its own Escape
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '') || document.querySelector('.menu')) return;
      const s = useApp.getState();
      if (s.moveIds) return s.openMove(null);
      if (s.dialog) return s.setDialog(null);
      if (s.previewId) return s.openPreview(null);
      if (s.selectedFurnitureId) return s.selectFurniture(null);
      s.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* files dragged in from the desktop */
  const onDragOver = (e: DragEvent) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!useApp.getState().dragging) useApp.getState().setDragging(['external']);
  };
  const onDragLeave = (e: DragEvent) => {
    if (e.relatedTarget === null && useApp.getState().dragging?.[0] === 'external') useApp.getState().setDragging(null);
  };
  const onDrop = (e: DragEvent) => {
    const s = useApp.getState();
    if (s.dragging?.[0] === 'external') s.setDragging(null);
    if (!e.dataTransfer?.files.length) return;
    e.preventDefault();
    const target = dropTargetAt(e.clientX, e.clientY, s.house);
    void s.addFiles([...e.dataTransfer.files], target ?? undefined);
  };

  return (
    <div className={`app level-${level}${renovate ? ' is-renovating' : ''}`} data-scene={night ? 'night' : 'day'} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <Sky />
      {ready && (
        <>
          <Stage />
          <TopBar night={night} />
          <RoomShelf />
          <ContainerPanel />
          <Minimap />
          <RenovatePanel />
          <BottomBar />
          <Preview />
          <MovePicker />
          <SpringClean />
          <AboutDialog />
          <Flights />
          <DragLayer />
        </>
      )}
      <Toasts />
      <Splash />
    </div>
  );
}
