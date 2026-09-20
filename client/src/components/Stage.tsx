import { useEffect, useMemo, useRef, useState } from 'react';
import { useArtUrl, useManifest } from '../art/customArt';
import { drawLot } from '../art/lotArt';
import { drawEmptyCell } from '../art/roomArt';
import { SketchSvg } from '../art/Sketch';
import { cellRect, freeCells, geometry, yardRect } from '../model/layout';
import { YARD_ID } from '../model/types';
import { cameraFor } from '../store/camera';
import { contentsOf, useApp } from '../store/store';
import { FurniturePiece } from './FurniturePiece';
import { Labels } from './Labels';
import { RoomCell } from './RoomCell';
import { StageContext } from './StageContext';

export function Stage() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [instant, setInstant] = useState(true);
  const [settled, setSettled] = useState(false);

  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const view = useApp((s) => s.view);
  const renovate = useApp((s) => s.renovate);
  const uploading = useApp((s) => s.uploading > 0);
  const back = useApp((s) => s.back);
  const dropHint = useApp((s) => s.dragging?.[0] === 'external');
  const hint = useApp((s) => !s.prefs.hintsSeen && !s.renovate);
  const manifest = useManifest();
  const shellUrl = useArtUrl(manifest.shell);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setInstant(true);
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => geometry(house), [house]);
  const cam = useMemo(() => cameraFor(view, geo, house, size, renovate, hint), [view, geo, house, size, renovate, hint]);

  // labels live outside the camera, so they wait for it to stop moving
  useEffect(() => {
    setSettled(false);
    const t = setTimeout(() => setSettled(true), instant ? 60 : 760);
    return () => clearTimeout(t);
  }, [cam.x, cam.y, cam.scale, instant]);

  useEffect(() => {
    if (!instant) return;
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    return () => cancelAnimationFrame(t);
  }, [instant, size]);

  const lot = useMemo(() => drawLot(geo), [geo]);

  const empties = useMemo(() => {
    const out: { floor: number; col: number }[] = [];
    for (let floor = geo.topFloor; floor >= geo.bottomFloor; floor--) {
      freeCells(house, floor).forEach((free, col) => free && out.push({ floor, col }));
    }
    return out;
  }, [house, geo]);

  const yardOpen = view.level === 'container' && view.roomId === YARD_ID;

  const ready = size.w > 0;

  return (
    <div
      className={`stage${renovate ? ' is-renovating' : ''}${dropHint ? ' is-dropping' : ''}`}
      ref={ref}
      onClick={(e) => e.target === e.currentTarget && back()}
    >
      {ready && (
        <StageContext.Provider value={{ cam, geo, size, settled }}>
          <div
            className={`camera${instant ? ' is-instant' : ''}`}
            style={{ width: geo.lot.w, height: geo.lot.h, transform: `translate3d(${cam.x.toFixed(2)}px, ${cam.y.toFixed(2)}px, 0) scale(${cam.scale.toFixed(4)})` }}
            onClick={(e) => e.target === e.currentTarget && back()}
          >
            {shellUrl ? <img className="lot-art" src={shellUrl} alt="" draggable={false} /> : <SketchSvg className="lot-art" w={geo.lot.w} h={geo.lot.h} paths={lot} />}

            <div className={`smoke${uploading ? ' is-busy' : ''}`} style={{ left: geo.roof.apex.x + 250, top: geo.roof.apex.y + 28 }} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>

            {empties.map(({ floor, col }) => {
              const r = cellRect(geo, floor, col);
              return (
                <div key={`${floor}:${col}`} className="room room-empty" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
                  <SketchSvg className="room-bg" w={r.w} h={r.h} paths={drawEmptyCell(r.w, r.h, floor * 7 + col + 40)} />
                  <div className="room-shade" />
                  <div className="room-edge" />
                </div>
              );
            })}

            {house.rooms.map((room) => (
              <RoomCell key={room.id} room={room} geo={geo} files={files} />
            ))}

            {house.yard.map((f) => (
              <FurniturePiece
                key={f.id}
                room={null}
                f={f}
                rect={yardRect(geo, f)}
                live={view.level === 'house' || yardOpen}
                open={yardOpen && view.furnitureId === f.id}
                contents={contentsOf(f, null, files)}
              />
            ))}
          </div>
          <Labels />
        </StageContext.Provider>
      )}
      {dropHint && (
        <div className="drop-hint" aria-hidden="true">
          <b>Drop it where it belongs</b>
          <span>On a room or a piece of furniture to put it there. Anywhere else, and it waits on the porch to be unpacked.</span>
        </div>
      )}
    </div>
  );
}
