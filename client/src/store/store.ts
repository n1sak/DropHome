/**
 * All app state lives here (zustand). Components read slices with selectors
 * and call actions; actions update the UI first and persist through the
 * storage adapter after, so everything feels instant.
 */
import { create } from 'zustand';
import { askHouse, brainKind, sortFiles, warmUp, type BrainKind, type FindResult } from '../ai';
import { SMART_ROLES } from '../ai/rules';
import { extOf, isTextual, kindOf, mimeOf, stemOf } from '../lib/fileKinds';
import { DAY, ageInDays } from '../lib/time';
import { makeThumb, readSnippet } from '../lib/thumbs';
import { sounds } from '../lib/sound';
import { defaultHouse } from '../model/defaultHouse';
import { repaint } from '../model/restyle';
import { COL_W, GAP, freeCells } from '../model/layout';
import { SEEDS, buildSeed } from '../model/seed';
import { CATALOG, makeFurniture, makeRoom, uid } from '../model/templates';
import {
  BINS_ID, PORCH_ID, YARD_ID,
  type CustomArt, type FileItem, type Furniture, type FurnitureKind, type House, type Placement, type Room, type RoomKind, type View,
} from '../model/types';
import { connect, type Store } from '../storage';
import { MemoryStore } from '../storage/memory';

export interface Toast {
  id: number;
  text: string;
  tone?: 'info' | 'good' | 'warn';
  action?: { label: string; run: () => void };
}

export interface Flight {
  id: number;
  fileId: string;
  from: { furnitureId: string } | { rect: DOMRect };
  to: { roomId: string; furnitureId: string };
}

export type Scene = 'auto' | 'day' | 'night';
export type Dialog = null | 'clean' | 'about' | 'move';

interface Prefs {
  scene: Scene;
  sound: boolean;
  hintsSeen: boolean;
}

function loadPrefs(): Prefs {
  const base: Prefs = { scene: 'auto', sound: true, hintsSeen: false };
  try {
    return { ...base, ...(JSON.parse(localStorage.getItem('roomy.prefs') ?? '{}') as Partial<Prefs>) };
  } catch {
    return base;
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem('roomy.prefs', JSON.stringify(p));
  } catch {
    /* private mode: preferences just do not stick */
  }
}

export interface AppState {
  ready: boolean;
  booting: { step: string; done: number; total: number } | null;
  storeKind: Store['kind'];
  serverAi: boolean;
  brain: BrainKind;

  house: House;
  files: FileItem[];

  view: View;
  renovate: boolean;
  selectedFurnitureId: string | null;
  /** Renovate mode: the empty cell a new room is about to be built in. */
  buildTarget: { floor: number; col: number } | null;
  prefs: Prefs;

  previewId: string | null;
  highlightId: string | null;
  moveIds: string[] | null;
  dialog: Dialog;
  toasts: Toast[];
  flights: Flight[];
  pulses: Record<string, number>;
  uploading: number;
  unpacking: { containerId: string; total: number; done: number; brain: BrainKind } | null;
  dragging: string[] | null;

  init(): Promise<void>;
  goHome(): void;
  enterRoom(roomId: string): void;
  openFurniture(roomId: string, furnitureId: string): void;
  back(): void;
  flyToFile(id: string): void;

  addFiles(list: File[], target?: { roomId: string; furnitureId: string }): Promise<void>;
  moveFiles(ids: string[], roomId: string, furnitureId: string, opts?: { reason?: string; quiet?: boolean; fly?: boolean }): void;
  renameFile(id: string, name: string): void;
  togglePin(id: string): void;
  touch(id: string): void;
  trash(ids: string[]): void;
  restore(ids: string[]): void;
  deleteForever(ids: string[]): Promise<void>;
  share(id: string): Promise<void>;
  unshare(id: string): Promise<void>;
  unpack(containerId: string): Promise<void>;
  cancelUnpack(): void;
  applyPlacements(placements: (Placement & { pin?: boolean })[], label: string): void;
  ask(query: string): Promise<FindResult>;

