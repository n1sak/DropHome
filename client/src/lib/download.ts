import type { FileItem } from '../model/types';

declare const __ARTIFACT__: boolean;

type Downloads = { save(req: { filename: string; data: Blob }): Promise<{ status: string }> };

/**
 * Save a file to the viewer's device. Inside the published artifact, page-started
 * downloads are blocked, so we go through the "downloads" capability there.
 */
export async function saveFile(file: FileItem, blob: Blob): Promise<'saved' | 'declined' | 'unsupported'> {
  try {
    const cap = (await window.claude?.use?.('downloads')) as Downloads | null | undefined;
    if (cap) {
      try {
        await cap.save({ filename: file.name, data: blob });
        return 'saved';
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code === 'declined') return 'declined';
        if (code === 'rejected_extension') return 'unsupported';
      }
    }
  } catch {
    /* not in an artifact viewer */
  }
  // The published demo runs sandboxed, where a page-started download silently does nothing.
  if (__ARTIFACT__) return 'unsupported';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}
