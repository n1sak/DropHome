import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { artFor, useArtUrl, useInkBox, useManifest, type Box } from '../art/customArt';
import { drawFurniture, type Slot } from '../art/furnitureArt';
import { FurnitureSvg } from '../art/Sketch';
import { hashSeed } from '../art/sketch';
import type { Rect } from '../model/layout';
import { YARD_ID, type ArtPart, type CustomArt, type FileItem, type Furniture, type Room } from '../model/types';
import { useApp } from '../store/store';
import { FileObject } from './FileObject';
import { useStage } from './StageContext';

interface Props {
  room: Room | null;
  f: Furniture;
  /** Size in lot pixels, so the sketch is drawn at the right proportions. */
  rect: Rect;
  /** True when this piece can be clicked: its room is the one in focus (or it stands in the yard). */
  live: boolean;
  open: boolean;
  contents: FileItem[];
}

export const FurniturePiece = memo(function FurniturePiece({ room, f, rect, live, open, contents }: Props) {
  const manifest = useManifest();
  const custom = artFor(manifest, room, f);
  const renovate = useApp((s) => s.renovate);
  const selected = useApp((s) => s.selectedFurnitureId === f.id);
  const dropping = useApp((s) => !!s.dragging);
  const openFurniture = useApp((s) => s.openFurniture);
  const selectFurniture = useApp((s) => s.selectFurniture);
  const setHover = useApp((st) => st.setHover);
  const updateFurniture = useApp((s) => s.updateFurniture);
  const { cam } = useStage();
  const moved = useRef(false);
  const [hovered, setHovered] = useState(false);

  const sketch = useMemo(
    () => (custom ? null : drawFurniture(f.kind, { w: rect.w, h: rect.h, seed: hashSeed(f.id), count: contents.length })),
    [custom, f.kind, f.id, rect.w, rect.h, contents.length],
  );

  const slots: Slot[] = useMemo(() => {
    if (custom?.slots) return custom.slots.map((s) => ({ x: (s.x / 100) * rect.w, y: (s.y / 100) * rect.h, w: (s.w / 100) * rect.w, h: (s.h / 100) * rect.h, rot: s.rot, shape: s.shape }));
    return sketch?.slots ?? [];
  }, [custom, sketch, rect.w, rect.h]);

  const editable = renovate && live && !!room;

  const onClick = () => {
    if (!live || moved.current) return;
    if (editable) return selectFurniture(f.id);
    openFurniture(room ? room.id : YARD_ID, f.id);
  };

  /* Renovate mode: drag to move, corner handle to resize. Positions are % of the room. */
  const startDrag = (e: RPointerEvent, mode: 'move' | 'size') => {
    if (!editable || !room || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectFurniture(f.id);
    moved.current = false;
    const start = { x: e.clientX, y: e.clientY, fx: f.x, fy: f.y, fw: f.w, fh: f.h };
    const roomW = (rect.w / f.w) * 100 * cam.scale;
    const roomH = (rect.h / f.h) * 100 * cam.scale;
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - start.x) / roomW) * 100;
      const dy = ((ev.clientY - start.y) / roomH) * 100;
      if (Math.abs(dx) + Math.abs(dy) > 0.4) moved.current = true;
      if (mode === 'move') {
        updateFurniture(room.id, f.id, {
          x: Math.round(Math.max(0, Math.min(100 - start.fw, start.fx + dx)) * 2) / 2,
          y: Math.round(Math.max(0, Math.min(100 - start.fh, start.fy + dy)) * 2) / 2,
        });
      } else {
        updateFurniture(room.id, f.id, {
          w: Math.round(Math.max(6, Math.min(100 - start.fx, start.fw + dx)) * 2) / 2,
          h: Math.round(Math.max(8, Math.min(100 - start.fy, start.fh + dy)) * 2) / 2,
        });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      setTimeout(() => (moved.current = false), 0);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const slotLayer = slots.length > 0 ? <SlotLayer f={f} slots={slots} w={rect.w} h={rect.h} contents={contents} open={open} /> : null;

  const style: CSSProperties = room
    ? { left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }
    : { left: rect.x, top: rect.y, width: rect.w, height: rect.h };

  return (
    <div
      className={`furn furn-${f.kind}${open ? ' is-open' : ''}${live ? ' is-live' : ''}${selected ? ' is-selected' : ''}${editable ? ' is-editable' : ''}${custom?.baked ? ' is-baked' : ''}${dropping && live ? ' is-target' : ''}`}
      style={style}
      data-furniture-id={f.id}
      data-drop-furniture={f.id}
      data-drop-room={room ? room.id : YARD_ID}
      onClick={onClick}
      onPointerDown={editable ? (e) => startDrag(e, 'move') : undefined}
      onPointerEnter={() => (setHover(f.id), custom && setHovered(true))}
      onPointerLeave={() => (setHover(null), custom && setHovered(false))}
    >
      {custom ? (
        // slots go inside the art's own canvas, so the TV picture stays on the drawn screen whatever shape the box is
        <CustomArtView art={custom} open={open || (hovered && live && !editable)}>
          {slotLayer}
        </CustomArtView>
      ) : (
        <>
          {sketch && <FurnitureSvg w={rect.w} h={rect.h} art={sketch} />}
          {slotLayer}
        </>
      )}
      {editable && selected && <span className="furn-handle" onPointerDown={(e) => startDrag(e, 'size')} />}
    </div>
  );
});

/**
 * Hand-drawn art for a piece. Any mix of: a closed and an open drawing (cross-fade), a flipbook of
 * frames between them, and separately drawn layers that swing, slide or lift when the piece opens.
 */
function CustomArtView({ art, open, children }: { art: CustomArt; open: boolean; children?: ReactNode }) {
  const frames = art.frames?.length ? art.frames : null;
  const closedUrl = useArtUrl(art.closed ?? art.open);
  const openUrl = useArtUrl(art.open ?? art.closed);
  const [frame, setFrame] = useState(open && frames ? frames.length - 1 : 0);
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!frames) return;
    const target = open ? frames.length - 1 : 0;
    const timer = setInterval(
      () =>
        setFrame((n) => {
          if (n === target) {
            clearInterval(timer);
            return n;
          }
          return n + (target > n ? 1 : -1);
        }),
      1000 / (art.fps ?? 10),
    );
    return () => clearInterval(timer);
  }, [open, frames, art.fps]);

  // every layer shares one canvas, sized like the first drawing that loads, so percentages always line up
  const measure = (e: { currentTarget: HTMLImageElement }) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!ratio && w && h) setRatio(w / h);
  };

  // part of the room backdrop: nothing to draw while closed, but an "open" drawing can still appear over it
  const base = art.baked ? (
    art.open && openUrl ? <img className={`furn-img${open ? '' : ' is-hidden'}`} src={openUrl} alt="" draggable={false} onLoad={measure} /> : null
  ) : frames ? (
    <FlipFrames frames={frames} index={frame} onLoad={measure} />
  ) : (
    <>
      {closedUrl && <img className={`furn-img${open && openUrl !== closedUrl ? ' is-hidden' : ''}`} src={closedUrl} alt="" draggable={false} onLoad={measure} />}
      {openUrl && openUrl !== closedUrl && <img className={`furn-img${open ? '' : ' is-hidden'}`} src={openUrl} alt="" draggable={false} />}
    </>
  );

  const parts = art.parts ?? [];
  return (
    <div className={`furn-art${open ? ' is-open' : ''}`} style={ratio ? ({ '--ar': ratio } as CSSProperties) : undefined}>
      {parts.filter((p) => p.behind).map((p, i) => <PartLayer key={`b${i}`} part={p} onLoad={measure} />)}
      {base}
      {parts.filter((p) => !p.behind).map((p, i) => <PartLayer key={`f${i}`} part={p} onLoad={measure} />)}
      {children}
    </div>
  );
}

