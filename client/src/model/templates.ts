/**
 * The standard layout: room templates and the furniture catalog.
 *
 * Every room is built from the same small grammar of ROLES (see types.ts), so
 * a new room is mostly a matter of picking a wall colour and deciding which
 * surface is "current", which cupboard is "past" and which wall is "pinned".
 */
import type { Furniture, FurnitureKind, Role, Room, RoomKind } from './types';
import { BINS_ID, MAILBOX_ID, PORCH_ID } from './types';

export interface CatalogEntry {
  kind: FurnitureKind;
  label: string;
  role: Role;
  hint: string;
  /** Default size in % of a standard 16:10 room. */
  w: number;
  h: number;
  /** Hangs on the wall instead of standing on the floor. */
  wall?: boolean;
}

export const CATALOG: Record<FurnitureKind, CatalogEntry> = {
  desk: { kind: 'desk', label: 'Desk', role: 'active', hint: 'What you are working on right now', w: 44, h: 42 },
  workbench: { kind: 'workbench', label: 'Workbench', role: 'active', hint: 'Projects in progress', w: 46, h: 40 },
  coffeeTable: { kind: 'coffeeTable', label: 'Coffee table', role: 'active', hint: 'New things, not filed yet', w: 28, h: 17 },
  consoleTable: { kind: 'consoleTable', label: 'Console table', role: 'recent', hint: 'Recently touched, from every room', w: 30, h: 38 },
  vanity: { kind: 'vanity', label: 'Mirror', role: 'display', hint: 'How you present yourself', w: 26, h: 80 },
  counter: { kind: 'counter', label: 'Junk drawer', role: 'misc', hint: 'Odds and ends with no home yet', w: 44, h: 36 },
  easel: { kind: 'easel', label: 'Easel', role: 'active', hint: 'The piece you are making now', w: 22, h: 60 },
  closet: { kind: 'closet', label: 'Closet', role: 'archive', hint: 'Past work, by year', w: 22, h: 80 },
  wardrobe: { kind: 'wardrobe', label: 'Wardrobe', role: 'archive', hint: 'Personal records, by year', w: 22, h: 80 },
  pantry: { kind: 'pantry', label: 'Pantry', role: 'reference', hint: 'Manuals, warranties, household paperwork', w: 21, h: 80 },
  fridge: { kind: 'fridge', label: 'Fridge', role: 'display', hint: 'Pinned to the door', w: 20, h: 76 },
  wallCabinet: { kind: 'wallCabinet', label: 'Cabinet', role: 'archive', hint: 'Polished and finished', w: 18, h: 28, wall: true },
  safe: { kind: 'safe', label: 'Safe', role: 'vault', hint: 'IDs, lease, taxes, insurance', w: 13, h: 24 },
  nightstand: { kind: 'nightstand', label: 'Nightstand', role: 'active', hint: 'Journal, lists, personal notes', w: 13, h: 30 },
  dresser: { kind: 'dresser', label: 'Dresser', role: 'archive', hint: 'Put away, by year', w: 26, h: 40 },
  filingCabinet: { kind: 'filingCabinet', label: 'Filing cabinet', role: 'vault', hint: 'Contracts, offers, paperwork', w: 14, h: 50 },
  bookshelf: { kind: 'bookshelf', label: 'Bookshelf', role: 'reference', hint: 'Readings, textbooks, cheat sheets', w: 19, h: 74 },
  albumShelf: { kind: 'albumShelf', label: 'Album shelf', role: 'archive', hint: 'Photo albums, by year', w: 22, h: 76 },
  storageShelves: { kind: 'storageShelves', label: 'Shelves', role: 'archive', hint: 'Finished and shelved', w: 24, h: 78 },
  tapeShelf: { kind: 'tapeShelf', label: 'Tape shelf', role: 'archive', hint: 'Older videos and recordings', w: 18, h: 76 },
  trunk: { kind: 'trunk', label: 'Trunk', role: 'archive', hint: 'Old work, boxed by year', w: 22, h: 34 },
  toyChest: { kind: 'toyChest', label: 'Memory chest', role: 'memories', hint: 'Childhood and keepsakes', w: 20, h: 30 },
  boxes: { kind: 'boxes', label: 'Storage boxes', role: 'archive', hint: 'Everything else, by year', w: 30, h: 42 },
  hamper: { kind: 'hamper', label: 'Hamper', role: 'cleanup', hint: 'Needs a clean-up: screenshots, untitled, duplicates', w: 14, h: 34 },
  recipeBox: { kind: 'recipeBox', label: 'Recipe box', role: 'active', hint: 'Recipes you cook from', w: 13, h: 15 },
  recordCrate: { kind: 'recordCrate', label: 'Record crate', role: 'media', hint: 'Music, voice memos, audio', w: 22, h: 34 },
  toolbox: { kind: 'toolbox', label: 'Toolbox', role: 'reference', hint: 'Snippets and configs you reuse', w: 14, h: 30 },
  corkboard: { kind: 'corkboard', label: 'Corkboard', role: 'display', hint: 'Pinned: deadlines and must-sees', w: 24, h: 30, wall: true },
  pegboard: { kind: 'pegboard', label: 'Pegboard', role: 'display', hint: 'Pinned: templates and tools', w: 40, h: 36, wall: true },
  photoWall: { kind: 'photoWall', label: 'Photo wall', role: 'display', hint: 'Pinned photos', w: 28, h: 30, wall: true },
  tv: { kind: 'tv', label: 'TV', role: 'screen', hint: "Plays this month's photos and your pinned ones", w: 36, h: 46 },
  projector: { kind: 'projector', label: 'Projector screen', role: 'media', hint: 'Videos and recordings', w: 50, h: 50, wall: true },
  guestBook: { kind: 'guestBook', label: 'Guest book', role: 'shared', hint: 'Everything you have shared with a link', w: 14, h: 40 },
  bathtub: { kind: 'bathtub', label: 'Bathtub', role: 'drafts', hint: 'Ideas left to soak: drafts, moodboards', w: 42, h: 34 },
  backupRack: { kind: 'backupRack', label: 'Backup rack', role: 'backup', hint: 'Device backups and exports', w: 20, h: 74 },
  planter: { kind: 'planter', label: 'Planter', role: 'drafts', hint: 'Seeds: goals and ideas still growing', w: 30, h: 36 },
  porch: { kind: 'porch', label: 'Porch', role: 'inbox', hint: 'Delivered, not unpacked yet', w: 170, h: 150 },
  mailbox: { kind: 'mailbox', label: 'Mailbox', role: 'inbox', hint: 'Sent to you by other people', w: 64, h: 104 },
  bins: { kind: 'bins', label: 'Bins', role: 'trash', hint: 'Thrown out. Collected after 30 days', w: 120, h: 92 },
};

