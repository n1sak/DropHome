import { useEffect, useMemo, useRef, useState } from 'react';
import { SMART_ROLES } from '../ai/rules';
import { prettySize } from '../lib/fileKinds';
import { relative, yearOf } from '../lib/time';
import { BINS_ID, YARD_ID, type FileItem, type Furniture, type Role } from '../model/types';
import { contentsOf, findFurniture, placeName, useApp } from '../store/store';
import { useFileDrag } from './drag';
import { FileMenu, type MenuAt } from './FileMenu';
import { FileObject } from './FileObject';
import { Icon } from './Icon';
import { useFileUrl } from './useFileUrl';

const ROLE_LABEL: Record<Role, string> = {
  active: 'In use now', archive: 'Put away', display: 'Pinned up', drafts: 'Still soaking', reference: 'Kept handy', memories: 'Keepsakes',
  media: 'Music and video', vault: 'Locked away', backup: 'Backups', cleanup: 'Needs a tidy', misc: 'Odds and ends', inbox: 'Just delivered',
  trash: 'Thrown out', recent: 'Live view', shared: 'Live view', screen: 'Now playing',
};

const SMART_NOTE: Partial<Record<Role, string>> = {
  recent: 'A live view of what you touched last, from every room. Nothing is stored here.',
  shared: 'A live view of everything that has a share link. Nothing is stored here.',
  screen: 'Plays the photos in this room: the ones you pinned, and anything from the last 30 days.',
  display: 'Shows what is kept here, plus everything you pin elsewhere in this room.',
};

type Sort = 'recent' | 'name' | 'kind';

export function ContainerPanel() {
  const view = useApp((s) => s.view);
  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const hit = view.level === 'container' && view.furnitureId ? findFurniture(house, view.furnitureId) : null;
  if (!hit) return null;
  return <Panel key={hit.furniture.id} furniture={hit.furniture} roomId={hit.room ? hit.room.id : YARD_ID} files={files} />;
}

