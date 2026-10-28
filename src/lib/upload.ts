/**
 * Dev only: add an image/video to public/work/<project>/ (Design panel uploads).
 *
 * Big photos are optimized first, in the browser: anything over 3600px on its
 * long side (or 4 MB) is resized to 3600px and saved as a near-lossless WebP.
 * That's still sharp on retina screens at full width, at a fraction of the size.
 * Videos and GIFs are uploaded untouched.
 */
const MAX_EDGE = 3600;
const MAX_BYTES = 4 * 1024 * 1024;

export async function optimizeImage(file: File): Promise<{ blob: Blob; name: string; note: string }> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return { blob: file, name: file.name, note: '' };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_BYTES) return { blob: file, name: file.name, note: '' };
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.95));
  if (!blob || blob.size >= file.size) return { blob: file, name: file.name, note: '' };
  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  const kb = (n: number) => `${Math.round(n / 1024)} KB`;
  return { blob, name, note: `optimized ${kb(file.size)} → ${kb(blob.size)}, ${w}×${h}` };
}

export async function uploadMedia(project: string, file: File): Promise<{ src: string; note: string }> {
  const { blob, name, note } = await optimizeImage(file);
  const res = await fetch(`/__upload?project=${encodeURIComponent(project)}&name=${encodeURIComponent(name)}`, {
    method: 'POST',
    body: blob,
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error ?? 'upload failed');
  return { src: j.src as string, note };
}

export const ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,video/x-m4v,.mov,.m4v,.epub,application/epub+zip';
export const isVideo = (src: string) => /\.(mp4|webm|mov|m4v)$/i.test(src);
