import type { FileItem, House } from '../model/types';

/**
 * Where the house and its files are kept. Two real implementations:
 *   api    -> the Express server in /server (shared across devices, share links work)
 *   local  -> IndexedDB in this browser (no server needed; this is what the published demo uses)
 * plus an in-memory fallback for browsers that block site storage.
 */
export interface Store {
  kind: 'server' | 'local' | 'memory';
  load(): Promise<{ house: House | null; files: FileItem[] }>;
  saveHouse(house: House): Promise<void>;
  addFile(meta: FileItem, blob: Blob): Promise<FileItem>;
  patchFiles(patches: { id: string; patch: Partial<FileItem> }[]): Promise<void>;
  removeFile(id: string): Promise<void>;
  blob(file: FileItem): Promise<Blob | null>;
  /** A URL an <img>, <audio>, <video> or <iframe> can use. */
  url(file: FileItem): Promise<string | null>;
  share(id: string): Promise<{ token: string; url?: string }>;
  unshare(id: string): Promise<void>;
  /** Link other people can use to drop files into the mailbox. Server only. */
  dropLink?(): Promise<string | null>;
  /** Store a piece of custom art. Returns a reference to keep in the house JSON. */
  putArt(blob: Blob): Promise<string>;
  artUrl(ref: string): Promise<string | null>;
  reset(): Promise<void>;
  /** Live updates from other windows and devices. Server only. */
  subscribe?(onChange: () => void): () => void;
}
