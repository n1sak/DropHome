import { memo, type CSSProperties } from 'react';
import { hashSeed } from '../art/sketch';
import { stemOf } from '../lib/fileKinds';
import { dustLevel } from '../lib/time';
import type { FileItem } from '../model/types';
import { Icon } from './Icon';

/**
 * A file, drawn as the physical thing it would be: photos are polaroids, notes
 * are lined paper, code is a dark card, music is a record in its sleeve, zips
 * are taped-up boxes. Dust builds up the longer a file goes untouched.
 */
export const FileObject = memo(function FileObject({ file, mini = false, flat = false }: { file: FileItem; mini?: boolean; flat?: boolean }) {
  const seed = hashSeed(file.id);
  const tilt = flat ? 0 : ((seed % 70) - 35) / 10;
  const dust = mini ? 0 : dustLevel(Math.max(file.touchedAt, file.addedAt));
  const thumb = file.thumb ?? file.thumbUrl;
  const lines = (file.snippet ?? '').split('\n').filter((l) => l.trim());
  const title = lines[0]?.replace(/^#+\s*/, '').slice(0, 60);
  const body = lines.slice(1, 7);
  const ext = (file.ext || file.kind).slice(0, 5).toUpperCase();

  let inner;
  switch (file.kind) {
    case 'image':
      inner = (
        <div className="fo-photo">
          <div className="fo-photo-img" style={thumb ? { backgroundImage: `url("${thumb}")` } : undefined}>
            {!thumb && <Icon name="photo" />}
          </div>
          {!mini && <div className="fo-caption">{stemOf(file.name)}</div>}
        </div>
      );
      break;
    case 'audio':
      inner = (
        <div className="fo-record">
          <div className="fo-disc">
            <span />
          </div>
          <div className="fo-sleeve" style={{ '--hue': seed % 360 } as CSSProperties}>
            {!mini && <b>{stemOf(file.name)}</b>}
          </div>
        </div>
      );
      break;
    case 'video':
      inner = (
        <div className="fo-tape">
          <div className="fo-tape-window">
            <i />
            <i />
          </div>
          {!mini && <div className="fo-tape-label">{stemOf(file.name)}</div>}
        </div>
      );
      break;
    case 'archive':
      inner = (
        <div className="fo-box">
          <div className="fo-box-tape" />
          {!mini && <div className="fo-box-label">{stemOf(file.name)}</div>}
        </div>
      );
      break;
    case 'code':
      inner = (
        <div className="fo-code">
          <div className="fo-tab">{ext}</div>
          {!mini && (
            <pre>
              {lines.slice(0, 8).map((l, i) => (
                <span key={i}>{l.slice(0, 34) + '\n'}</span>
              ))}
            </pre>
          )}
        </div>
      );
      break;
    default:
      inner = (
        <div className={`fo-paper fo-paper-${file.kind}`}>
          <div className="fo-tab">{ext}</div>
          {!mini && (
            <>
              <div className="fo-paper-title">{title || stemOf(file.name)}</div>
              <div className="fo-paper-body">
                {body.length
                  ? body.map((l, i) => <p key={i}>{l.slice(0, 46)}</p>)
                  : [68, 92, 80, 88, 54].map((wd, i) => <p key={i} className="fo-rule" style={{ width: `${wd}%` }} />)}
              </div>
            </>
          )}
        </div>
      );
  }

  return (
    <div className={`fo fo-${file.kind}${mini ? ' fo-mini' : ''} dust-${dust}`} style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      {inner}
      {file.pinned && !mini && (
        <span className="fo-pin" title="Pinned">
          <Icon name="pin" />
        </span>
      )}
      {file.shared && !mini && (
        <span className="fo-shared" title="Shared with a link">
          <Icon name="link" />
        </span>
      )}
      {dust === 3 && <span className="fo-web" aria-hidden="true" />}
    </div>
  );
});
