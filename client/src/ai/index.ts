/**
 * The sorter's brain. Three options, tried in this order:
 *
 *   1. claude  - the published artifact asks Claude directly (window.claude "sample" capability)
 *   2. server  - the Express server relays to the Anthropic API when ANTHROPIC_API_KEY is set
 *   3. rules   - the built-in classifier in rules.ts. Always available, never fails.
 *
 * Whatever the model answers is validated against the real house, and any file
 * it skipped or misplaced falls back to the rules. The demo can not break here.
 */
import type { FileItem, House, Placement } from '../model/types';
import { shortDate } from '../lib/time';
import { SMART_ROLES, searchFiles, sortWithRules } from './rules';

export type BrainKind = 'claude' | 'server' | 'rules';

type SampleFn = {
  (input: string, options?: Record<string, unknown>): Promise<{ text: string }>;
  json<T = unknown>(input: string, options?: Record<string, unknown>): Promise<T>;
};

declare global {
  interface Window {
    claude?: { use?: (name: string) => Promise<unknown> };
  }
}

let samplePromise: Promise<SampleFn | null> | null = null;

/** Start resolving the artifact capability early; it answers a moment after load. */
export function warmUp(): void {
  if (samplePromise) return;
  const use = typeof window !== 'undefined' ? window.claude?.use : undefined;
  samplePromise = use
    ? Promise.resolve()
        .then(() => use.call(window.claude, 'sample'))
        .then((s) => (typeof s === 'function' ? (s as SampleFn) : null))
        .catch(() => null)
    : Promise.resolve(null);
}

async function getSample(waitMs = 1200): Promise<SampleFn | null> {
  warmUp();
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), waitMs));
  return Promise.race([samplePromise!, timeout]);
}

export async function brainKind(serverAi: boolean): Promise<BrainKind> {
  if (await getSample(300)) return 'claude';
  return serverAi ? 'server' : 'rules';
}

const ROLE_GUIDE = `ROLES (every room uses the same grammar):
active = what is being worked on now | archive = finished, kept, grouped by year | display = pinned where you can see it
drafts = rough ideas still soaking | reference = kept handy to look things up | memories = keepsakes | media = music and video
vault = important documents | backup = device backups and exports | cleanup = messy files to tidy later | misc = junk drawer, last resort`;

function outline(house: House): string {
  const lines: string[] = [];
  for (const room of house.rooms) {
    const pieces = room.furniture.filter((f) => !SMART_ROLES.includes(f.role));
    if (!pieces.length) continue;
    lines.push(`ROOM ${room.id} | ${room.name} | ${room.purpose}`);
    for (const f of pieces) lines.push(`  - ${f.id} | ${f.name} | ${f.role} | ${f.hint}`);
  }
  return lines.join('\n');
}

