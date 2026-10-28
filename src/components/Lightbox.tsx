import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Pictures on the sheet that open full screen when clicked. */
const SELECTOR = '.report img';
/** …except these: Elvis dances when clicked, title art and icons aren't photos. */
const SKIP = '.hv-hero, .rb-title-art, .suit';

type Shot = { src: string; alt: string; rot: number };

const shotOf = (img: HTMLImageElement): Shot => ({
  src: img.currentSrc || img.src,
  alt: img.alt,
  rot: Number(img.closest<HTMLElement>('.hv-rot')?.dataset.rot ?? 0),
});

const editing = () => /\bis-(imaging|texting|moving)\b/.test(document.body.className);

/**
 * Click any picture on a project sheet to see it full screen. Arrow keys (or
 * the side buttons) step through the sheet's pictures; Esc, the ×, or a click
 * on the dark backdrop closes it.
 */
export function Lightbox() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [at, setAt] = useState(-1);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const open = at >= 0;

  // Open on click (unless you were dragging, or editing in the Design panel).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || editing()) return;
      const img = (e.target as Element).closest<HTMLImageElement>(SELECTOR);
      if (!img || img.closest(SKIP) || img.closest('a')) return;
      const all = [...document.querySelectorAll<HTMLImageElement>(SELECTOR)].filter((i) => !i.closest(SKIP) && !i.closest('a'));
      returnTo.current = img;
      setShots(all.map(shotOf));
      setAt(Math.max(0, all.indexOf(img)));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Keys, scroll lock and focus while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAt(-1);
      else if (e.key === 'ArrowRight') setAt((i) => (i + 1) % shots.length);
      else if (e.key === 'ArrowLeft') setAt((i) => (i - 1 + shots.length) % shots.length);
      else if (e.key === 'Tab') return; // let focus move between the buttons
      else return;
      e.preventDefault();
      e.stopPropagation(); // don't also go "home" or switch projects
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.documentElement.style.overflow = prevOverflow;
      returnTo.current?.focus?.({ preventScroll: true });
    };
  }, [open, shots.length]);

  if (!open || !shots[at]) return null;
  const s = shots[at];
  const sideways = s.rot === 90 || s.rot === 270;
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={s.alt || 'Image'} onClick={(e) => e.target === e.currentTarget && setAt(-1)}>
      <img
        key={s.src}
        className={`lightbox-img${sideways ? ' is-sideways' : ''}`}
        src={s.src}
        alt={s.alt}
        style={s.rot ? { rotate: `${s.rot}deg` } : undefined}
        onClick={() => setAt(-1)}
      />
      <button ref={closeBtn} type="button" className="lightbox-close" aria-label="Close" onClick={() => setAt(-1)}>
        ×
      </button>
      {shots.length > 1 && (
        <>
          <button type="button" className="lightbox-nav is-prev" aria-label="Previous image" onClick={() => setAt((at - 1 + shots.length) % shots.length)}>
            ‹
          </button>
          <button type="button" className="lightbox-nav is-next" aria-label="Next image" onClick={() => setAt((at + 1) % shots.length)}>
            ›
          </button>
          <p className="lightbox-count" aria-live="polite">
            {at + 1} / {shots.length}
          </p>
        </>
      )}
    </div>,
    document.body,
  );
}