/** Pieces a person can add in Renovate mode, in catalog order. */
export const ADDABLE: FurnitureKind[] = [
  'desk', 'workbench', 'coffeeTable', 'easel',
  'closet', 'wardrobe', 'pantry', 'dresser', 'storageShelves', 'bookshelf', 'albumShelf', 'tapeShelf',
  'trunk', 'boxes', 'toyChest', 'recordCrate', 'toolbox', 'recipeBox',
  'corkboard', 'pegboard', 'photoWall', 'fridge', 'tv', 'projector',
  'bathtub', 'planter', 'hamper', 'counter', 'safe', 'filingCabinet', 'nightstand', 'wallCabinet', 'backupRack',
  'consoleTable', 'guestBook', 'vanity',
];

type Piece = Partial<Furniture> & { kind: FurnitureKind; x: number; y: number };

export interface RoomTemplate {
  kind: RoomKind;
  name: string;
  purpose: string;
  wall: string;
  /** Short pitch shown in the Renovate catalog. */
  blurb: string;
  pieces: Piece[];
}

export const ROOM_TEMPLATES: Record<RoomKind, RoomTemplate> = {
  attic: {
    kind: 'attic',
    name: 'Attic',
    purpose: 'Cold storage. Old work and old photos that are not relevant any more but worth keeping.',
    wall: '#DDC7A4',
    blurb: 'Cold storage for anything older than a year.',
    pieces: [
      { kind: 'trunk', x: 29, y: 45, w: 14, h: 50, name: 'School trunk', hint: 'Old coursework, by year' },
      { kind: 'toyChest', x: 45.5, y: 55, w: 11, h: 40, name: 'Keepsake chest', hint: 'Old photos and keepsakes' },
      { kind: 'boxes', x: 59, y: 40, w: 14, h: 55, name: 'Moving boxes', hint: 'Everything else, boxed by year' },
    ],
  },
  study: {
    kind: 'study',
    name: 'Study',
    purpose: 'School work: problem sets, lecture notes, essays, lab reports, syllabi, readings.',
    wall: '#D9DEF7',
    blurb: 'Coursework. Desk for this term, closet for the last.',
    pieces: [
      { kind: 'corkboard', x: 5, y: 9, w: 24, h: 31, hint: 'Pinned: deadlines, syllabi, schedules' },
      { kind: 'desk', x: 4, y: 50, w: 44, h: 42, hint: "This semester's work" },
      { kind: 'bookshelf', x: 52, y: 18, w: 19, h: 74 },
      { kind: 'closet', x: 74, y: 12, w: 22, h: 80, hint: 'Past work from this year' },
    ],
  },
  bedroom: {
    kind: 'bedroom',
    name: 'Bedroom',
    purpose: 'Personal and private: journals, lists, personal records, and important documents in the safe.',
    wall: '#F4DDD8',
    blurb: 'Private things. Nightstand, wardrobe and a safe.',
    pieces: [
      { kind: 'nightstand', x: 42, y: 62, w: 13, h: 30 },
      { kind: 'safe', x: 58, y: 68, w: 13, h: 24 },
      { kind: 'wardrobe', x: 74, y: 12, w: 22, h: 80 },
    ],
  },
  bathroom: {
    kind: 'bathroom',
    name: 'Bathroom',
    purpose: 'Works in progress: rough drafts, ideas, moodboards and decor inspiration, plus things that need cleaning up.',
    wall: '#CFE8EA',
    blurb: 'Where things get polished. Drafts soak in the tub.',
    pieces: [
      { kind: 'vanity', x: 5, y: 12, w: 26, h: 80, hint: 'How you present yourself: résumé, headshot, bio' },
      { kind: 'wallCabinet', x: 37, y: 12, w: 18, h: 28 },
      { kind: 'bathtub', x: 36, y: 58, w: 42, h: 34 },
      { kind: 'hamper', x: 82, y: 58, w: 14, h: 34 },
    ],
  },
  kitchen: {
    kind: 'kitchen',
    name: 'Kitchen',
    purpose: 'Food and household: recipes, grocery lists, meal plans, appliance manuals, warranties.',
    wall: '#F7E9BB',
    blurb: 'Recipes in the box, lists on the fridge.',
    pieces: [
      { kind: 'fridge', x: 4, y: 16, w: 20, h: 76, hint: 'Pinned: grocery list, meal plan' },
      { kind: 'counter', x: 27, y: 56, w: 44, h: 36 },
      { kind: 'recipeBox', x: 51, y: 41.5, w: 13, h: 15 },
      { kind: 'pantry', x: 75, y: 12, w: 21, h: 80 },
    ],
  },
  hall: {
    kind: 'hall',
    name: 'Hall',
    purpose: 'The hub of the house. Nothing is stored here: it shows recent files and everything you have shared.',
    wall: '#D5E3D3',
    blurb: 'The hub: recents and everything you have shared.',
    pieces: [
      { kind: 'consoleTable', x: 5, y: 54, w: 30, h: 38 },
      { kind: 'guestBook', x: 40, y: 52, w: 14, h: 40 },
    ],
  },
  living: {
    kind: 'living',
    name: 'Living room',
    purpose: 'Photos and memories: family photos, trips, events, childhood pictures.',
    wall: '#F6E3D0',
    blurb: 'Photos and memories, with a TV that plays them.',
    pieces: [
      { kind: 'photoWall', x: 4, y: 8, w: 28, h: 30 },
      { kind: 'toyChest', x: 4, y: 62, w: 20, h: 30 },
      { kind: 'tv', x: 33, y: 28, w: 36, h: 48 },
      { kind: 'coffeeTable', x: 37, y: 80, w: 28, h: 17, hint: 'New photos, not in an album yet' },
      { kind: 'albumShelf', x: 74, y: 16, w: 22, h: 76 },
    ],
  },
  workshop: {
    kind: 'workshop',
    name: 'Workshop',
    purpose: 'Side projects and code: source files, notebooks, project archives, templates, configs.',
    wall: '#DCDFE4',
    blurb: 'Code and side projects. Bench, pegboard, shelves.',
    pieces: [
      { kind: 'pegboard', x: 5, y: 8, w: 40, h: 36 },
      { kind: 'workbench', x: 4, y: 52, w: 46, h: 40 },
      { kind: 'storageShelves', x: 54, y: 14, w: 24, h: 78, hint: 'Finished and shelved projects' },
      { kind: 'toolbox', x: 82, y: 62, w: 14, h: 30 },
    ],
  },
  den: {
    kind: 'den',
    name: 'Den',
    purpose: 'Music and video: songs, voice memos, recordings, clips, films.',
    wall: '#D3C9E6',
    blurb: 'Music and video. A crate of records and a big screen.',
    pieces: [
      { kind: 'projector', x: 25, y: 7, w: 48, h: 50 },
      { kind: 'recordCrate', x: 4, y: 58, w: 22, h: 34 },
      { kind: 'tapeShelf', x: 78, y: 16, w: 18, h: 76 },
    ],
  },
  cellar: {
    kind: 'cellar',
    name: 'Cellar',
    purpose: 'Backups and bulk: device backups, exports, zip archives, anything big that just needs to be kept safe.',
    wall: '#CDB9AB',
    blurb: 'Backups and big archives, safe underground.',
    pieces: [
      { kind: 'backupRack', x: 6, y: 18, w: 20, h: 74 },
      { kind: 'boxes', x: 33, y: 50, w: 30, h: 42, name: 'Storage boxes', hint: 'Big archives and everything else' },
    ],
  },
  office: {
    kind: 'office',
    name: 'Office',
    purpose: 'Career and work: résumés, cover letters, offers, internship paperwork, work projects.',
    wall: '#D6E0EA',
    blurb: 'Career and work. Desk, filing cabinet, board.',
    pieces: [
      { kind: 'corkboard', x: 6, y: 9, w: 26, h: 31, hint: 'Pinned: applications and deadlines' },
      { kind: 'desk', x: 4, y: 50, w: 44, h: 42, hint: 'Applications and work in progress' },
      { kind: 'filingCabinet', x: 54, y: 42, w: 14, h: 50 },
      { kind: 'bookshelf', x: 74, y: 18, w: 20, h: 74, hint: 'Reference and past work' },
    ],
  },
  studio: {
    kind: 'studio',
    name: 'Studio',
    purpose: 'Creative work: drawings, designs, illustrations, sketches, art references.',
    wall: '#F3E6EE',
    blurb: 'Art and design. Easel, flat files, references.',
    pieces: [
      { kind: 'pegboard', x: 34, y: 8, w: 36, h: 34, hint: 'Pinned: references and palettes' },
      { kind: 'easel', x: 6, y: 30, w: 22, h: 62 },
      { kind: 'dresser', x: 36, y: 52, w: 30, h: 40, name: 'Flat files', hint: 'Finished pieces, by year' },
      { kind: 'storageShelves', x: 74, y: 14, w: 22, h: 78, hint: 'Supplies and source material' },
    ],
  },
  library: {
    kind: 'library',
    name: 'Library',
    purpose: 'Reading: books, papers, articles, long PDFs, reading lists.',
    wall: '#D9CDB8',
    blurb: 'Books, papers and long reads.',
    pieces: [
      { kind: 'bookshelf', x: 5, y: 12, w: 24, h: 80, hint: 'Books and papers' },
      { kind: 'coffeeTable', x: 36, y: 76, w: 28, h: 18, name: 'Reading table', hint: 'Reading now' },
      { kind: 'bookshelf', x: 72, y: 12, w: 24, h: 80, name: 'Back shelves', role: 'archive', hint: 'Finished reading' },
    ],
  },
  greenhouse: {
    kind: 'greenhouse',
    name: 'Greenhouse',
    purpose: 'Things that are still growing: goals, plans, long-term ideas, journals about the future.',
    wall: '#DDEBD2',
    blurb: 'Goals and ideas that are still growing.',
    pieces: [
      { kind: 'planter', x: 6, y: 56, w: 34, h: 36 },
      { kind: 'workbench', x: 44, y: 54, w: 32, h: 38, name: 'Potting bench', hint: 'Plans you are actively working on' },
      { kind: 'storageShelves', x: 80, y: 16, w: 16, h: 76, hint: 'Harvested: goals you finished' },
    ],
  },
};

