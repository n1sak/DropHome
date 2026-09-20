/**
 * DropHome data model.
 *
 * A HOUSE is a grid of ROOMS. Each room holds FURNITURE. Furniture is where
 * FILES live. Nothing in here knows how anything is drawn: art is looked up
 * separately by `kind`, which is what lets your own drawings replace the
 * built-in ones without touching this file.
 *
 * See docs/LAYOUT_FORMAT.md for the prose version of this spec.
 */

export const HOUSE_FORMAT = 'roomy.house/1';

/** What a piece of furniture MEANS. The same grammar repeats in every room,
 *  so once you learn "surface = current, closet = past, wall = pinned" in the
 *  study, you already know how the kitchen works. */
export type Role =
  | 'active' // surfaces: what you're working on right now
  | 'archive' // closets, shelves: finished things, grouped by year
  | 'display' // walls, screens, fridge doors: pinned + highlights
  | 'drafts' // things that still need polish
  | 'reference' // keep-handy material: textbooks, manuals, cheat sheets
  | 'memories' // keepsakes
  | 'media' // music and video
  | 'vault' // important documents
  | 'backup' // device backups and exports
  | 'cleanup' // the hamper: messy names, screenshots, duplicates
  | 'misc' // the junk drawer
  | 'inbox' // the porch: delivered, not unpacked yet
  | 'trash' // bins at the curb
  | 'recent' // smart: recently touched, from anywhere in the house
  | 'shared' // smart: everything with a share link
  | 'screen'; // smart: a slideshow of pinned + recent photos

export type RoomKind =
  | 'attic'
  | 'study'
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'hall'
  | 'living'
  | 'workshop'
  | 'den'
  | 'cellar'
  | 'office'
  | 'studio'
  | 'library'
  | 'greenhouse';

export type FurnitureKind =
  // surfaces
  | 'desk'
  | 'workbench'
  | 'coffeeTable'
  | 'consoleTable'
  | 'vanity'
  | 'counter'
  | 'easel'
  // doors
  | 'closet'
  | 'wardrobe'
  | 'pantry'
  | 'fridge'
  | 'wallCabinet'
  | 'safe'
  // drawers
  | 'nightstand'
  | 'dresser'
  | 'filingCabinet'
  // shelves
  | 'bookshelf'
  | 'albumShelf'
  | 'storageShelves'
  | 'tapeShelf'
  // chests
  | 'trunk'
  | 'toyChest'
  | 'boxes'
  | 'hamper'
  | 'recipeBox'
  | 'recordCrate'
  | 'toolbox'
  // boards and screens
  | 'corkboard'
  | 'pegboard'
  | 'photoWall'
  | 'tv'
  | 'projector'
  | 'guestBook'
  // specials
  | 'bathtub'
  | 'backupRack'
  | 'planter'
  // yard
  | 'porch'
  | 'mailbox'
  | 'bins';

/** One separately drawn layer of a piece that moves when it opens: a door, a drawer front, a lid. */
export interface ArtPart {
  src: string;
  /** Where the layer sits, in % of the piece's canvas. Leave out for a layer exported at the full canvas size. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /** A ready-made movement. The hinge or edge is found from the drawing's own outline. */
  motion?: 'swing-left' | 'swing-right' | 'slide-down' | 'slide-up' | 'lift' | 'pop' | 'rise' | 'fade-in' | 'fade-out';
  /** Or write the CSS transforms yourself. These win over `motion`. */
  open?: string;
  closed?: string;
  origin?: string;
  /** Milliseconds to wait before this layer starts moving. */
  delay?: number;
  /** Draw under the base drawing: for things that peek out from behind it. */
  behind?: boolean;
}

