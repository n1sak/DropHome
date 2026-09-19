import { useEffect, useState } from 'react';
import type { FileItem } from '../model/types';
import { useApp } from '../store/store';

/** Resolves a file to something an <img>, <audio> or <video> can load. */
export function useFileUrl(file: FileItem | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const id = file?.id;
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!file) return;
    void useApp
      .getState()
      .fileUrl(file)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return url;
}

export function useFileText(file: FileItem | null | undefined, enabled: boolean, max = 200_000): string | null {
  const [text, setText] = useState<string | null>(null);
  const id = file?.id;
  useEffect(() => {
    let alive = true;
    setText(null);
    if (!file || !enabled) return;
    void useApp
      .getState()
      .fileBlob(file)
      .then((b) => (b ? b.slice(0, max).text() : ''))
      .then((t) => alive && setText(t))
      .catch(() => alive && setText(''));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enabled]);
  return text;
}
