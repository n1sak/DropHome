/**
 * The built-in sorter. No network, no model: just names, dates and first
 * lines. It is the fallback when Claude is not available, and the safety net
 * that repairs any placement the model gets wrong.
 *
 * It never picks a room by id. It asks for a KIND of room and a ROLE of
 * furniture ("study" + "active") and the house resolves that to whatever the
 * owner actually built. That is what lets it work in a custom house.
 */
import type { FileItem, FurnitureKind, House, Placement, Role, Room, RoomKind } from '../model/types';
import { ageInDays } from '../lib/time';

export const SMART_ROLES: Role[] = ['recent', 'shared', 'screen', 'inbox', 'trash'];

interface Guess {
  rooms: RoomKind[];
  roles: Role[];
  reason: string;
  tags: string[];
  pin?: boolean;
  /** When several pieces share a role, prefer these kinds (a song goes in the record crate, not on the projector). */
  kinds?: FurnitureKind[];
}

const COURSE = /\b[A-Z]{2,4}[ _-]?\d{3,4}[A-Za-z]?\b/;
/** Camera and scanner prefixes look like course codes (IMG_5012) but are not. */
const NOT_A_COURSE = /^(IMG|DSC|DSCN|DSCF|PXL|MVI|MOV|VID|GOPR|SCAN|PIC|WA|PANO|FILE|DOC|COPY|PAGE|V|VER)[ _-]?\d/i;

function courseIn(name: string): string | undefined {
  const hit = COURSE.exec(name)?.[0];
  return hit && !NOT_A_COURSE.test(hit) ? hit : undefined;
}

const has = (text: string, re: RegExp) => re.test(text);

