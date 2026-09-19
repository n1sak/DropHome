import { useEffect, useMemo, useState } from 'react';
import { saveFile } from '../lib/download';
import { KIND_LABEL, isTextual, prettySize } from '../lib/fileKinds';
import { relative, shortDate } from '../lib/time';
import type { FileItem } from '../model/types';
import { placeName, useApp } from '../store/store';
import { FileObject } from './FileObject';
import { Icon } from './Icon';
import { useFileText, useFileUrl } from './useFileUrl';

declare const __ARTIFACT__: boolean;

/** A file, picked up and looked at. */
export function Preview() {
  const id = useApp((s) => s.previewId);
  const file = useApp((s) => s.files.find((f) => f.id === id));
  if (!file) return null;
  return <PreviewOf key={file.id} file={file} />;
}

function PreviewOf({ file }: { file: FileItem }) {
  const app = useApp.getState();
  const house = useApp((s) => s.house);
  const [name, setName] = useState(file.name);
  useEffect(() => setName(file.name), [file.name]);

  const close = () => app.openPreview(null);
  const download = async () => {
    const blob = await app.fileBlob(file);
    if (!blob) return app.toast('That file has no contents to download.', { tone: 'warn' });
    const result = await saveFile(file, blob);
    if (result === 'unsupported') app.toast(`This viewer cannot save .${file.ext || 'this kind of'} files. Run Roomy from the repo to download anything.`, { tone: 'warn' });
  };
  const copyLink = async () => {
    const url = file.shared?.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      app.toast('Link copied.', { tone: 'good' });
    } catch {
      app.toast(url);
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={file.name} onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="preview">
        <div className="preview-view">
          <Viewer file={file} />
        </div>
        <div className="preview-side">
          <button className="icon-btn preview-close" onClick={close} aria-label="Close">
            <Icon name="close" />
          </button>
          <label className="field" htmlFor="preview-name">
            <span>Name</span>
            <input
              id="preview-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && name !== file.name && app.renameFile(file.id, name)}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          </label>

          <dl className="facts">
            <div>
              <dt>Lives in</dt>
              <dd>
                {file.trashed ? 'The bins' : placeName(house, file.furnitureId)}
                {!file.trashed && (
                  <button className="link" onClick={() => app.flyToFile(file.id)}>
                    Walk me there
                  </button>
                )}
              </dd>
            </div>
            {file.reason && (
              <div>
                <dt>Why here</dt>
                <dd className="reason">
                  <Icon name="sparkle" size={14} /> {file.reason}
                </dd>
              </div>
            )}
            <div>
              <dt>Kind</dt>
              <dd>
                {KIND_LABEL[file.kind]} · {prettySize(file.size)}
              </dd>
            </div>
            <div>
              <dt>Modified</dt>
              <dd>{shortDate(file.modifiedAt)}</dd>
            </div>
            <div>
              <dt>Last touched</dt>
              <dd>{relative(file.touchedAt)}</dd>
            </div>
            {file.tags.length > 0 && (
              <div>
                <dt>Tags</dt>
                <dd className="tags">
                  {file.tags.map((t) => (
                    <span key={t} className="chip chip-soft">
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {file.shared && (
              <div>
                <dt>Shared</dt>
                <dd>
                  {file.shared.url ? (
                    <button className="link" onClick={() => void copyLink()}>
                      Copy link
                    </button>
                  ) : (
                    'Marked as shared (links need the server)'
                  )}
                </dd>
              </div>
            )}
          </dl>

          <div className="preview-actions">
            {file.trashed ? (
              <>
                <button className="btn btn-primary" onClick={() => app.restore([file.id])}>
                  <Icon name="undo" size={16} /> Put it back
                </button>
                <button className="btn btn-danger" onClick={() => void app.deleteForever([file.id])}>
                  <Icon name="trash" size={16} /> Delete for good
                </button>
              </>
            ) : (
              <>
                <button className={`btn${file.pinned ? ' is-on' : ''}`} onClick={() => app.togglePin(file.id)}>
                  <Icon name="pin" size={16} /> {file.pinned ? 'Pinned' : 'Pin it up'}
                </button>
                <button className="btn" onClick={() => app.openMove([file.id])}>
                  <Icon name="move" size={16} /> Move to…
                </button>
                <button className={`btn${file.shared ? ' is-on' : ''}`} onClick={() => void (file.shared ? app.unshare(file.id) : app.share(file.id))}>
                  <Icon name="link" size={16} /> {file.shared ? 'Stop sharing' : 'Share link'}
                </button>
                <button className="btn" onClick={() => void download()}>
                  <Icon name="download" size={16} /> Download
                </button>
                <button className="btn btn-danger" onClick={() => app.trash([file.id])}>
                  <Icon name="trash" size={16} /> Bin it
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Viewer({ file }: { file: FileItem }) {
  const textual = isTextual(file.kind, file.ext, file.mime);
  // inline PDFs need the browser's own viewer, which sandboxed pages and a few browsers do not have
  const canShowPdf = !__ARTIFACT__ && (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled !== false;
  const isPdf = file.kind === 'pdf' && file.mime === 'application/pdf'; // a ".pdf" that is really something else never gets a frame
  const needsUrl = file.kind === 'image' || file.kind === 'audio' || file.kind === 'video' || (isPdf && canShowPdf);
  const url = useFileUrl(needsUrl ? file : null);
  const text = useFileText(file, textual);

  if (file.kind === 'image') return url ? <img className="view-image" src={url} alt={file.name} /> : <Loading file={file} />;
  if (file.kind === 'video') return url ? <video className="view-video" src={url} controls /> : <Loading file={file} />;
  if (file.kind === 'audio')
    return (
      <div className="view-audio">
        <div className="view-audio-object">
          <FileObject file={file} flat />
        </div>
        {url ? <audio src={url} controls /> : <p className="muted">Loading the recording…</p>}
      </div>
    );
  if (isPdf && url) return <iframe className="view-frame" src={url} title={file.name} />;
  if (textual) {
    if (text === null) return <Loading file={file} />;
    if (file.ext === 'csv' || file.ext === 'tsv') return <CsvTable text={text} sep={file.ext === 'tsv' ? '\t' : ','} />;
    if (file.ext === 'md' || file.ext === 'markdown') return <Markdown text={text} />;
    return <pre className={`view-text${file.kind === 'code' ? ' is-code' : ''}`}>{text}</pre>;
  }
  return (
    <div className="view-none">
      <FileObject file={file} flat />
      {file.snippet && <pre className="view-snippet">{file.snippet}</pre>}
      <p className="muted">{file.kind === 'pdf' ? 'This viewer cannot show PDFs inline. Download it to read the whole thing.' : `No preview for this kind of file. Download it to open it.`}</p>
    </div>
  );
}

function Loading({ file }: { file: FileItem }) {
  return (
    <div className="view-none">
      <FileObject file={file} flat />
      <p className="muted">Opening…</p>
    </div>
  );
}

function CsvTable({ text, sep }: { text: string; sep: string }) {
  const rows = useMemo(
    () =>
      text
        .split('\n')
        .filter((l) => l.trim())
        .slice(0, 80)
        .map((l) => l.split(sep)),
    [text, sep],
  );
  if (!rows.length) return <p className="muted">This sheet is empty.</p>;
  return (
    <div className="view-table">
      <table>
        <thead>
          <tr>
            {rows[0].map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Just enough markdown for notes: headings, lists, bold and code. No HTML is ever injected. */
function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => text.replace(/\r/g, '').split('\n'), [text]);
  const inline = (s: string, key: number) => {
    const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={key}>
        {parts.map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p))}
      </span>
    );
  };
  return (
    <article className="view-md">
      {blocks.map((line, i) => {
        if (/^#{1,3}\s/.test(line)) return <h3 key={i}>{line.replace(/^#+\s/, '')}</h3>;
        if (/^\s*[-*]\s/.test(line)) return <p key={i} className="md-li">{inline(line.replace(/^\s*[-*]\s/, ''), i)}</p>;
        if (/^\s*\d+\.\s/.test(line)) return <p key={i} className="md-li md-num">{inline(line, i)}</p>;
        if (!line.trim()) return <div key={i} className="md-gap" />;
        return i === 0 ? <h3 key={i}>{line}</h3> : <p key={i}>{inline(line, i)}</p>;
      })}
    </article>
  );
}
