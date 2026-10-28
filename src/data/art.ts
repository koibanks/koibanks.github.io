/**
 * Placeholder artwork, generated in CSS. No image files, no network.
 *
 * Every helper returns a `CoverArt`. When you have real work, swap any
 * `art.xyz(...)` call in projects.ts for an image:
 *   { kind: 'image', src: 'work/halden-cover.jpg', alt: 'Halden cup and bag mockup' }
 * (put the file in /public/work/ so Vite serves it as-is).
 */

export type CoverArt =
  | {
      kind: 'css';
      /** Any CSS `background` value. */
      background: string;
      /** Optional big glyph drawn on top, poster-style. */
      mark?: string;
      ink?: string;
      /** Accessible description of the artwork. */
      alt: string;
    }
  | {
      kind: 'image';
      /** Path inside /public, e.g. 'work/project/cover.png'. */
      src: string;
      alt: string;
      /** 'cover' fills and crops (default); 'contain' shows the whole image. */
      fit?: 'cover' | 'contain';
      /** Fill behind a 'contain' image. */
      background?: string;
    }
  /** A short video: shows its first frame (or `poster`), plays on a loop while hovered. */
  | { kind: 'video'; src: string; poster?: string; alt: string };

const css = (background: string, alt: string, mark?: string, ink?: string): CoverArt => ({
  kind: 'css',
  background,
  mark,
  ink,
  alt,
});

export const art = {
  rings: (a: string, b: string, mark?: string) =>
    css(
      `repeating-radial-gradient(circle at 30% 70%, ${a} 0 14px, ${b} 14px 28px)`,
      'Concentric rings pattern',
      mark,
      b,
    ),
  stripes: (a: string, b: string, mark?: string) =>
    css(
      `repeating-linear-gradient(-35deg, ${a} 0 22px, ${b} 22px 30px, ${a} 30px 52px)`,
      'Diagonal stripe pattern',
      mark,
      '#fff',
    ),
  grid: (a: string, b: string, mark?: string) =>
    css(
      `linear-gradient(${b}33 2px, transparent 2px) 0 0 / 40px 40px,
       linear-gradient(90deg, ${b}33 2px, transparent 2px) 0 0 / 40px 40px,
       radial-gradient(circle at 70% 30%, ${b}55, transparent 55%),
       ${a}`,
      'Interface grid pattern',
      mark,
      b,
    ),
  baseline: (a: string, b: string, mark?: string) =>
    css(
      `repeating-linear-gradient(180deg, transparent 0 46px, ${b}55 46px 48px), ${a}`,
      'Type specimen with baseline grid',
      mark,
      b,
    ),
  dots: (a: string, b: string, mark?: string) =>
    css(
      `radial-gradient(${b} 22%, transparent 24%) 0 0 / 36px 36px,
       radial-gradient(${b} 22%, transparent 24%) 18px 18px / 36px 36px, ${a}`,
      'Polka dot packaging pattern',
      mark,
      b,
    ),
  columns: (a: string, b: string, mark?: string) =>
    css(
      `linear-gradient(90deg, transparent 0 8%, ${b}22 8% 30%, transparent 30% 38%, ${b}22 38% 60%, transparent 60% 68%, ${b}22 68% 92%, transparent 92%),
       linear-gradient(180deg, ${b} 0 14%, transparent 14%), ${a}`,
      'Editorial column layout',
      mark,
      b,
    ),
  waves: (a: string, b: string, mark?: string) =>
    css(
      `repeating-radial-gradient(ellipse at 50% 120%, ${a} 0 18px, ${b} 18px 22px, ${a} 22px 40px),
       ${a}`,
      'Wave interference pattern',
      mark,
      b,
    ),
  conic: (a: string, b: string, mark?: string) =>
    css(`conic-gradient(from 45deg at 60% 40%, ${a}, ${b}, ${a}, ${b}, ${a})`, 'Conic color study', mark, '#fff'),
  split: (a: string, b: string, mark?: string) =>
    css(`linear-gradient(115deg, ${a} 0 55%, ${b} 55% 100%)`, 'Two-tone composition', mark, '#fff'),
  checker: (a: string, b: string, mark?: string) =>
    css(
      `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0) 0 0 / 64px 64px`,
      'Checkerboard pattern',
      mark,
      '#fff',
    ),
};

/** Image or video art from a file path (used for files you pick in the Design panel). */
export const artFromSrc = (src: string, alt: string): CoverArt =>
  /\.(mp4|webm|mov|m4v)$/i.test(src) ? { kind: 'video', src, alt } : { kind: 'image', src, alt };
