import gsap from 'gsap';
import { TIMING } from '../config';

/**
 * Hand-off between the home page and a project page: the folder you leave
 * records where it was on screen, and the folder you arrive at morphs from there.
 */
let from: DOMRect | null = null;

export function rememberFolder(el: Element | null) {
  from = el ? el.getBoundingClientRect() : null;
}

/** Animate `el` from the remembered rect to where it is now. Returns true if it ran. */
export function flipFromRemembered(el: HTMLElement | null, reduced: boolean): boolean {
  const start = from;
  from = null;
  if (!el || !start || reduced) return false;
  const end = el.getBoundingClientRect();
  if (!end.width) return false;
  gsap.fromTo(
    el,
    {
      x: start.left - end.left,
      y: start.top - end.top,
      scale: start.width / end.width,
      transformOrigin: '0 0',
    },
    { x: 0, y: 0, scale: 1, duration: TIMING.flip, ease: 'power3.inOut', clearProps: 'transform' },
  );
  return true;
}