  setRenovate(on: boolean): void;
  selectFurniture(id: string | null): void;
  setBuildTarget(t: { floor: number; col: number } | null): void;
  updateRoom(id: string, patch: Partial<Room>): void;
  setRoomSpan(id: string, span: number): void;
  addRoom(kind: RoomKind, floor: number, col: number): void;
  removeRoom(id: string): void;
  moveRoom(id: string, floor: number, col: number): void;
  addFloor(where: 'top' | 'bottom'): void;
  removeFloor(floor: number): void;
  addFurniture(roomId: string, kind: FurnitureKind): void;
  updateFurniture(roomId: string, furnitureId: string, patch: Partial<Furniture>): void;
  removeFurniture(roomId: string, furnitureId: string): void;
  setFurnitureArt(roomId: string, furnitureId: string, slot: 'closed' | 'open', file: File | null): Promise<void>;
  setRoomBackground(roomId: string, file: File | null): Promise<void>;
  renameHouse(name: string): void;

  setScene(scene: Scene): void;
  setSound(on: boolean): void;
  dismissHints(): void;
  openPreview(id: string | null): void;
  openMove(ids: string[] | null): void;
  setDialog(d: Dialog): void;
  setDragging(ids: string[] | null): void;
  toast(text: string, extra?: Partial<Toast>): void;
  dismissToast(id: number): void;
  endFlight(id: number): void;
  pulse(roomId: string): void;
  resetDemo(withSamples: boolean): Promise<void>;
  artUrl(ref: string): Promise<string | null>;
  fileUrl(file: FileItem): Promise<string | null>;
  fileBlob(file: FileItem): Promise<Blob | null>;
  dropLink(): Promise<string | null>;
}

let store: Store;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let toastSeq = 1;
let flightSeq = 1;
let unpackAbort: AbortController | null = null;
let initStarted = false;
let unsubscribe: (() => void) | undefined;

let savePending = false;
const persistHouse = (house: House) => {
  clearTimeout(saveTimer);
  savePending = true;
  saveTimer = setTimeout(() => {
    store
      ?.saveHouse(house)
      .catch(() => undefined)
      .finally(() => (savePending = false));
  }, 350);
};

export const findFurniture = (house: House, furnitureId: string): { room: Room | null; furniture: Furniture } | null => {
  for (const room of house.rooms) {
    const furniture = room.furniture.find((f) => f.id === furnitureId);
    if (furniture) return { room, furniture };
  }
  const yard = house.yard.find((f) => f.id === furnitureId);
  return yard ? { room: null, furniture: yard } : null;
};

export const placeName = (house: House, furnitureId: string): string => {
  const hit = findFurniture(house, furnitureId);
  if (!hit) return 'the house';
  return hit.room ? `${hit.room.name} › ${hit.furniture.name}` : hit.furniture.name;
};

