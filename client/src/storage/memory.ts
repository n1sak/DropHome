import type { FileItem, House } from '../model/types';
import { blobToDataUrl } from '../lib/thumbs';
import type { Store } from './types';

/** Keeps everything in memory. Used when the browser refuses site storage. */
export class MemoryStore implements Store {
  kind = 'memory' as const;
  protected house: House | null = null;
  protected files = new Map<string, FileItem>();
  protected blobs = new Map<string, Blob>();
  protected art = new Map<string, Blob>();
  protected urls = new Map<string, string>();

  async load() {
    return { house: this.house, files: [...this.files.values()] };
  }
  async saveHouse(house: House) {
    this.house = house;
  }
  async addFile(meta: FileItem, blob: Blob) {
    this.files.set(meta.id, meta);
    this.blobs.set(meta.id, blob);
    return meta;
  }
  async patchFiles(patches: { id: string; patch: Partial<FileItem> }[]) {
    for (const { id, patch } of patches) {
      const f = this.files.get(id);
      if (f) this.files.set(id, { ...f, ...patch });
    }
  }
  async removeFile(id: string) {
    this.files.delete(id);
    this.blobs.delete(id);
    this.urls.delete(id);
  }
  async blob(file: FileItem) {
    return this.blobs.get(file.id) ?? null;
  }
  async url(file: FileItem) {
    const hit = this.urls.get(file.id);
    if (hit) return hit;
    const blob = await this.blob(file);
    if (!blob) return null;
    const typed = blob.type ? blob : new Blob([blob], { type: file.mime });
    const url = await blobToDataUrl(typed);
    this.urls.set(file.id, url);
    return url;
  }
  async share(_id: string) {
    return { token: 'demo-' + Math.random().toString(36).slice(2, 10) };
  }
  async unshare(_id: string) {}
  async putArt(blob: Blob) {
    const ref = 'art:' + Math.random().toString(36).slice(2, 10);
    this.art.set(ref, blob);
    return ref;
  }
  async artUrl(ref: string) {
    if (!ref.startsWith('art:')) return ref;
    const hit = this.urls.get(ref);
    if (hit) return hit;
    const blob = this.art.get(ref);
    if (!blob) return null;
    const url = await blobToDataUrl(blob);
    this.urls.set(ref, url);
    return url;
  }
  async reset() {
    this.house = null;
    this.files.clear();
    this.blobs.clear();
    this.art.clear();
    this.urls.clear();
  }
}
