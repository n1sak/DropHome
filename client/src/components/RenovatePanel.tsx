import { useRef } from 'react';
import { freeCells, floorRange } from '../model/layout';
import { ADDABLE, ADDABLE_ROOMS, CATALOG, ROOM_TEMPLATES, WALL_SWATCHES } from '../model/templates';
import type { Furniture, Role, Room } from '../model/types';
import { useApp } from '../store/store';
import { Icon } from './Icon';

const ROLES: [Role, string][] = [
  ['active', 'In use now'], ['archive', 'Put away, by year'], ['display', 'Pinned up'], ['drafts', 'Still soaking'], ['reference', 'Kept handy'],
  ['memories', 'Keepsakes'], ['media', 'Music and video'], ['vault', 'Important documents'], ['backup', 'Backups'], ['cleanup', 'Needs a tidy'], ['misc', 'Odds and ends'],
  ['recent', 'Live: recently touched'], ['shared', 'Live: shared links'], ['screen', 'Live: photo slideshow'],
];

const floorName = (f: number) => (f === 0 ? 'Ground floor' : f > 0 ? `Floor ${f + 1}` : f === -1 ? 'Basement' : `Basement ${-f}`);

/** Renovate mode: the house becomes a blueprint you can edit. */
export function RenovatePanel() {
  const renovate = useApp((s) => s.renovate);
  const view = useApp((s) => s.view);
  const house = useApp((s) => s.house);
  const selectedId = useApp((s) => s.selectedFurnitureId);
  if (!renovate) return null;
  const room = view.level !== 'house' ? house.rooms.find((r) => r.id === view.roomId) : undefined;
  const piece = room?.furniture.find((f) => f.id === selectedId);
  return (
    <aside className="renovate" aria-label="Renovate">
      <div className="renovate-scroll">{room ? piece ? <PieceInspector room={room} piece={piece} /> : <RoomInspector room={room} /> : <HouseInspector />}</div>
    </aside>
  );
}