/** Rooms offered in Renovate mode. */
export const ADDABLE_ROOMS: RoomKind[] = [
  'study', 'office', 'studio', 'library', 'living', 'kitchen', 'bedroom', 'bathroom', 'workshop', 'den', 'greenhouse', 'cellar', 'hall',
];

export const WALL_SWATCHES = [
  '#D9DEF7', '#F4DDD8', '#CFE8EA', '#F7E9BB', '#D5E3D3', '#F6E3D0', '#DCDFE4', '#D3C9E6', '#CDB9AB', '#D6E0EA', '#F3E6EE', '#DDEBD2', '#DDC7A4', '#F2F0EA',
];

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now().toString(36).slice(-4)}${rand}${counter.toString(36)}`;
}

export function makeFurniture(kind: FurnitureKind, at: Partial<Furniture> = {}, id?: string): Furniture {
  const c = CATALOG[kind];
  return {
    id: id ?? uid(kind),
    kind,
    name: at.name ?? c.label,
    hint: at.hint ?? c.hint,
    role: at.role ?? c.role,
    x: at.x ?? Math.round(50 - c.w / 2),
    y: at.y ?? (c.wall ? 10 : Math.round(92 - c.h)),
    w: at.w ?? c.w,
    h: at.h ?? c.h,
    art: at.art,
  };
}

export function makeRoom(kind: RoomKind, floor: Room['floor'], col: number, id?: string): Room {
  const t = ROOM_TEMPLATES[kind];
  const roomId = id ?? uid(kind);
  return {
    id: roomId,
    kind,
    name: t.name,
    purpose: t.purpose,
    floor,
    col,
    span: 1,
    wall: t.wall,
    furniture: t.pieces.map((p, i) => makeFurniture(p.kind, p, id ? `${roomId}-${p.kind}${dupIndex(t.pieces, i)}` : undefined)),
  };
}

function dupIndex(pieces: Piece[], i: number): string {
  const same = pieces.slice(0, i).filter((p) => p.kind === pieces[i].kind).length;
  return same ? String(same + 1) : '';
}

export function makeYard(): Furniture[] {
  return [
    { ...makeFurniture('porch', { x: -178, y: -150, w: 170, h: 150 }, PORCH_ID) },
    { ...makeFurniture('mailbox', { x: -262, y: -104, w: 64, h: 104 }, MAILBOX_ID) },
    { ...makeFurniture('bins', { x: 34, y: -92, w: 120, h: 92 }, BINS_ID) },
  ];
}
