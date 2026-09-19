import type { FileKind } from '../model/types';

const BY_EXT: Record<string, FileKind> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', heic: 'image', heif: 'image', svg: 'image', bmp: 'image', avif: 'image', tiff: 'image',
  pdf: 'pdf',
  doc: 'doc', docx: 'doc', odt: 'doc', rtf: 'doc', pages: 'doc',
  md: 'note', txt: 'note', markdown: 'note', text: 'note',
  csv: 'sheet', tsv: 'sheet', xls: 'sheet', xlsx: 'sheet', numbers: 'sheet', ods: 'sheet',
  ppt: 'slides', pptx: 'slides', key: 'slides', odp: 'slides',
  js: 'code', jsx: 'code', ts: 'code', tsx: 'code', py: 'code', ipynb: 'code', java: 'code', c: 'code', h: 'code', cpp: 'code', hpp: 'code',
  cs: 'code', go: 'code', rs: 'code', rb: 'code', php: 'code', swift: 'code', kt: 'code', r: 'code', m: 'code', sh: 'code', sql: 'code',
  html: 'code', css: 'code', scss: 'code', json: 'code', yaml: 'code', yml: 'code', toml: 'code', xml: 'code', tex: 'code', ino: 'code',
  mp3: 'audio', wav: 'audio', m4a: 'audio', flac: 'audio', ogg: 'audio', aac: 'audio', aiff: 'audio', mid: 'audio',
  mp4: 'video', mov: 'video', webm: 'video', mkv: 'video', avi: 'video', m4v: 'video',
  zip: 'archive', tar: 'archive', gz: 'archive', tgz: 'archive', rar: 'archive', '7z': 'archive', dmg: 'archive', iso: 'archive',
};

const MIME_BY_EXT: Record<string, string> = {
  md: 'text/markdown', txt: 'text/plain', csv: 'text/csv', json: 'application/json', pdf: 'application/pdf', svg: 'image/svg+xml',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', wav: 'audio/wav', mp3: 'audio/mpeg',
  mp4: 'video/mp4', webm: 'video/webm', zip: 'application/zip', html: 'text/html', py: 'text/x-python', js: 'text/javascript', ts: 'text/typescript', tex: 'text/x-tex',
};

export function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function stemOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}

export function kindOf(name: string, mime = ''): FileKind {
  const ext = extOf(name);
  if (BY_EXT[ext]) return BY_EXT[ext];
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('text/')) return 'note';
  return 'other';
}

export function mimeOf(name: string, fallback = ''): string {
  return fallback || MIME_BY_EXT[extOf(name)] || 'application/octet-stream';
}

/** Can we read this file as text for a snippet and a preview? */
export function isTextual(kind: FileKind, ext: string, mime: string): boolean {
  if (kind === 'note' || kind === 'code') return true;
  if (kind === 'sheet') return ext === 'csv' || ext === 'tsv';
  return mime.startsWith('text/');
}

export const KIND_LABEL: Record<FileKind, string> = {
  image: 'Photo', pdf: 'PDF', doc: 'Document', note: 'Note', sheet: 'Spreadsheet', slides: 'Slides',
  code: 'Code', audio: 'Audio', video: 'Video', archive: 'Archive', other: 'File',
};

export function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[u]}`;
}
