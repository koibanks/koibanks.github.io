import type { CSSProperties } from 'react';
import { artFromSrc } from '../data/art';
import type { CoverArt, Project } from '../data/projects';
import { getDesign } from './design';

/** Default folder color when a project doesn't set `folderColor`. */
export const DEFAULT_FOLDER = '#b7c8d4';

/**
 * Where a file's tab sits along the top edge, as a % of the folder width.
 * Fixed per file, so a tab never jumps when the stack reorders:
 * N.01 left, N.02 middle, N.03 right (then it wraps).
 */
export const tabLeft = (k: number) => 10 + (k % 4) * 21;

/** The other files, in order after `index`, so the next file sits right behind. */
export const behindOf = (index: number, total: number) =>
  Array.from({ length: total - 1 }, (_, d) => (index + 1 + d) % total);

/** A project's folder color: Design panel setting first, then the project data. */
export const folderColor = (p: Project) => getDesign().folders[p.id] ?? p.folderColor ?? DEFAULT_FOLDER;

/** CSS variables for a folder: its color and its tab position. */
export const folderVars = (p: Project, k: number, depth = 0) =>
  ({
    '--folder': folderColor(p),
    '--tab-x': `${tabLeft(k)}%`,
    '--k': depth,
  }) as CSSProperties;

/** The image shown on a project's folder on the front page: your Design panel pick, else the project data. */
export function homeImage(p: Project): CoverArt {
  const src = getDesign().covers[p.id];
  return src ? artFromSrc(src, p.title) : (p.feature ?? p.cover);
}