const count = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export const useApp = create<AppState>((set, get) => {
  const patch = (patches: { id: string; patch: Partial<FileItem> }[]) => {
    if (!patches.length) return;
    const byId = new Map(patches.map((p) => [p.id, p.patch]));
    set((s) => ({ files: s.files.map((f) => (byId.has(f.id) ? { ...f, ...byId.get(f.id) } : f)) }));
    store.patchFiles(patches).catch(() => get().toast('Could not save that change. Check the server and try again.', { tone: 'warn' }));
  };

  const editHouse = (fn: (h: House) => House) => {
    const house = { ...fn(get().house), updatedAt: Date.now() };
    set({ house });
    persistHouse(house);
  };

  const sendToPorch = (furnitureIds: string[]) => {
    const now = Date.now();
    const moved = get().files.filter((f) => furnitureIds.includes(f.furnitureId));
    patch(moved.map((f) => ({ id: f.id, patch: { roomId: YARD_ID, furnitureId: PORCH_ID, touchedAt: now } })));
    return moved.length;
  };

  // Another window (or the mailbox drop link) changed something. Wait for a quiet moment, then take the server's word for it.
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  const reload = () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(async () => {
      if (get().unpacking || get().uploading > 0 || savePending) return reload();
      try {
        const { house, files } = await store.load();
        if (house) set({ house: repaint(house), files });
      } catch {
        /* offline for a moment: the next event will catch us up */
      }
    }, 350);
  };

  return {
    ready: false,
    booting: { step: 'Unlocking the front door', done: 0, total: 0 },
    storeKind: 'memory',
    serverAi: false,
    brain: 'rules',
    house: defaultHouse(),
    files: [],
    view: { level: 'house' },
    renovate: false,
    selectedFurnitureId: null,
    buildTarget: null,
    prefs: loadPrefs(),
    previewId: null,
    highlightId: null,
    moveIds: null,
    dialog: null,
    toasts: [],
    flights: [],
    pulses: {},
    uploading: 0,
    unpacking: null,
    dragging: null,

    async init() {
      if (initStarted) return; // React strict mode mounts twice in dev; never seed twice
      initStarted = true;
      warmUp();

      const boot = async (backend: { store: Store; serverAi: boolean }) => {
        store = backend.store;
        set({ storeKind: store.kind, serverAi: backend.serverAi });

        let { house, files } = await store.load();
        const furnish = !house || !house.seeded;
        if (!house) house = defaultHouse('My house');
        const painted = repaint(house);
        if (painted !== house) {
          house = painted;
          if (!furnish) await store.saveHouse(house).catch(() => undefined);
        }
        if (furnish) {
          // written first: if the page reloads halfway through, we get fewer samples, never doubles
          house = { ...house, seeded: true, updatedAt: Date.now() };
          await store.saveHouse(house);
        }
        set({ house, files });

        if (furnish) {
          const total = SEEDS.length;
          set({ booting: { step: 'Moving in the sample files', done: 0, total } });
          const added: FileItem[] = [];
          let done = 0;
          const queue = [...SEEDS];
          const worker = async () => {
            for (let seed = queue.shift(); seed; seed = queue.shift()) {
              try {
                const { meta, blob } = await buildSeed(seed);
                added.push(await store.addFile(meta, blob));
              } catch {
                /* one sample failing should not stop the move */
              }
              done += 1;
              set({ booting: { step: 'Moving in the sample files', done, total } });
            }
          };
          await Promise.all([worker(), worker(), worker(), worker()]);
          set({ files: [...files, ...added] });
        }
      };

      let backend = await connect();
      try {
        await boot(backend);
      } catch {
        // storage refused us (server went away, browser blocked site data): carry on in memory rather than hang on the splash
        backend = { store: new MemoryStore(), serverAi: false };
        await boot(backend);
        get().toast('Storage is not available, so this visit is kept in memory only.', { tone: 'warn' });
      }

      set({ ready: true, booting: null, brain: await brainKind(backend.serverAi) });
      // the artifact capability can resolve a moment after load
      setTimeout(async () => set({ brain: await brainKind(get().serverAi) }), 4000);
      unsubscribe?.();
      unsubscribe = store.subscribe?.(reload);
    },

    goHome() {
      if (get().view.level !== 'house') sounds.step();
      set({ view: { level: 'house' }, selectedFurnitureId: null });
    },
    enterRoom(roomId) {
      sounds.step();
      set({ view: { level: 'room', roomId }, selectedFurnitureId: null });
    },
    openFurniture(roomId, furnitureId) {
      sounds.open();
      set({ view: { level: 'container', roomId, furnitureId } });
    },
    back() {
      const v = get().view;
      if (get().previewId) return set({ previewId: null });
      if (v.level === 'container') {
        sounds.close();
        set({ view: v.roomId && v.roomId !== YARD_ID ? { level: 'room', roomId: v.roomId } : { level: 'house' } });
      } else if (v.level === 'room') get().goHome();
    },
    flyToFile(id) {
      const file = get().files.find((f) => f.id === id);
      if (!file) return;
      sounds.step();
      set({ view: { level: 'container', roomId: file.roomId, furnitureId: file.furnitureId }, highlightId: id, previewId: null, renovate: false });
      setTimeout(() => get().highlightId === id && set({ highlightId: null }), 5200);
    },

    async addFiles(list, target) {
      if (!list.length) return;
      const to = target ?? { roomId: YARD_ID, furnitureId: PORCH_ID };
      set((s) => ({ uploading: s.uploading + list.length }));
      const now = Date.now();
      const added: FileItem[] = [];
      for (const file of list) {
        try {
          const kind = kindOf(file.name, file.type);
          const ext = extOf(file.name);
          const mime = mimeOf(file.name, file.type);
          const meta: FileItem = {
            id: uid('f'),
            name: file.name,
            ext,
            mime,
            size: file.size,
            kind,
            roomId: to.roomId,
            furnitureId: to.furnitureId,
            addedAt: now,
            modifiedAt: file.lastModified || now,
            touchedAt: now,
            pinned: false,
            tags: [],
            snippet: isTextual(kind, ext, mime) && file.size < 4_000_000 ? await readSnippet(file) : undefined,
            thumb: kind === 'image' && file.size < 40_000_000 ? await makeThumb(file) : undefined,
          };
          const saved = await store.addFile(meta, file);
          added.push(saved);
          set((s) => ({ files: [...s.files, saved], uploading: Math.max(0, s.uploading - 1) }));
        } catch {
          set((s) => ({ uploading: Math.max(0, s.uploading - 1) }));
          get().toast(`Could not add "${file.name}". It may be too large for this browser's storage.`, { tone: 'warn' });
        }
      }
      if (!added.length) return;
      sounds.drop();
      if (to.furnitureId === PORCH_ID) {
        get().toast(`${count(added.length, 'box', 'boxes')} left on the porch.`, { action: { label: 'Unpack', run: () => void get().unpack(PORCH_ID) } });
      } else {
        get().pulse(to.roomId);
        get().toast(`Added ${count(added.length, 'thing')} to ${placeName(get().house, to.furnitureId)}.`, { tone: 'good' });
      }
    },

    moveFiles(ids, roomId, furnitureId, opts = {}) {
      const before = get().files.filter((f) => ids.includes(f.id) && f.furnitureId !== furnitureId);
      if (!before.length) return;
      const now = Date.now();
      if (opts.fly !== false) {
        const flights = before.slice(0, 8).map((f) => ({ id: flightSeq++, fileId: f.id, from: { furnitureId: f.furnitureId }, to: { roomId, furnitureId } }));
        set((s) => ({ flights: [...s.flights, ...flights] }));
      }
      patch(before.map((f) => ({ id: f.id, patch: { roomId, furnitureId, touchedAt: now, trashed: undefined, reason: opts.reason ?? f.reason } })));
      sounds.drop();
      get().pulse(roomId);
      if (opts.quiet) return;
      const undo = before.map((f) => ({ id: f.id, patch: { roomId: f.roomId, furnitureId: f.furnitureId, touchedAt: f.touchedAt, trashed: f.trashed, reason: f.reason } }));
      get().toast(`Moved ${before.length === 1 ? `"${before[0].name}"` : count(before.length, 'thing')} to ${placeName(get().house, furnitureId)}.`, {
        tone: 'good',
        action: { label: 'Undo', run: () => patch(undo) },
      });
    },

    renameFile(id, name) {
      const clean = name.trim();
      if (!clean) return;
      patch([{ id, patch: { name: clean, ext: extOf(clean), kind: kindOf(clean, get().files.find((f) => f.id === id)?.mime) } }]);
    },

    togglePin(id) {
      const f = get().files.find((x) => x.id === id);
      if (!f) return;
      sounds.pin();
      patch([{ id, patch: { pinned: !f.pinned, touchedAt: Date.now() } }]);
      const where = get().house.rooms.find((r) => r.id === f.roomId);
      const wall = where?.furniture.find((x) => x.role === 'display');
      if (!f.pinned) get().toast(wall ? `Pinned. It now shows on the ${wall.name.toLowerCase()} in the ${where!.name.toLowerCase()}.` : 'Pinned.', { tone: 'good' });
    },

    touch(id) {
      patch([{ id, patch: { touchedAt: Date.now() } }]);
    },

    trash(ids) {
      const now = Date.now();
      const items = get().files.filter((f) => ids.includes(f.id) && !f.trashed);
      if (!items.length) return;
      const flights = items.slice(0, 6).map((f) => ({ id: flightSeq++, fileId: f.id, from: { furnitureId: f.furnitureId }, to: { roomId: YARD_ID, furnitureId: BINS_ID } }));
      set((s) => ({ flights: [...s.flights, ...flights], previewId: null }));
      patch(items.map((f) => ({ id: f.id, patch: { trashed: { at: now, roomId: f.roomId, furnitureId: f.furnitureId, pinned: f.pinned }, roomId: YARD_ID, furnitureId: BINS_ID, pinned: false } })));
      sounds.trash();
      get().toast(`Put ${items.length === 1 ? `"${items[0].name}"` : count(items.length, 'thing')} in the bins.`, {
        action: { label: 'Undo', run: () => get().restore(items.map((f) => f.id)) },
      });
    },

    restore(ids) {
      const house = get().house;
      const items = get().files.filter((f) => ids.includes(f.id) && f.trashed);
      patch(
        items.map((f) => {
          const home = f.trashed && findFurniture(house, f.trashed.furnitureId) ? f.trashed : { roomId: YARD_ID, furnitureId: PORCH_ID };
          return { id: f.id, patch: { trashed: undefined, roomId: home.roomId, furnitureId: home.furnitureId, pinned: !!f.trashed?.pinned, touchedAt: Date.now() } };
        }),
      );
    },

    async deleteForever(ids) {
      set((s) => ({ files: s.files.filter((f) => !ids.includes(f.id)), previewId: null }));
      await Promise.all(ids.map((id) => store.removeFile(id).catch(() => undefined)));
      sounds.trash();
    },

    async share(id) {
      try {
        const { token, url } = await store.share(id);
        patch([{ id, patch: { shared: { token, at: Date.now(), url } } }]);
        get().toast(url ? 'Share link ready. It is in the guest book too.' : 'Marked as shared. Real links need the DropHome server running.', { tone: 'good' });
      } catch {
        get().toast('Could not create a share link.', { tone: 'warn' });
      }
    },

    async unshare(id) {
      await store.unshare(id).catch(() => undefined);
      patch([{ id, patch: { shared: undefined } }]);
    },

    async unpack(containerId) {
      if (get().unpacking) return;
      const waiting = get().files.filter((f) => f.furnitureId === containerId && !f.trashed);
      if (!waiting.length) return get().toast('Nothing to unpack.');
      // claimed before the first await, so a double click cannot start two runs
      set({ unpacking: { containerId, total: waiting.length, done: 0, brain: get().brain }, view: { level: 'house' }, previewId: null });
      unpackAbort = new AbortController();
      try {
        const started = Date.now();
        const result = await sortFiles(waiting, get().house, { serverAi: get().serverAi, signal: unpackAbort.signal });
        // let the camera finish pulling back before boxes start flying
        await new Promise((r) => setTimeout(r, Math.max(0, 900 - (Date.now() - started))));
        set((s) => ({ brain: result.brain === 'rules' ? s.brain : result.brain, unpacking: s.unpacking && { ...s.unpacking, brain: result.brain } }));

        const undo: { id: string; patch: Partial<FileItem> }[] = [];
        const tally = new Map<string, number>();
        for (const p of result.placements) {
          const file = get().files.find((f) => f.id === p.id);
          if (!file || !findFurniture(get().house, p.furnitureId)) continue;
          undo.push({ id: file.id, patch: { roomId: file.roomId, furnitureId: file.furnitureId, reason: file.reason, tags: file.tags, pinned: file.pinned } });
          set((s) => ({ flights: [...s.flights, { id: flightSeq++, fileId: file.id, from: { furnitureId: containerId }, to: { roomId: p.roomId, furnitureId: p.furnitureId } }] }));
          await new Promise((r) => setTimeout(r, 260));
          patch([{ id: file.id, patch: { roomId: p.roomId, furnitureId: p.furnitureId, reason: p.reason, tags: [...new Set([...file.tags, ...(p.tags ?? [])])], pinned: file.pinned || !!p.pin, touchedAt: Date.now() } }]);
          tally.set(p.roomId, (tally.get(p.roomId) ?? 0) + 1);
          set((s) => ({ unpacking: s.unpacking && { ...s.unpacking, done: s.unpacking.done + 1 } }));
        }
        await new Promise((r) => setTimeout(r, 700));

        const rooms = [...tally.entries()].map(([id, n]) => `${n} to the ${get().house.rooms.find((r) => r.id === id)?.name.toLowerCase() ?? 'house'}`);
        const by = result.brain === 'rules' ? 'the built-in rules' : 'Claude';
        if (undo.length) {
          get().toast(`Unpacked ${count(undo.length, 'box', 'boxes')} with ${by}: ${rooms.join(', ')}.`, { tone: 'good', action: { label: 'Undo', run: () => patch(undo) } });
        } else {
          get().toast('Could not find a place for those. Build a room for them in Renovate, or drag them in by hand.', { tone: 'warn' });
        }
      } finally {
        set({ unpacking: null });
        unpackAbort = null;
      }
    },

    cancelUnpack() {
      unpackAbort?.abort();
    },

    applyPlacements(placements, label) {
      const now = Date.now();
      const undo: { id: string; patch: Partial<FileItem> }[] = [];
      const patches: { id: string; patch: Partial<FileItem> }[] = [];
      const flights: Flight[] = [];
      for (const p of placements) {
        const file = get().files.find((f) => f.id === p.id);
        if (!file || file.furnitureId === p.furnitureId) continue;
        undo.push({ id: file.id, patch: { roomId: file.roomId, furnitureId: file.furnitureId, reason: file.reason, touchedAt: file.touchedAt } });
        patches.push({ id: file.id, patch: { roomId: p.roomId, furnitureId: p.furnitureId, reason: p.reason, touchedAt: now } });
        if (flights.length < 10) flights.push({ id: flightSeq++, fileId: file.id, from: { furnitureId: file.furnitureId }, to: { roomId: p.roomId, furnitureId: p.furnitureId } });
      }
      if (!patches.length) return;
      set((s) => ({ flights: [...s.flights, ...flights] }));
      patch(patches);
      sounds.drop();
      get().toast(`${label} ${count(patches.length, 'thing')}.`, { tone: 'good', action: { label: 'Undo', run: () => patch(undo) } });
    },

    ask(query) {
      return askHouse(query, get().files, get().house, { serverAi: get().serverAi });
    },

    setRenovate(on) {
      sounds.step();
      set((s) => {
        const inYard = s.view.roomId === YARD_ID;
        const view: View = on && s.view.level === 'container' ? (inYard ? { level: 'house' } : { level: 'room', roomId: s.view.roomId }) : s.view;
        return { renovate: on, selectedFurnitureId: null, buildTarget: null, previewId: null, view };
      });
    },
    selectFurniture(id) {
      set({ selectedFurnitureId: id });
    },
    setBuildTarget(buildTarget) {
      set({ buildTarget });
    },
    updateRoom(id, p) {
      editHouse((h) => ({ ...h, rooms: h.rooms.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
    },
    setRoomSpan(id, span) {
      const room = get().house.rooms.find((r) => r.id === id);
      if (!room || room.floor === 'attic' || span < 1 || span === room.span) return;
      if (span > room.span) {
        const free = freeCells(get().house, room.floor, id);
        for (let c = room.col; c < room.col + span; c++) if (!free[c]) return get().toast('There is a room in the way.', { tone: 'warn' });
      }
      // positions are percentages of the room, so rescale them or every piece would stretch with the walls
      const width = (n: number) => n * COL_W + (n - 1) * GAP;
      const k = width(room.span) / width(span);
      const furniture = room.furniture.map((f) => {
        const w = Math.min(100, Math.round(f.w * k * 2) / 2);
        const x = Math.max(0, Math.min(100 - w, Math.round(f.x * k * 2) / 2)); // narrowing: keep every piece inside the walls
        return { ...f, x, w };
      });
      editHouse((h) => ({ ...h, rooms: h.rooms.map((r) => (r.id === id ? { ...r, span, furniture } : r)) }));
      sounds.build();
    },
    addRoom(kind, floor, col) {
      const room = makeRoom(kind, floor, col);
      editHouse((h) => ({ ...h, rooms: [...h.rooms, room] }));
      set({ buildTarget: null });
      sounds.build();
      get().toast(`Built ${/^[aeiou]/i.test(room.name) ? 'an' : 'a'} ${room.name.toLowerCase()}.`, { tone: 'good' });
    },
    removeRoom(id) {
      const room = get().house.rooms.find((r) => r.id === id);
      if (!room) return;
      const moved = sendToPorch(room.furniture.map((f) => f.id));
      editHouse((h) => ({ ...h, rooms: h.rooms.filter((r) => r.id !== id) }));
      set({ view: { level: 'house' } });
      get().toast(`Knocked down the ${room.name.toLowerCase()}.${moved ? ` ${count(moved, 'thing')} moved to the porch.` : ''}`);
    },
    moveRoom(id, floor, col) {
      const h = get().house;
      const room = h.rooms.find((r) => r.id === id);
      if (!room || room.floor === 'attic') return;
      const other = h.rooms.find((r) => r.id !== id && r.floor === floor && col >= r.col && col < r.col + r.span);
      if (other) {
        if (other.span !== room.span) return get().toast('Those two rooms are different widths, so they cannot swap.', { tone: 'warn' });
        editHouse((hh) => ({
          ...hh,
          rooms: hh.rooms.map((r) => (r.id === id ? { ...r, floor: other.floor, col: other.col } : r.id === other.id ? { ...r, floor: room.floor, col: room.col } : r)),
        }));
      } else {
        const free = freeCells(h, floor, id);
        for (let c = col; c < col + room.span; c++) if (!free[c]) return get().toast('Not enough space there.', { tone: 'warn' });
        editHouse((hh) => ({ ...hh, rooms: hh.rooms.map((r) => (r.id === id ? { ...r, floor, col } : r)) }));
      }
      sounds.build();
    },
    addFloor(where) {
      editHouse((h) => ({ ...h, levels: where === 'top' ? { ...h.levels, top: Math.min(4, h.levels.top + 1) } : { ...h.levels, bottom: Math.max(-2, h.levels.bottom - 1) } }));
      sounds.build();
    },
    removeFloor(floor) {
      const h = get().house;
      if (floor === 0 || h.rooms.some((r) => r.floor === floor)) return get().toast('Only an empty top or bottom floor can be removed.', { tone: 'warn' });
      editHouse((hh) => ({ ...hh, levels: floor > 0 ? { ...hh.levels, top: floor - 1 } : { ...hh.levels, bottom: floor + 1 } }));
    },
    addFurniture(roomId, kind) {
      const span = get().house.rooms.find((r) => r.id === roomId)?.span ?? 1;
      const k = COL_W / (span * COL_W + (span - 1) * GAP); // catalog sizes are for a one-cell room
      const base = makeFurniture(kind);
      const piece = { ...base, w: Math.round(base.w * k * 2) / 2, x: Math.round((50 - (base.w * k) / 2) * 2) / 2 };
      editHouse((h) => ({ ...h, rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, furniture: [...r.furniture, piece] } : r)) }));
      set({ selectedFurnitureId: piece.id });
      sounds.build();
    },
    updateFurniture(roomId, furnitureId, p) {
      if (p.role && SMART_ROLES.includes(p.role)) {
        const moved = sendToPorch([furnitureId]);
        if (moved) get().toast(`A live view cannot hold files, so ${count(moved, 'thing')} went back to the porch.`);
      }
      editHouse((h) => ({ ...h, rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, furniture: r.furniture.map((f) => (f.id === furnitureId ? { ...f, ...p } : f)) } : r)) }));
    },
    removeFurniture(roomId, furnitureId) {
      const moved = sendToPorch([furnitureId]);
      editHouse((h) => ({ ...h, rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, furniture: r.furniture.filter((f) => f.id !== furnitureId) } : r)) }));
      set({ selectedFurnitureId: null });
      if (moved) get().toast(`${count(moved, 'thing')} moved to the porch.`);
    },
    async setFurnitureArt(roomId, furnitureId, slot, file) {
      const current = findFurniture(get().house, furnitureId)?.furniture.art ?? {};
      const art: CustomArt = { ...current };
      if (file) art[slot] = await store.putArt(file);
      else delete art[slot];
      get().updateFurniture(roomId, furnitureId, { art: art.closed || art.open || art.frames?.length ? art : undefined });
    },
    async setRoomBackground(roomId, file) {
      get().updateRoom(roomId, { background: file ? await store.putArt(file) : undefined });
    },
    renameHouse(name) {
      editHouse((h) => ({ ...h, name: name.trim() || h.name }));
    },

    setScene(scene) {
      const prefs = { ...get().prefs, scene };
      savePrefs(prefs);
      set({ prefs });
    },
    setSound(on) {
      const prefs = { ...get().prefs, sound: on };
      savePrefs(prefs);
      sounds.enabled = on;
      set({ prefs });
    },
    dismissHints() {
      const prefs = { ...get().prefs, hintsSeen: true };
      savePrefs(prefs);
      set({ prefs });
    },
    openPreview(id) {
      if (id) {
        sounds.paper();
        get().touch(id);
      }
      set({ previewId: id });
    },
    openMove(ids) {
      set({ moveIds: ids });
    },
    setDialog(dialog) {
      set({ dialog });
    },
    setDragging(ids) {
      set({ dragging: ids });
    },
    toast(text, extra = {}) {
      const id = toastSeq++;
      set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, ...extra }] }));
      setTimeout(() => get().dismissToast(id), extra.action ? 9000 : 5200);
    },
    dismissToast(id) {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },
    endFlight(id) {
      set((s) => ({ flights: s.flights.filter((f) => f.id !== id) }));
    },
    pulse(roomId) {
      set((s) => ({ pulses: { ...s.pulses, [roomId]: (s.pulses[roomId] ?? 0) + 1 } }));
    },

    async resetDemo(withSamples) {
      set({ ready: false, booting: { step: 'Clearing the house', done: 0, total: 0 }, view: { level: 'house' }, previewId: null, renovate: false, dialog: null });
      await store.reset();
      const house = { ...defaultHouse(get().house.name), seeded: !withSamples };
      await store.saveHouse(house);
      set({ house, files: [] });
      initStarted = false;
      await get().init();
    },

    artUrl: (ref) => store.artUrl(ref),
    fileUrl: (file) => store.url(file),
    fileBlob: (file) => store.blob(file),
    dropLink: async () => (store.dropLink ? store.dropLink() : null),
  };
});