export function guess(file: Pick<FileItem, 'name' | 'kind' | 'ext' | 'modifiedAt' | 'snippet'>, now = Date.now()): Guess {
  const name = file.name;
  const text = `${name}\n${file.snippet ?? ''}`.toLowerCase();
  const lower = name.toLowerCase();
  const days = ageInDays(file.modifiedAt, now);
  const years = days / 365;
  const course = courseIn(name);

  const messy = /^(screenshot|screen shot|untitled|new document|document\d*|scan[_ ]?\d)/.test(lower) || /final[_ -]?final|copy of| \(\d+\)\.| copy\./.test(lower);

  if (file.kind === 'image') {
    if (/^(screenshot|screen shot)/.test(lower)) return { rooms: ['bathroom'], roles: ['cleanup'], reason: 'Screenshot: toss it in the hamper to deal with later', tags: ['screenshot'] };
    if (has(text, /moodboard|mood board|inspo|decor|palette|mockup|wireframe|logo|sketch|swatch/)) return { rooms: ['studio', 'bathroom'], roles: ['drafts', 'active'], reason: 'Looks like design inspiration', tags: ['inspiration'] };
    if (has(text, /headshot|portrait|profile pic|linkedin|avatar/)) return { rooms: ['bathroom', 'office'], roles: ['display'], reason: 'This is how you present yourself', tags: ['headshot'], pin: true };
    if (/\b(passport|visa|ssn|id card|insurance|driver'?s licen[sc]e|birth certificate|diploma|w-?2|1099)\b/.test(lower)) return { rooms: ['bedroom', 'office'], roles: ['vault'], reason: 'A scan of something important: into the safe', tags: ['important'] };
    if (has(text, /poster|diagram|figure|whiteboard|lecture|lab\b/) || course) return school(text, days, course, 'Picture from class');
    if (years > 6 || has(text, /baby|childhood|kindergarten|elementary|preschool|age \d|toddler|yearbook|\d(st|nd|rd|th) grade|middle school|prom\b/)) return { rooms: ['living', 'attic'], roles: ['memories'], reason: 'An old memory worth keeping', tags: ['memories'] };
    if (years > 1.5) return { rooms: ['living'], roles: ['archive'], reason: 'Older photo: into the albums', tags: ['photo'] };
    return { rooms: ['living'], roles: ['active'], reason: 'New photo', tags: ['photo'] };
  }

  if (file.kind === 'audio') {
    if (has(text, /lecture|class|seminar/) || course) return school(text, days, course, 'Recording from class');
    return { rooms: ['den'], roles: ['media'], kinds: ['recordCrate'], reason: 'Audio goes in the record crate', tags: ['audio'] };
  }
  if (file.kind === 'video') {
    if (has(text, /lecture|class|seminar/) || course) return school(text, days, course, 'Recording from class');
    return { rooms: ['den'], roles: years > 2 ? ['archive', 'media'] : ['media'], kinds: years > 2 ? ['tapeShelf'] : ['projector'], reason: years > 2 ? 'Older video: onto the tape shelf' : 'Video for the big screen', tags: ['video'] };
  }

  if (file.kind === 'archive') {
    if (has(text, /backup|export|takeout|icloud|phone|laptop|time ?machine/)) return { rooms: ['cellar'], roles: ['backup'], reason: 'A backup: keep it safe downstairs', tags: ['backup'] };
    if (has(text, /project|code|site|repo|src|app|game|bot/)) return { rooms: ['workshop'], roles: ['archive'], reason: 'A packed-up project', tags: ['project'] };
    return { rooms: ['cellar'], roles: ['archive', 'backup'], reason: 'A big archive: into storage', tags: ['archive'] };
  }

  if (file.kind === 'code') {
    if (course) return school(text, days, course, 'Code for a class');
    if (has(text, /cheat ?sheet|snippet|template|config|dotfile|\.?rc$|settings/)) return { rooms: ['workshop'], roles: ['reference'], reason: 'Something you reuse: into the toolbox', tags: ['reference'] };
    if (days > 240) return { rooms: ['workshop'], roles: ['archive'], reason: 'An older project: onto the shelves', tags: ['project'] };
    return { rooms: ['workshop'], roles: ['active'], reason: 'Code you are working on', tags: ['project'] };
  }

  // Important papers. Whole words in the NAME only: "please", "hw2" and "taxi" are not a lease, a W-2 or a tax form.
  if (!course && /\b(passport|visa|social security|ssn|tax(es)?|w-?2|1099|1098|lease|insurance|bank statement|pay ?stub|offer letter|contract|birth certificate|driver'?s licen[sc]e|id card|transcript|diploma)\b/.test(lower))
    return { rooms: ['bedroom', 'office'], roles: ['vault'], reason: 'Important document: into the safe', tags: ['important'] };

  if (/^(readme|changelog|contributing|license|todo)\b/.test(lower)) return { rooms: ['workshop'], roles: ['reference', 'active'], reason: 'Project paperwork: with the tools', tags: ['project'] };

  if (has(text, /r[ée]sum[ée]|\bcv\b|cover letter|linkedin|portfolio|\bbio\b/)) {
    if (has(text, /draft|wip|rough/)) return { rooms: ['office', 'bathroom'], roles: ['active', 'drafts'], reason: 'A draft that needs polish', tags: ['career', 'draft'] };
    return { rooms: ['office', 'bathroom'], roles: ['active', 'display'], reason: 'This is how you present yourself', tags: ['career'] };
  }

  if (has(text, /grocer|shopping list|meal plan|menu for/)) return { rooms: ['kitchen'], roles: ['display'], reason: 'Goes on the fridge door', tags: ['kitchen'], pin: true };
  if (has(text, /recipe|ingredients|tbsp|tsp\b|teaspoon|tablespoon|preheat|simmer|bake at|serves \d|cups? (of )?(flour|sugar|rice|water|milk)/)) return { rooms: ['kitchen'], roles: ['active'], reason: 'A recipe: into the recipe box', tags: ['recipe'] };
  if (has(text, /manual|warranty|receipt|user guide|assembly|instructions|invoice/)) return { rooms: ['kitchen'], roles: ['reference'], reason: 'Household paperwork: into the pantry', tags: ['household'] };

  if (course || has(text, /pset|problem set|homework|\bhw ?\d|lecture|syllabus|midterm|final exam|\bquiz|lab report|essay|thesis|seminar|study guide|flashcards|\bexam\b|professor|recitation|reading response/))
    return school(text, days, course, 'Coursework');

  if (has(text, /budget|expenses|spending|finance|invoice/)) return { rooms: ['bedroom', 'office'], roles: ['vault'], reason: 'Money matters: into the safe', tags: ['money'] };
  if (has(text, /journal|diary|gratitude|bucket list|books to read|reading list|packing list|letter to|dear /)) return { rooms: ['bedroom'], roles: days > 500 ? ['archive'] : ['active'], reason: 'Personal: by the bed', tags: ['personal'] };
  if (has(text, /goals?\b|resolution|five year|plan for|roadmap|vision/)) return { rooms: ['greenhouse', 'bedroom'], roles: ['drafts', 'active'], reason: 'A plan that is still growing', tags: ['goals'] };
  if (has(text, /draft|idea|brainstorm|outline|wip\b|rough|notes to self|costume|poem/)) return { rooms: ['bathroom', 'studio'], roles: ['drafts'], reason: 'An idea left to soak', tags: ['draft'] };

  if (messy) return { rooms: ['bathroom'], roles: ['cleanup'], reason: 'Needs a better name first', tags: ['messy'] };
  if (years > 2) return { rooms: ['attic'], roles: ['archive'], kinds: ['boxes'], reason: 'Over two years old: up to the attic', tags: ['old'] };
  return { rooms: ['kitchen'], roles: ['misc'], reason: 'Not sure yet: the junk drawer for now', tags: [] };
}

function school(text: string, days: number, course: string | undefined, what: string): Guess {
  const tags = ['school', ...(course ? [course.replace(/[ _-]/g, ' ').toUpperCase()] : [])];
  if (days > 900) return { rooms: ['attic'], roles: ['archive'], kinds: ['trunk'], reason: `${what}, years old: up to the attic`, tags };
  if (/syllabus|schedule|deadlines|calendar|office hours/.test(text)) return { rooms: ['study', 'office'], roles: ['display'], reason: `${what} to keep in sight`, tags, pin: true };
  if (/textbook|reading|chapter|cheat ?sheet|formula|reference|notes on|paper\b/.test(text)) return { rooms: ['study', 'library'], roles: ['reference'], reason: `${what} to keep handy`, tags };
  if (days > 140) return { rooms: ['study'], roles: ['archive'], reason: `${what} from a past term`, tags };
  return { rooms: ['study', 'office'], roles: ['active'], reason: `${what} for this term`, tags };
}

/** Turn "a study, active" into a real room and piece of furniture in THIS house. */
export function resolve(house: House, g: Pick<Guess, 'rooms' | 'roles' | 'kinds'>): { roomId: string; furnitureId: string } | null {
  const usable = (room: Room) => room.furniture.filter((f) => !SMART_ROLES.includes(f.role));
  for (const kind of g.rooms) {
    for (const room of house.rooms.filter((r) => r.kind === kind)) {
      for (const role of g.roles) {
        const matches = usable(room).filter((x) => x.role === role);
        const f = matches.find((x) => g.kinds?.includes(x.kind)) ?? matches[0];
        if (f) return { roomId: room.id, furnitureId: f.id };
      }
    }
  }
  // right kind of room, but no matching furniture: use its main surface
  for (const kind of g.rooms) {
    const room = house.rooms.find((r) => r.kind === kind && usable(r).length);
    if (room) {
      const f = usable(room).find((x) => x.role === 'active') ?? usable(room)[0];
      return { roomId: room.id, furnitureId: f.id };
    }
  }
  // no such room: any furniture with the right meaning, anywhere
  for (const role of g.roles) {
    for (const room of house.rooms) {
      const f = usable(room).find((x) => x.role === role);
      if (f) return { roomId: room.id, furnitureId: f.id };
    }
  }
  for (const room of house.rooms) {
    const f = usable(room).find((x) => x.role === 'misc');
    if (f) return { roomId: room.id, furnitureId: f.id };
  }
  return null;
}

export function sortWithRules(files: FileItem[], house: House): (Placement & { pin?: boolean })[] {
  const out: (Placement & { pin?: boolean })[] = [];
  for (const file of files) {
    const g = guess(file);
    const spot = resolve(house, g);
    if (!spot) continue;
    out.push({ id: file.id, ...spot, reason: g.reason, tags: g.tags, pin: g.pin });
  }
  return out;
}

const STOP = new Set('a an and are at can could did do does file files find for from have how i in is it me my of on or please put show that the this to was what where which with you your'.split(' '));

/** Lower case, no accents, no punctuation, no filler words, no plural s. "Where is my résumé?" -> ["resume"] */
export function searchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOP.has(t))
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

const plain = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Plain text search with a little scoring. Used for instant results, and when there is no model to ask. */
export function searchFiles(query: string, files: FileItem[], house: House): FileItem[] {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const where = new Map<string, string>();
  for (const room of house.rooms) for (const f of room.furniture) where.set(f.id, `${room.name} ${f.name}`);
  const need = Math.max(1, Math.ceil(terms.length * 0.6)); // most of the words, not necessarily all
  const scored: [number, FileItem][] = [];
  for (const file of files) {
    if (file.trashed) continue;
    const name = plain(file.name);
    const rest = plain(`${file.tags.join(' ')} ${file.snippet ?? ''} ${where.get(file.furnitureId) ?? ''} ${file.kind}`);
    let score = 0;
    let matched = 0;
    for (const t of terms) {
      if (name.includes(t)) {
        score += new RegExp(`(^|[^a-z0-9])${t}`).test(name) ? 6 : 4;
        matched += 1;
      } else if (rest.includes(t)) {
        score += 1.5;
        matched += 1;
      }
    }
    if (matched >= need) scored.push([score + matched * 2 + Math.max(0, 1 - ageInDays(file.touchedAt) / 365), file]);
  }
  return scored.sort((a, b) => b[0] - a[0]).map(([, f]) => f);
}
