import type { Suit as SuitName } from '../data/projects';

// Pixel-art playing-card suits, 9×9. "#" = filled pixel.
const GRIDS: Record<SuitName, string[]> = {
  club: [
    '...###...',
    '..#####..',
    '..#####..',
    '.##.#.##.',
    '#########',
    '#########',
    '.##.#.##.',
    '....#....',
    '..#####..',
  ],
  diamond: [
    '....#....',
    '...###...',
    '..#####..',
    '.#######.',
    '#########',
    '.#######.',
    '..#####..',
    '...###...',
    '....#....',
  ],
  spade: [
    '....#....',
    '...###...',
    '..#####..',
    '.#######.',
    '#########',
    '#########',
    '.##.#.##.',
    '....#....',
    '..#####..',
  ],
  heart: [
    '.##...##.',
    '####.####',
    '#########',
    '#########',
    '.#######.',
    '..#####..',
    '...###...',
    '....#....',
    '.........',
  ],
};

/** One suit as crisp pixel art (an SVG, so it stays sharp at any size). */
export function Suit({ suit, className = '' }: { suit: SuitName; className?: string }) {
  const rects: string[] = [];
  GRIDS[suit].forEach((row, y) => [...row].forEach((c, x) => c === '#' && rects.push(`M${x} ${y}h1v1h-1z`)));
  return (
    <svg className={`suit ${className}`} viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
      <path d={rects.join('')} fill="currentColor" />
    </svg>
  );
}
