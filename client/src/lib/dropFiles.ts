/**
 * Files from a desktop drop, including everything inside dropped FOLDERS.
 * The entries have to be read synchronously during the drop event; after the
 * first await the browser empties the DataTransfer.
 */
interface Entry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file(ok: (f: File) => void, fail: (e: unknown) => void): void;
  createReader(): { readEntries(ok: (batch: Entry[]) => void, fail: (e: unknown) => void): void };
}

const MAX_FILES = 400;
const JUNK = /^(\.|~\$|thumbs\.db$|desktop\.ini$)/i;

export function collectDroppedFiles(dt: DataTransfer): Promise<File[]> {
  const flat = [...dt.files];
  const entries: Entry[] = [];
  for (const item of [...(dt.items ?? [])]) {
    const getEntry = (item as DataTransferItem & { webkitGetAsEntry?: () => Entry | null }).webkitGetAsEntry;
    const entry = item.kind === 'file' && getEntry ? getEntry.call(item) : null;
    if (entry) entries.push(entry);
  }
  if (!entries.some((e) => e.isDirectory)) return Promise.resolve(flat);

  const out: File[] = [];
  const walk = async (entry: Entry): Promise<void> => {
    if (out.length >= MAX_FILES || JUNK.test(entry.name)) return;
    if (entry.isFile) {
      const file = await new Promise<File | null>((resolve) => entry.file(resolve, () => resolve(null)));
      if (file) out.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      for (;;) {
        const batch = await new Promise<Entry[]>((resolve) => reader.readEntries(resolve, () => resolve([])));
        if (!batch.length) break; // readEntries hands back at most 100 at a time
        for (const child of batch) await walk(child);
      }
    }
  };
  return (async () => {
    for (const e of entries) await walk(e);
    return out;
  })();
}