/** Ready-made movements, worked out from where the ink actually is on the layer. */
function motionFor(part: ArtPart, b: Box): { closed?: string; open?: string; origin?: string; co?: number; oo?: number } {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  switch (part.motion) {
    case 'swing-left':
      return { open: 'scaleX(0.13) skewY(-7deg)', origin: `${b.x}% ${cy}%` };
    case 'swing-right':
      return { open: 'scaleX(0.13) skewY(7deg)', origin: `${b.x + b.w}% ${cy}%` };
    case 'slide-down':
      return { open: `translateY(${(b.h * 0.45).toFixed(1)}%) scale(1.04)`, origin: `${cx}% ${b.y}%` };
    case 'slide-up':
      return { open: `translateY(-${(b.h * 0.45).toFixed(1)}%)`, origin: `${cx}% ${cy}%` };
    case 'lift':
      return { open: `translateY(-${(b.h * 0.6).toFixed(1)}%) rotate(-7deg)`, origin: `${b.x}% ${b.y + b.h}%` };
    case 'pop':
      return { open: `translateY(-${(b.h * 0.12).toFixed(1)}%) rotate(-4deg)`, origin: `${cx}% ${b.y + b.h}%` };
    case 'rise':
      return { closed: `translateY(${(b.h * 0.3).toFixed(1)}%)`, open: `translateY(-${(b.h * 0.12).toFixed(1)}%)`, origin: `${cx}% ${cy}%` };
    case 'fade-in':
      return { co: 0, oo: 1 };
    case 'fade-out':
      return { co: 1, oo: 0 };
    default:
      return {};
  }
}