function Panel({ furniture: f, roomId, files }: { furniture: Furniture; roomId: string; files: FileItem[] }) {
  const house = useApp((s) => s.house);
  const back = useApp((s) => s.back);
  const addFiles = useApp((s) => s.addFiles);
  const unpack = useApp((s) => s.unpack);
  const brain = useApp((s) => s.brain);
  const deleteForever = useApp((s) => s.deleteForever);
  const dropLink = useApp((s) => s.dropLink);
  const toast = useApp((s) => s.toast);
  const highlightId = useApp((s) => s.highlightId);
  const storeKind = useApp((s) => s.storeKind);
  const [sort, setSort] = useState<Sort>('recent');
  const [menu, setMenu] = useState<MenuAt | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const room = house.rooms.find((r) => r.id === roomId) ?? null;
  const items = useMemo(() => {
    const list = contentsOf(f, room, files);
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'kind') return [...list].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
    return list;
  }, [f, room, files, sort]);

  const smart = SMART_ROLES.includes(f.role) && f.role !== 'inbox' && f.role !== 'trash';
  const byYear = ['archive', 'memories', 'backup'].includes(f.role) && sort === 'recent';
  const groups = useMemo(() => {
    if (!byYear) return [{ label: '', items }];
    const map = new Map<number, FileItem[]>();
    for (const it of items) map.set(yearOf(it.modifiedAt), [...(map.get(yearOf(it.modifiedAt)) ?? []), it]);
    return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([y, its]) => ({ label: String(y), items: its }));
  }, [items, byYear]);

  const total = items.reduce((n, it) => n + it.size, 0);

  return (
    <aside className={`panel panel-${f.role} panel-kind-${f.kind}`} data-drop-furniture={f.id} data-drop-room={roomId} aria-label={`Inside the ${f.name}`}>
      <header className="panel-head">
        <div className="panel-title">
          <span className="chip">{ROLE_LABEL[f.role]}</span>
          <h2>{f.name}</h2>
          <p>{f.hint}</p>
        </div>
        <button className="icon-btn" onClick={back} aria-label="Close">
          <Icon name="close" />
        </button>
      </header>

      <div className="panel-tools">
        {f.role === 'inbox' && items.length > 0 && (
          <button className="btn btn-primary" onClick={() => void unpack(f.id)}>
            <Icon name="sparkle" size={16} /> Unpack {brain === 'rules' ? 'with built-in rules' : 'with Claude'}
          </button>
        )}
        {f.kind === 'mailbox' && storeKind === 'server' && (
          <button
            className="btn"
            onClick={async () => {
              const url = await dropLink();
              if (!url) return toast('Could not get a drop link.', { tone: 'warn' });
              try {
                await navigator.clipboard.writeText(url);
                toast('Drop link copied. Anyone with it can put files in your mailbox.', { tone: 'good' });
              } catch {
                toast(`Drop link: ${url}`);
              }
            }}
          >
            <Icon name="link" size={16} /> Copy my drop link
          </button>
        )}
        {f.role === 'trash' && items.length > 0 && (
          <button className="btn btn-danger" onClick={() => void deleteForever(items.map((i) => i.id))}>
            <Icon name="trash" size={16} /> Empty the bins
          </button>
        )}
        {!smart && f.role !== 'trash' && (
          <>
            <button className="btn" onClick={() => input.current?.click()}>
              <Icon name="upload" size={16} /> Add files here
            </button>
            <input
              id={`add-${f.id}`}
              ref={input}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                const list = [...(e.target.files ?? [])];
                e.target.value = '';
                void addFiles(list, { roomId, furnitureId: f.id });
              }}
            />
          </>
        )}
        <label className="sort" htmlFor={`sort-${f.id}`}>
          Sort
          <select id={`sort-${f.id}`} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="recent">Last touched</option>
            <option value="name">Name</option>
            <option value="kind">Kind</option>
          </select>
        </label>
      </div>

      {SMART_NOTE[f.role] && <p className="panel-note">{SMART_NOTE[f.role]}</p>}
      <div className="panel-body">
        {f.role === 'screen' && items.length > 0 && <Slideshow items={items} />}
        {items.length === 0 ? (
          <EmptyState f={f} />
        ) : (
          groups.map((g) => (
            <section key={g.label || 'all'} className="group">
              {g.label && <h3 className="group-label">{g.label}</h3>}
              <div className="grid">
                {g.items.map((it) => (
                  <FileTile key={it.id} file={it} highlighted={highlightId === it.id} showPlace={smart || (f.role === 'display' && it.furnitureId !== f.id)} onMenu={setMenu} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <footer className="panel-foot">
        <span>
          {items.length} {items.length === 1 ? 'thing' : 'things'}
        </span>
        <span>{prettySize(total)}</span>
        {f.role === 'trash' && <span>Collected 30 days after you throw something out</span>}
      </footer>

      {menu && <FileMenu at={menu} onClose={() => setMenu(null)} />}
    </aside>
  );
}

function EmptyState({ f }: { f: Furniture }) {
  const lines: Partial<Record<Role, string>> = {
    inbox: f.kind === 'mailbox' ? 'No mail. Files other people send you show up here.' : 'The porch is clear. Drop files anywhere on the house and they wait here to be unpacked.',
    trash: 'The bins are empty.',
    shared: 'Nothing shared yet. Open any file and choose "Share link".',
    recent: 'Nothing touched yet.',
    screen: 'No photos to play yet. Pin a photo, or add a new one.',
    display: 'Nothing pinned here yet. Pin any file in this room and it shows up here.',
  };
  return (
    <div className="empty">
      <Icon name="box" size={30} />
      <p>{lines[f.role] ?? `Nothing in the ${f.name.toLowerCase()} yet. Drop files here, or drag them over from another room.`}</p>
    </div>
  );
}

function FileTile({ file, highlighted, showPlace, onMenu }: { file: FileItem; highlighted: boolean; showPlace: boolean; onMenu: (m: MenuAt) => void }) {
  const openPreview = useApp((s) => s.openPreview);
  const house = useApp((s) => s.house);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useFileDrag(file, () => openPreview(file.id));

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className={`tile${highlighted ? ' is-found' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu({ fileId: file.id, x: e.clientX, y: e.clientY });
      }}
    >
      <button className="tile-object" {...drag} aria-label={`Open ${file.name}`}>
        <FileObject file={file} />
      </button>
      <div className="tile-meta">
        <span className="tile-name" title={file.name}>
          {file.name}
        </span>
        <button
          className="tile-more"
          aria-label={`Actions for ${file.name}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onMenu({ fileId: file.id, x: r.right, y: r.bottom });
          }}
        >
          <Icon name="more" size={16} />
        </button>
      </div>
      <div className="tile-sub">{showPlace && file.furnitureId !== BINS_ID ? placeName(house, file.furnitureId) : file.trashed ? `from ${placeName(house, file.trashed.furnitureId)}` : relative(file.touchedAt)}</div>
    </div>
  );
}

/** The TV: a big picture that advances on its own, with a filmstrip underneath. */
function Slideshow({ items }: { items: FileItem[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const current = items[i % items.length];
  const url = useFileUrl(current);

  useEffect(() => {
    if (!playing || items.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 3800);
    return () => clearInterval(t);
  }, [playing, items.length]);

  return (
    <div className="tvset">
      <div className="tvset-screen">
        <div key={current.id} className="tvset-picture" style={{ backgroundImage: `url("${url ?? current.thumb ?? current.thumbUrl ?? ''}")` }} />
        <div className="tvset-caption">
          {current.name.replace(/\.[^.]+$/, '')} <span>{current.pinned ? 'pinned' : relative(current.modifiedAt)}</span>
        </div>
      </div>
      <div className="tvset-controls">
        <button className="icon-btn" onClick={() => setI((n) => (n - 1 + items.length) % items.length)} aria-label="Previous photo">
          <Icon name="back" />
        </button>
        <button className="icon-btn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
          <Icon name={playing ? 'pause' : 'play'} />
        </button>
        <button className="icon-btn" onClick={() => setI((n) => (n + 1) % items.length)} aria-label="Next photo">
          <Icon name="forward" />
        </button>
        <span className="tvset-count">
          {(i % items.length) + 1} / {items.length}
        </span>
      </div>
    </div>
  );
}
