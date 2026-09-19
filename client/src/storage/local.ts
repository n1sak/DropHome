import type { FileItem, House } from '../model/types';
import { blobToDataUrl } from '../lib/thumbs';
import type { Store } from './types';

declare const __ARTIFACT__: boolean;

const DB_NAME = 'roomy';
const DB_VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      reject(e);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of ['kv', 'files', 'blobs', 'art']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('indexedDB blocked'));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function get<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function all<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

interface StoredBlob {
  buf: ArrayBuffer;
  type: string;
}

/** IndexedDB: the whole house lives in this browser. No server required. */
export class LocalStore implements Store {
  kind = 'local' as const;
  private urls = new Map<string, string>();

  private constructor(private db: IDBDatabase) {}

  static async create(): Promise<LocalStore> {
    const db = await open();
    // make sure we can actually read before committing to this adapter
    await get(db, 'kv', 'house');
    return new LocalStore(db);
  }

  async load() {
    const house = (await get<House>(this.db, 'kv', 'house')) ?? null;
    const files = await all<FileItem>(this.db, 'files');
    return { house, files };
  }

  async saveHouse(house: House) {
    const tx = this.db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(house, 'house');
    await done(tx);
  }

  async addFile(meta: FileItem, blob: Blob) {
    // ArrayBuffers survive in every browser's IndexedDB; Blobs do not in a few private modes
    const stored: StoredBlob = { buf: await blob.arrayBuffer(), type: blob.type || meta.mime };
    const tx = this.db.transaction(['files', 'blobs'], 'readwrite');
    tx.objectStore('files').put(meta, meta.id);
    tx.objectStore('blobs').put(stored, meta.id);
    await done(tx);
    return meta;
  }

  async patchFiles(patches: { id: string; patch: Partial<FileItem> }[]) {
    if (!patches.length) return;
    const tx = this.db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    for (const { id, patch } of patches) {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) store.put({ ...req.result, ...patch }, id);
      };
    }
    await done(tx);
  }

  async removeFile(id: string) {
    const tx = this.db.transaction(['files', 'blobs'], 'readwrite');
    tx.objectStore('files').delete(id);
    tx.objectStore('blobs').delete(id);
    await done(tx);
    this.urls.delete(id);
  }

  async blob(file: FileItem) {
    const stored = await get<StoredBlob>(this.db, 'blobs', file.id);
    return stored ? new Blob([stored.buf], { type: stored.type || file.mime }) : null;
  }

  async url(file: FileItem) {
    const hit = this.urls.get(file.id);
    if (hit) return hit;
    const blob = await this.blob(file);
    if (!blob) return null;
    // The published demo is sandboxed and may refuse blob: URLs, so it gets data: URLs (small files only).
    // Everywhere else an object URL is cheaper and has no size limit.
    let url: string;
    if (__ARTIFACT__) {
      if (blob.size > 48_000_000) return null;
      url = await blobToDataUrl(blob);
    } else {
      url = URL.createObjectURL(blob);
    }
    if (this.urls.size > 60) this.forgetUrls();
    this.urls.set(file.id, url);
    return url;
  }

  private forgetUrls() {
    for (const u of this.urls.values()) if (u.startsWith('blob:')) URL.revokeObjectURL(u);
    this.urls.clear();
  }

  async share(_id: string) {
    return { token: 'demo-' + Math.random().toString(36).slice(2, 10) };
  }
  async unshare(_id: string) {}

  async putArt(blob: Blob) {
    const ref = 'art:' + Math.random().toString(36).slice(2, 10);
    const stored: StoredBlob = { buf: await blob.arrayBuffer(), type: blob.type };
    const tx = this.db.transaction('art', 'readwrite');
    tx.objectStore('art').put(stored, ref);
    await done(tx);
    return ref;
  }

  async artUrl(ref: string) {
    if (!ref.startsWith('art:')) return ref;
    const hit = this.urls.get(ref);
    if (hit) return hit;
    const stored = await get<StoredBlob>(this.db, 'art', ref);
    if (!stored) return null;
    const url = await blobToDataUrl(new Blob([stored.buf], { type: stored.type }));
    this.urls.set(ref, url);
    return url;
  }

  async reset() {
    const tx = this.db.transaction(['kv', 'files', 'blobs', 'art'], 'readwrite');
    for (const name of ['kv', 'files', 'blobs', 'art']) tx.objectStore(name).clear();
    await done(tx);
    this.forgetUrls();
  }
}