function PartLayer({ part, onLoad }: { part: ArtPart; onLoad: (e: { currentTarget: HTMLImageElement }) => void }) {
  const url = useArtUrl(part.src);
  const placed = part.w !== undefined && part.h !== undefined;
  const ink = useInkBox(placed ? undefined : url); // a placed layer is its own box; a full-canvas one is measured
  if (!url) return null;
  const m = motionFor(part, placed ? { x: 0, y: 0, w: 100, h: 100 } : ink);
  const style: Record<string, string | number> = placed ? { left: `${part.x ?? 0}%`, top: `${part.y ?? 0}%`, width: `${part.w}%`, height: `${part.h}%` } : {};
  const closed = part.closed ?? m.closed;
  const opened = part.open ?? m.open;
  if (closed) style['--ct'] = closed;
  if (opened) style['--ot'] = opened;
  if (m.co !== undefined) style['--co'] = m.co;
  if (m.oo !== undefined) style['--oo'] = m.oo;
  style.transformOrigin = part.origin ?? m.origin ?? '50% 50%';
  if (part.delay) style.transitionDelay = `${part.delay}ms`;
  return <img className="furn-img furn-part fpart" src={url} alt="" draggable={false} style={style as CSSProperties} onLoad={placed ? undefined : onLoad} />;
}

type OnLoad = (e: { currentTarget: HTMLImageElement }) => void;

function FlipFrames({ frames, index, onLoad }: { frames: string[]; index: number; onLoad: OnLoad }) {
  return (
    <>
      {frames.map((ref, i) => (
        <FlipFrame key={ref + i} src={ref} shown={i === index} onLoad={i === 0 ? onLoad : undefined} />
      ))}
    </>
  );
}

function FlipFrame({ src, shown, onLoad }: { src: string; shown: boolean; onLoad?: OnLoad }) {
  const url = useArtUrl(src);
  return url ? <img className={`furn-img furn-frame${shown ? '' : ' is-hidden'}`} src={url} alt="" draggable={false} onLoad={onLoad} /> : null;
}

/** Live content laid over the art: the TV picture, photos in their frames, notes on the fridge. */
function SlotLayer({ f, slots, w, h, contents, open }: { f: Furniture; slots: Slot[]; w: number; h: number; contents: FileItem[]; open: boolean }) {
  const images = useMemo(() => contents.filter((c) => c.kind === 'image' && (c.thumb || c.thumbUrl)), [contents]);
  const isScreen = slots[0]?.shape === 'screen';
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isScreen || images.length < 2) return;
    const timer = setInterval(() => setTick((n) => n + 1), 3600);
    return () => clearInterval(timer);
  }, [isScreen, images.length]);

  const pct = (s: Slot): CSSProperties => ({
    left: `${(s.x / w) * 100}%`,
    top: `${(s.y / h) * 100}%`,
    width: `${(s.w / w) * 100}%`,
    height: `${(s.h / h) * 100}%`,
    transform: s.rot ? `rotate(${s.rot}deg)` : undefined,
  });

  if (isScreen) {
    const showing = images.length ? images[tick % images.length] : null;
    const src = showing?.thumb ?? showing?.thumbUrl;
    return (
      <div className={`slot slot-screen${src ? ' is-on' : ''}${f.kind === 'tv' ? ' slot-tv' : ''}`} style={pct(slots[0])}>
        {src ? <div key={showing!.id} className="slot-picture" style={{ backgroundImage: `url("${src}")` }} /> : f.kind === 'tv' ? <div className="slot-idle" /> : null}
      </div>
    );
  }

  const fill = f.kind === 'photoWall' || slots[0]?.shape === 'oval';
  const pool = fill ? images : contents;
  return (
    <div className={`slots${open ? ' is-dim' : ''}`}>
      {slots.map((s, i) => {
        const item = pool[i];
        if (!item) return null;
        const src = item.thumb ?? item.thumbUrl;
        return (
          <div key={i} className={`slot${s.shape === 'oval' ? ' slot-oval' : ''}${fill ? ' slot-fill' : ' slot-note'}`} style={pct(s)}>
            {fill ? <div className="slot-picture" style={{ backgroundImage: `url("${src}")` }} /> : <FileObject file={item} mini flat />}
          </div>
        );
      })}
    </div>
  );
}