function HouseInspector() {
  const house = useApp((s) => s.house);
  const target = useApp((s) => s.buildTarget);
  const app = useApp.getState();
  const { top, bottom } = floorRange(house);
  const topEmpty = top > 0 && !house.rooms.some((r) => r.floor === top);
  const bottomEmpty = bottom < 0 && !house.rooms.some((r) => r.floor === bottom);

  if (target) {
    return (
      <>
        <header className="renovate-head">
          <button className="icon-btn" onClick={() => app.setBuildTarget(null)} aria-label="Back">
            <Icon name="back" />
          </button>
          <div>
            <h2>Build a room</h2>
            <p>
              {floorName(target.floor)}, spot {target.col + 1}
            </p>
          </div>
        </header>
        <div className="catalog">
          {ADDABLE_ROOMS.map((kind) => {
            const t = ROOM_TEMPLATES[kind];
            return (
              <button key={kind} className="catalog-room" onClick={() => app.addRoom(kind, target.floor, target.col)}>
                <i style={{ background: t.wall }} />
                <b>{t.name}</b>
                <span>{t.blurb}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <header className="renovate-head">
        <div>
          <h2>Renovate</h2>
          <p>Design the house around your own life. Click a room to furnish it, or an empty spot to build.</p>
        </div>
      </header>
      <label className="field" htmlFor="house-name">
        <span>House name</span>
        <input id="house-name" defaultValue={house.name} onBlur={(e) => app.renameHouse(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
      </label>
      <h3>Floors</h3>
      <div className="btn-col">
        <button className="btn" onClick={() => app.addFloor('top')} disabled={top >= 4}>
          <Icon name="plus" size={16} /> Add a floor under the roof
        </button>
        <button className="btn" onClick={() => app.addFloor('bottom')} disabled={bottom <= -2}>
          <Icon name="plus" size={16} /> Dig a level below
        </button>
        {topEmpty && (
          <button className="btn" onClick={() => app.removeFloor(top)}>
            <Icon name="minus" size={16} /> Remove the empty top floor
          </button>
        )}
        {bottomEmpty && (
          <button className="btn" onClick={() => app.removeFloor(bottom)}>
            <Icon name="minus" size={16} /> Fill in the empty bottom level
          </button>
        )}
      </div>
      <h3>Your own art</h3>
      <p className="muted">
        Every room and every piece of furniture can wear your own drawings. Step into a room, then use "Room backdrop" or select a piece and use "Swap art". The files
        still open, close and sort the same way.
      </p>
    </>
  );
}

function RoomInspector({ room }: { room: Room }) {
  const house = useApp((s) => s.house);
  const app = useApp.getState();
  const bg = useRef<HTMLInputElement>(null);
  const attic = room.floor === 'attic';
  const { top, bottom } = floorRange(house);
  const canWiden = !attic && room.col + room.span < house.columns && freeCells(house, room.floor as number, room.id)[room.col + room.span];

  return (
    <>
      <header className="renovate-head">
        <button className="icon-btn" onClick={app.goHome} aria-label="Back to the whole house">
          <Icon name="back" />
        </button>
        <div>
          <h2>{room.name}</h2>
          <p>Drag furniture to move it. Click a piece to edit it.</p>
        </div>
      </header>

      <label className="field" htmlFor="room-name">
        <span>Room name</span>
        <input id="room-name" key={room.id + 'n'} defaultValue={room.name} onBlur={(e) => e.target.value.trim() && app.updateRoom(room.id, { name: e.target.value.trim() })} />
      </label>
      <label className="field" htmlFor="room-purpose">
        <span>What is it for? The sorter reads this.</span>
        <textarea id="room-purpose" key={room.id + 'p'} rows={3} defaultValue={room.purpose} onBlur={(e) => app.updateRoom(room.id, { purpose: e.target.value.trim() })} />
      </label>

      <h3>Wall colour</h3>
      <div className="swatches">
        {WALL_SWATCHES.map((c) => (
          <button key={c} className={room.wall === c ? 'is-on' : ''} style={{ background: c }} onClick={() => app.updateRoom(room.id, { wall: c })} aria-label={`Wall colour ${c}`} />
        ))}
      </div>

      {!attic && (
        <>
          <h3>Position</h3>
          <div className="cellgrid" style={{ gridTemplateColumns: `repeat(${house.columns}, 1fr)` }}>
            {Array.from({ length: top - bottom + 1 }, (_, i) => top - i).flatMap((floor) =>
              Array.from({ length: house.columns }, (_, col) => {
                const here = house.rooms.find((r) => r.floor === floor && col >= r.col && col < r.col + r.span);
                const mine = here?.id === room.id;
                return (
                  <button key={`${floor}:${col}`} className={mine ? 'is-on' : ''} disabled={mine} onClick={() => app.moveRoom(room.id, floor, col)} title={here ? `Swap with ${here.name}` : 'Move here'}>
                    {here ? here.name.slice(0, 9) : '+'}
                  </button>
                );
              }),
            )}
          </div>
          <div className="btn-row">
            <button className="btn" disabled={!canWiden} onClick={() => app.setRoomSpan(room.id, room.span + 1)}>
              <Icon name="width" size={16} /> Wider
            </button>
            <button className="btn" disabled={room.span <= 1} onClick={() => app.setRoomSpan(room.id, room.span - 1)}>
              Narrower
            </button>
          </div>
        </>
      )}

      <h3>Room backdrop</h3>
      <div className="btn-row">
        <button className="btn" onClick={() => bg.current?.click()}>
          <Icon name="image" size={16} /> {room.background ? 'Replace drawing' : 'Use my drawing'}
        </button>
        {room.background && (
          <button className="btn" onClick={() => void app.setRoomBackground(room.id, null)}>
            Back to sketch
          </button>
        )}
      </div>
      <p className="muted">A 16:10 image (1600 × 1000 works well). Furniture is layered on top of it.</p>
      <input id="room-bg" ref={bg} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void app.setRoomBackground(room.id, e.target.files[0])} />

      <h3>Add furniture</h3>
      <div className="catalog catalog-pieces">
        {ADDABLE.map((kind) => (
          <button key={kind} className="catalog-piece" onClick={() => app.addFurniture(room.id, kind)}>
            <b>{CATALOG[kind].label}</b>
            <span>{ROLES.find(([r]) => r === CATALOG[kind].role)?.[1]}</span>
          </button>
        ))}
      </div>

      <h3>Demolition</h3>
      <button className="btn btn-danger" onClick={() => app.removeRoom(room.id)}>
        <Icon name="trash" size={16} /> Knock down this room
      </button>
      <p className="muted">Anything inside is carried out to the porch first.</p>
    </>
  );
}

function PieceInspector({ room, piece }: { room: Room; piece: Furniture }) {
  const app = useApp.getState();
  const closed = useRef<HTMLInputElement>(null);
  const opened = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Furniture>) => app.updateFurniture(room.id, piece.id, p);

  return (
    <>
      <header className="renovate-head">
        <button className="icon-btn" onClick={() => app.selectFurniture(null)} aria-label="Back to the room">
          <Icon name="back" />
        </button>
        <div>
          <h2>{piece.name}</h2>
          <p>
            {CATALOG[piece.kind].label} in the {room.name.toLowerCase()}
          </p>
        </div>
      </header>

      <label className="field" htmlFor="piece-name">
        <span>Name</span>
        <input id="piece-name" key={piece.id + 'n'} defaultValue={piece.name} onBlur={(e) => e.target.value.trim() && set({ name: e.target.value.trim() })} />
      </label>
      <label className="field" htmlFor="piece-hint">
        <span>What belongs here? The sorter reads this.</span>
        <input id="piece-hint" key={piece.id + 'h'} defaultValue={piece.hint} onBlur={(e) => set({ hint: e.target.value.trim() })} />
      </label>
      <label className="field" htmlFor="piece-role">
        <span>What it means</span>
        <select id="piece-role" value={piece.role} onChange={(e) => set({ role: e.target.value as Role })}>
          {ROLES.map(([r, label]) => (
            <option key={r} value={r}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <h3>Swap art</h3>
      <p className="muted">Transparent PNGs of the piece closed and open. With only one, it is used for both.</p>
      <div className="btn-row">
        <button className="btn" onClick={() => closed.current?.click()}>
          <Icon name="image" size={16} /> {piece.art?.closed ? 'Replace closed' : 'Closed drawing'}
        </button>
        <button className="btn" onClick={() => opened.current?.click()}>
          <Icon name="image" size={16} /> {piece.art?.open ? 'Replace open' : 'Open drawing'}
        </button>
      </div>
      {(piece.art?.closed || piece.art?.open) && (
        <button
          className="btn"
          onClick={async () => {
            await app.setFurnitureArt(room.id, piece.id, 'closed', null);
            await app.setFurnitureArt(room.id, piece.id, 'open', null);
          }}
        >
          Back to sketch
        </button>
      )}
      <label className="check" htmlFor="piece-baked">
        <input id="piece-baked" type="checkbox" checked={!!piece.art?.baked} onChange={(e) => set({ art: { ...(piece.art ?? {}), baked: e.target.checked || undefined } })} />
        Already drawn into the room backdrop (keep it clickable, draw nothing)
      </label>
      <input id="piece-art-closed" ref={closed} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void app.setFurnitureArt(room.id, piece.id, 'closed', e.target.files[0])} />
      <input id="piece-art-open" ref={opened} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void app.setFurnitureArt(room.id, piece.id, 'open', e.target.files[0])} />

      <h3>Placement</h3>
      <p className="mono">
        x {piece.x}% · y {piece.y}% · w {piece.w}% · h {piece.h}%
      </p>
      <p className="muted">Drag the piece to move it. Drag its corner to resize.</p>

      <h3>Remove</h3>
      <button className="btn btn-danger" onClick={() => app.removeFurniture(room.id, piece.id)}>
        <Icon name="trash" size={16} /> Take this piece out
      </button>
      <p className="muted">Anything inside is carried out to the porch first.</p>
    </>
  );
}
