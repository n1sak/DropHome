/** Reading helpers that work everywhere, including sandboxed pages where blob: URLs are blocked. */

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error('read failed'));
    r.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to decode'));
    img.src = src;
  });
}

/** A small JPEG data URL for a photo, or undefined if the browser cannot decode it (HEIC, broken files). */
export async function makeThumb(blob: Blob, max = 420): Promise<string | undefined> {
  try {
    const img = await loadImage(await blobToDataUrl(blob));
    const scale = Math.min(1, max / Math.max(img.naturalWidth || max, img.naturalHeight || max));
    const w = Math.max(1, Math.round((img.naturalWidth || max) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || max) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return undefined;
  }
}

/** Turn an SVG string into a real JPEG blob, so sample photos behave like camera photos. */
export async function rasterizeSvg(svg: string, w: number, h: number, type: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<Blob | null> {
  try {
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), type, 0.86));
  } catch {
    return null;
  }
}

export async function readSnippet(blob: Blob, max = 700): Promise<string> {
  try {
    const text = await blob.slice(0, 4096).text();
    return text.replace(/\r/g, '').slice(0, max);
  } catch {
    return '';
  }
}
