import type { FileItem, House } from '../model/types';
import type { Store } from './types';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** Identifies this window, so it can ignore the change events its own edits cause. */
const clientId = Math.random().toString(36).slice(2, 12);
const asMe = (extra: Record<string, string> = {}) => ({ 'X-Client-Id': clientId, ...extra });
const JSON_TYPE = { 'Content-Type': 'application/json' };

/** Talks to the Express server in /server. */
export class ApiStore implements Store {
  kind = 'server' as const;

  constructor(private base = '') {}

  static async probe(base = ''): Promise<{ ok: boolean; ai: boolean } | null> {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 1500);
      const res = await fetch(`${base}/api/health`, { signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) return null;
      const body = (await res.json()) as { ok?: boolean; ai?: boolean };
      return body.ok ? { ok: true, ai: !!body.ai } : null;
    } catch {
      return null;
    }
  }

  async load() {
    return json<{ house: House | null; files: FileItem[] }>(await fetch(`${this.base}/api/state`));
  }

  async saveHouse(house: House) {
    await json(await fetch(`${this.base}/api/house`, { method: 'PUT', headers: asMe(JSON_TYPE), body: JSON.stringify(house) }));
  }

  async addFile(meta: FileItem, blob: Blob) {
    const form = new FormData();
    form.append('meta', JSON.stringify(meta));
    form.append('file', blob, meta.name);
    const { file } = await json<{ file: FileItem }>(await fetch(`${this.base}/api/files`, { method: 'POST', headers: asMe(), body: form }));
    return file;
  }

  async patchFiles(patches: { id: string; patch: Partial<FileItem> }[]) {
    if (!patches.length) return;
    // JSON drops undefined, so "clear this field" travels as null
    const body = JSON.stringify({ patches }, (_k, v) => (v === undefined ? null : v));
    await json(await fetch(`${this.base}/api/files`, { method: 'PATCH', headers: asMe(JSON_TYPE), body }));
  }

  async removeFile(id: string) {
    await json(await fetch(`${this.base}/api/files/${encodeURIComponent(id)}`, { method: 'DELETE', headers: asMe() }));
  }

  async blob(file: FileItem) {
    const res = await fetch(`${this.base}/api/files/${encodeURIComponent(file.id)}/content`);
    return res.ok ? await res.blob() : null;
  }

  async url(file: FileItem) {
    return `${this.base}/api/files/${encodeURIComponent(file.id)}/content`;
  }

  async share(id: string) {
    return json<{ token: string; url: string }>(await fetch(`${this.base}/api/files/${encodeURIComponent(id)}/share`, { method: 'POST', headers: asMe() }));
  }

  async unshare(id: string) {
    await json(await fetch(`${this.base}/api/files/${encodeURIComponent(id)}/share`, { method: 'DELETE', headers: asMe() }));
  }

  async dropLink() {
    try {
      const { url } = await json<{ url: string }>(await fetch(`${this.base}/api/drop-link`));
      return url;
    } catch {
      return null;
    }
  }

  async putArt(blob: Blob) {
    const form = new FormData();
    form.append('file', blob, 'art');
    const { ref } = await json<{ ref: string }>(await fetch(`${this.base}/api/art`, { method: 'POST', body: form }));
    return ref;
  }

  async artUrl(ref: string) {
    return ref.startsWith('art:') ? `${this.base}/api/art/${encodeURIComponent(ref.slice(4))}` : ref;
  }

  async reset() {
    await json(await fetch(`${this.base}/api/reset`, { method: 'POST', headers: asMe() }));
  }

  subscribe(onChange: () => void) {
    let source: EventSource | null = null;
    try {
      source = new EventSource(`${this.base}/api/events`);
      source.addEventListener('change', (e) => {
        try {
          if ((JSON.parse((e as MessageEvent).data) as { origin?: string }).origin === clientId) return;
        } catch {
          /* malformed event: refresh anyway */
        }
        onChange();
      });
    } catch {
      source = null;
    }
    return () => source?.close();
  }
}