/* ---------- derived data ---------- */

/** What a piece of furniture shows. Most hold their own files; a few are smart views. */
export function contentsOf(furniture: Furniture, room: Room | null, files: FileItem[], now = Date.now()): FileItem[] {
  const live = files.filter((f) => !f.trashed);
  switch (furniture.role) {
    case 'trash':
      return files.filter((f) => f.trashed).sort((a, b) => (b.trashed?.at ?? 0) - (a.trashed?.at ?? 0));
    case 'recent':
      return [...live].filter((f) => f.roomId !== YARD_ID).sort((a, b) => b.touchedAt - a.touchedAt).slice(0, 18);
    case 'shared':
      return live.filter((f) => f.shared).sort((a, b) => (b.shared?.at ?? 0) - (a.shared?.at ?? 0));
    case 'screen':
      return live
        .filter((f) => f.kind === 'image' && (room ? f.roomId === room.id : f.roomId !== YARD_ID) && (f.pinned || ageInDays(Math.max(f.touchedAt, f.modifiedAt), now) < 31))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.modifiedAt - a.modifiedAt)
        .slice(0, 40);
    case 'display': {
      const own = live.filter((f) => f.furnitureId === furniture.id);
      const pinned = room ? live.filter((f) => f.pinned && f.roomId === room.id && f.furnitureId !== furniture.id) : [];
      return [...own, ...pinned].sort((a, b) => b.touchedAt - a.touchedAt);
    }
    default:
      return live.filter((f) => f.furnitureId === furniture.id).sort((a, b) => b.touchedAt - a.touchedAt);
  }
}

