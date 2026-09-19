import { useEffect, useMemo, useRef, useState } from 'react';
import { searchFiles } from '../ai/rules';
import type { FindResult } from '../ai';
import { placeName, useApp } from '../store/store';
import { FileObject } from './FileObject';
import { Icon } from './Icon';

/** "Where did I put...?" Type to match by name and contents, or ask in plain words. Picking a result walks you to it. */
export function SearchBox() {
  const house = useApp((s) => s.house);
  const files = useApp((s) => s.files);
  const brain = useApp((s) => s.brain);
  const flyToFile = useApp((s) => s.flyToFile);
  const ask = useApp((s) => s.ask);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<FindResult | null>(null);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const quick = useMemo(() => (q.trim().length > 1 ? searchFiles(q, files, house).slice(0, 7) : []), [q, files, house]);
  const answered = useMemo(() => (answer ? answer.ids.map((id) => files.find((f) => f.id === id)).filter((f) => !!f) : []), [answer, files]);
  const list = answer ? answered : quick;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const go = (id: string) => {
    setOpen(false);
    setQ('');
    setAnswer(null);
    input.current?.blur();
    flyToFile(id);
  };

  const latest = useRef(q);
  latest.current = q;

  const runAsk = async () => {
    const asked = q.trim();
    if (!asked || asking) return;
    setAsking(true);
    setAnswer(null);
    try {
      const found = await ask(asked);
      if (latest.current.trim() !== asked) return; // they kept typing: this answers an old question
      setAnswer(found);
      setCursor(0);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="search" ref={wrap}>
      <label className="search-field" htmlFor="search-input">
        <Icon name="search" size={17} />
        <input
          id="search-input"
          ref={input}
          value={q}
          placeholder="Where did I put…"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setAnswer(null);
            setCursor(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              input.current?.blur();
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, list.length));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === 'Enter') {
              const pick = list[cursor];
              if (pick) go(pick.id);
              else void runAsk();
            }
          }}
        />
        <kbd>/</kbd>
      </label>

      {open && q.trim().length > 1 && (
        <div className="search-results" role="listbox">
          {answer && <p className="search-answer">{answer.answer}</p>}
          {list.map((f, i) => (
            <button key={f.id} className={`search-hit${i === cursor ? ' is-cursor' : ''}`} role="option" aria-selected={i === cursor} onMouseEnter={() => setCursor(i)} onClick={() => go(f.id)}>
              <span className="search-hit-object">
                <FileObject file={f} mini flat />
              </span>
              <span className="search-hit-text">
                <b>{f.name}</b>
                <small>{placeName(house, f.furnitureId)}</small>
              </span>
              <span className="search-hit-go">Walk there</span>
            </button>
          ))}
          {!list.length && !asking && <p className="search-empty">{answer ? 'Nothing in the house matches.' : 'No names match. Try asking in your own words.'}</p>}
          <button className={`search-ask${cursor === list.length ? ' is-cursor' : ''}`} onClick={() => void runAsk()} disabled={asking}>
            <Icon name="sparkle" size={16} />
            {asking ? 'Looking through the house…' : brain === 'rules' ? `Search contents for "${q.trim()}"` : `Ask Claude: "${q.trim()}"`}
          </button>
        </div>
      )}
    </div>
  );
}