function clean(text: string | undefined, max: number): string {
  return (text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function sortPrompt(files: FileItem[], house: House): string {
  const rows = files.map((f) => `${f.id} | ${f.name} | ${f.kind} | modified ${shortDate(f.modifiedAt)} | ${clean(f.snippet, 220) || '(no text)'}`);
  return `You are the sorter for Roomy, an app that keeps files in a house instead of folders. New files were left on the porch. Decide where each one belongs.

THE HOUSE. Rooms, then the furniture inside each (id | name | role | what goes there):
${outline(house)}

${ROLE_GUIDE}

RULES
- Choose exactly one roomId and one furnitureId for every file, using only ids listed above, and the furniture must be inside that room.
- Recent work goes on "active" furniture. Finished work older than about six months goes to "archive". Anything older than about two years goes to the attic if the house has one.
- Use "misc" only when nothing else fits.
- Today is ${shortDate(Date.now())}.
- reason: at most 10 plain words, written to the owner. tags: 1 to 3 short lowercase tags.

FILES (id | name | kind | last modified | first lines):
${rows.join('\n')}

Reply with only a JSON array, one object per file, no other text:
[{"id":"...","roomId":"...","furnitureId":"...","reason":"...","tags":["..."]}]`;
}

function validate(raw: unknown, files: FileItem[], house: House): Map<string, Placement> {
  const ok = new Map<string, Placement>();
  if (!Array.isArray(raw)) return ok;
  const ids = new Set(files.map((f) => f.id));
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const id = String(r.id ?? '');
    const room = house.rooms.find((x) => x.id === String(r.roomId ?? ''));
    const piece = room?.furniture.find((x) => x.id === String(r.furnitureId ?? ''));
    if (!ids.has(id) || !room || !piece || SMART_ROLES.includes(piece.role)) continue;
    const tags = Array.isArray(r.tags) ? r.tags.map((t) => String(t).toLowerCase().slice(0, 24)).slice(0, 3) : [];
    ok.set(id, { id, roomId: room.id, furnitureId: piece.id, reason: clean(String(r.reason ?? ''), 90) || 'Sorted by Claude', tags });
  }
  return ok;
}

function parseLoose(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const from = text.search(/[[{]/);
    const to = Math.max(text.lastIndexOf(']'), text.lastIndexOf('}'));
    if (from >= 0 && to > from) {
      try {
        return JSON.parse(text.slice(from, to + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function askServer(prompt: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch('/api/ai/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal });
  if (!res.ok) throw new Error(`server ai ${res.status}`);
  return ((await res.json()) as { text: string }).text;
}

export interface SortResult {
  placements: (Placement & { pin?: boolean })[];
  brain: BrainKind;
  /** How many placements came from the model (the rest were repaired by the rules). */
  byModel: number;
}

export async function sortFiles(files: FileItem[], house: House, opts: { serverAi: boolean; signal?: AbortSignal }): Promise<SortResult> {
  const fallback = sortWithRules(files, house);
  if (!files.length) return { placements: [], brain: 'rules', byModel: 0 };
  const batch = files.slice(0, 60);
  const prompt = sortPrompt(batch, house);

  let raw: unknown = null;
  let brain: BrainKind = 'rules';
  try {
    const sample = await getSample();
    if (sample) {
      raw = await sample.json(prompt, { modelTier: 'quick', cache: false, signal: opts.signal });
      brain = 'claude';
    } else if (opts.serverAi) {
      raw = parseLoose(await askServer(prompt, opts.signal));
      brain = 'server';
    }
  } catch {
    raw = null; // declined, rate limited, offline, cancelled: the rules take over
  }

  const good = raw ? validate(raw, batch, house) : new Map<string, Placement>();
  if (!good.size) return { placements: fallback, brain: 'rules', byModel: 0 };
  const placements = fallback.map((f) => good.get(f.id) ?? f);
  for (const [id, p] of good) if (!placements.some((x) => x.id === id)) placements.push(p);
  return { placements, brain, byModel: good.size };
}

export interface FindResult {
  answer: string;
  ids: string[];
  brain: BrainKind;
}

/** "Where did I put the lease?" Natural-language lookup across the whole house. */
export async function askHouse(query: string, files: FileItem[], house: House, opts: { serverAi: boolean; signal?: AbortSignal }): Promise<FindResult> {
  const live = files.filter((f) => !f.trashed);
  const where = new Map<string, string>();
  for (const room of house.rooms) for (const f of room.furniture) where.set(f.id, `${room.name} > ${f.name}`);
  for (const f of house.yard) where.set(f.id, f.name);

  const viaRules = (): FindResult => {
    const hits = searchFiles(query, live, house).slice(0, 5);
    return {
      answer: hits.length ? `Closest matches by name and contents.` : `Nothing in the house matches that.`,
      ids: hits.map((h) => h.id),
      brain: 'rules',
    };
  };

  const rows = live.slice(0, 250).map((f) => `${f.id} | ${f.name} | ${where.get(f.furnitureId) ?? '?'} | ${shortDate(f.modifiedAt)} | ${f.tags.join(',')} | ${clean(f.snippet, 110)}`);
  const prompt = `You help someone find things in Roomy, an app that keeps their files in a house. Answer their question using only the file list.

QUESTION: ${query}

FILES (id | name | where it is | last modified | tags | first lines):
${rows.join('\n')}

Reply with only JSON: {"answer": "one or two short sentences, say where the thing is", "ids": ["up to 5 file ids, best first"]}`;

  try {
    const sample = await getSample();
    let raw: unknown = null;
    let brain: BrainKind = 'rules';
    if (sample) {
      raw = await sample.json(prompt, { modelTier: 'quick', signal: opts.signal });
      brain = 'claude';
    } else if (opts.serverAi) {
      raw = parseLoose(await askServer(prompt, opts.signal));
      brain = 'server';
    }
    if (raw && typeof raw === 'object') {
      const r = raw as { answer?: unknown; ids?: unknown };
      const known = new Set(live.map((f) => f.id));
      const ids = Array.isArray(r.ids) ? r.ids.map(String).filter((id) => known.has(id)).slice(0, 5) : [];
      if (ids.length || typeof r.answer === 'string') return { answer: clean(String(r.answer ?? ''), 240), ids, brain };
    }
  } catch {
    /* fall through to the rules */
  }
  return viaRules();
}