export interface CustomArt {
  /** Asset id (stored through the storage adapter) or URL, drawn when closed. */
  closed?: string;
  /** Drawn when open. Falls back to `closed`. */
  open?: string;
  /** Optional flipbook, closed -> open. Played forwards on open, backwards on close. */
  frames?: string[];
  fps?: number;
  /** Optional moving layers, drawn over (or behind) the base drawing. */
  parts?: ArtPart[];
  /** The room background already contains this piece; keep the hotspot, draw nothing. */
  baked?: boolean;
  /** Where live content sits on the art (TV picture, framed photos, fridge notes), in % of the piece. */
  slots?: { x: number; y: number; w: number; h: number; rot?: number; shape?: 'rect' | 'oval' | 'screen' }[];
}

export interface Furniture {
  id: string;
  kind: FurnitureKind;
  name: string;
  /** One line shown under the name: what belongs here. */
  hint: string;
  role: Role;
  /** Position and size in PERCENT of the room canvas (0-100). */
  x: number;
  y: number;
  w: number;
  h: number;
  art?: CustomArt;
}

export interface Room {
  id: string;
  kind: RoomKind;
  name: string;
  /** One line: what this room is for. Also given to the AI sorter. */
  purpose: string;
  /** 0 = ground floor, 1 = one up, -1 = below ground. The attic is `floor: 'attic'`. */
  floor: number | 'attic';
  /** Left-to-right cell index, 0-based. Ignored for the attic. */
  col: number;
  /** How many cells wide. */
  span: number;
  /** Wall colour. */
  wall: string;
  furniture: Furniture[];
  /** Custom background art for the whole room (asset id or URL). */
  background?: string;
}

export interface House {
  format: typeof HOUSE_FORMAT;
  name: string;
  columns: number;
  /** Highest and lowest floor that exist, even if empty. Ground is 0. */
  levels: { top: number; bottom: number };
  rooms: Room[];
  /** Porch, mailbox and bins. Same shape as room furniture, but x/y/w/h are
   *  in LOT pixels because they stand outside the grid. */
  yard: Furniture[];
  /** Set once the sample files have been moved in, so we never reseed over real data. */
  seeded: boolean;
  updatedAt: number;
}

export type FileKind =
  | 'image'
  | 'pdf'
  | 'doc'
  | 'note'
  | 'sheet'
  | 'slides'
  | 'code'
  | 'audio'
  | 'video'
  | 'archive'
  | 'other';

export interface FileItem {
  id: string;
  name: string;
  ext: string;
  mime: string;
  size: number;
  kind: FileKind;

  /** Where it lives. `roomId: 'yard'` + the porch id means "delivered, not unpacked". */
  roomId: string;
  furnitureId: string;

  /** When it entered the house. */
  addedAt: number;
  /** The file's own last-modified date. Used to decide what is "old work". */
  modifiedAt: number;
  /** Last time it was opened or moved here. Drives dust and room lights. */
  touchedAt: number;

  pinned: boolean;
  /** Set when it is in the bins. Holds where it came from so it can be put back. */
  trashed?: { at: number; roomId: string; furnitureId: string; pinned?: boolean };
  shared?: { token: string; at: number; url?: string };

  tags: string[];
  /** First few hundred characters of text files: shown on the paper, used by search and the sorter. */
  snippet?: string;
  /** Small JPEG data URL for photos. */
  thumb?: string;
  /** Server mode: URL of the thumbnail instead of an inline one. */
  thumbUrl?: string;
  /** Why the sorter put it here. */
  reason?: string;
  /** True for the sample files that ship with a fresh house. */
  sample?: boolean;
}

export interface Placement {
  id: string;
  roomId: string;
  furnitureId: string;
  reason: string;
  tags?: string[];
}

export type ViewLevel = 'house' | 'room' | 'container';

export interface View {
  level: ViewLevel;
  roomId?: string;
  furnitureId?: string;
}

export const YARD_ID = 'yard';
export const PORCH_ID = 'yard-porch';
export const MAILBOX_ID = 'yard-mailbox';
export const BINS_ID = 'yard-bins';