export const isSmart = (f: Furniture) => SMART_ROLES.includes(f.role) && f.role !== 'inbox' && f.role !== 'trash';

/** A room's lights are on when something in it was touched in the last two weeks. */
export function isLit(room: Room, files: FileItem[], now = Date.now()): boolean {
  if (room.kind === 'hall') return true;
  return files.some((f) => f.roomId === room.id && !f.trashed && now - f.touchedAt < 14 * DAY);
}

export interface CleanupPlan {
  dusty: { file: FileItem; to: { roomId: string; furnitureId: string } | null }[];
  duplicates: { keep: FileItem; extra: FileItem }[];
  porch: FileItem[];
}

/** Spring cleaning: what is gathering dust, what is a duplicate, what never got unpacked. */
export function cleanupPlan(house: House, files: FileItem[], now = Date.now()): CleanupPlan {
  const live = files.filter((f) => !f.trashed);
  const attic = house.rooms.find((r) => r.kind === 'attic');
  const resting = new Set<string>();
  for (const room of house.rooms) for (const f of room.furniture) if (room.kind === 'attic' || room.kind === 'cellar' || ['archive', 'memories', 'backup', 'vault', 'reference'].includes(f.role)) resting.add(f.id);

  const atticSpot = (file: FileItem) => {
    if (!attic) return null;
    const usable = attic.furniture.filter((f) => !SMART_ROLES.includes(f.role));
    const pick = file.kind === 'image' ? usable.find((f) => f.role === 'memories') : /school|cpsc|math|essay|pset|lab/i.test(`${file.name} ${file.tags.join(' ')}`) ? usable.find((f) => f.kind === 'trunk') : usable.find((f) => f.kind === 'boxes');
    const f = pick ?? usable[0];
    return f ? { roomId: attic.id, furnitureId: f.id } : null;
  };

  const dusty = live
    .filter((f) => f.roomId !== YARD_ID && !f.pinned && !f.shared && !resting.has(f.furnitureId) && ageInDays(Math.max(f.touchedAt, f.modifiedAt), now) > 365)
    .map((file) => ({ file, to: atticSpot(file) }))
    .filter((d) => d.to);

  const seen = new Map<string, FileItem>();
  const duplicates: CleanupPlan['duplicates'] = [];
  for (const f of [...live].sort((a, b) => a.name.length - b.name.length)) {
    const key = `${stemOf(f.name).toLowerCase().replace(/\s*(\(\d+\)|copy|- copy)\s*$/i, '').trim()}|${f.ext}|${f.size}`;
    const first = seen.get(key);
    if (first) duplicates.push({ keep: first, extra: f });
    else seen.set(key, f);
  }

  return { dusty, duplicates, porch: live.filter((f) => f.furnitureId === PORCH_ID) };
}

export { CATALOG };
