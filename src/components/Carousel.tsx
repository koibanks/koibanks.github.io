import { useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import type { CoverArt } from '../data/art';
import { getDesign } from '../lib/design';
import { Cover } from './Cover';

/**
 * A photo essay: one photo at a time, sliding slowly to the next on its own.
 * Swipe it (touch, trackpad) or drag it with the mouse; arrow keys work when
 * it has focus. It pauses while you're on it, when it's off screen, and never
 * moves by itself for people who prefer reduced motion.
 */
export function Carousel({
  images,
  label,
  interval = 4200,
  slots,
  extra,
}: {
  images: CoverArt[];
  label: string;
  interval?: number;
  /** Replaceable slot id per photo (Edit images). */
  slots: (string | undefined)[];
  /** Slot id of the list photos were added to, so they can be removed (Edit images). */
  extra?: { slot: string; from: number };
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const n = images.length;

  // Which photo is showing (follows swipes and drags too).
  useEffect(() => {
    const t = track.current!;
    const onScroll = () => setIndex(Math.round(t.scrollLeft / Math.max(1, t.clientWidth)));
    t.addEventListener('scroll', onScroll, { passive: true });
    return () => t.removeEventListener('scroll', onScroll);
  }, []);

  const go = (i: number, slow = false) => {
    const t = track.current;
    if (!t || n === 0) return;
    const to = ((i % n) + n) % n;
    t.style.scrollSnapType = 'none'; // snapping would fight the slide
    gsap.to(t, {
      scrollLeft: to * t.clientWidth,
      duration: slow ? 1.4 : 0.6,
      ease: 'power2.inOut',
      overwrite: true,
      onComplete: () => void (t.style.scrollSnapType = ''),
    });
  };

  // Slide on its own, slowly.
  useEffect(() => {
    const t = track.current!;
    if (n < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let held = false; // pointer on it, focus in it, or mid-drag
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(t);
    const hold = () => (held = true);
    const release = () => (held = false);
    t.addEventListener('pointerenter', hold);
    t.addEventListener('pointerleave', release);
    t.addEventListener('focusin', hold);
    t.addEventListener('focusout', release);
    const id = window.setInterval(() => {
      if (held || !visible || document.hidden || document.body.classList.contains('is-imaging')) return;
      go(Math.round(t.scrollLeft / t.clientWidth) + 1, true);
    }, interval);
    return () => {
      clearInterval(id);
      io.disconnect();
      t.removeEventListener('pointerenter', hold);
      t.removeEventListener('pointerleave', release);
      t.removeEventListener('focusin', hold);
      t.removeEventListener('focusout', release);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, interval]);

  // Drag with the mouse (touch and trackpads swipe natively).
  useEffect(() => {
    const t = track.current!;
    let start: { x: number; left: number } | null = null;
    let moved = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || document.body.classList.contains('is-imaging')) return;
      gsap.killTweensOf(t);
      start = { x: e.clientX, left: t.scrollLeft };
      moved = false;
      t.style.scrollSnapType = 'none';
      t.classList.add('is-dragging');
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      if (Math.abs(dx) > 4) moved = true;
      t.scrollLeft = start.left - dx;
    };
    const up = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const from = Math.round(start.left / t.clientWidth);
      start = null;
      t.classList.remove('is-dragging');
      // A short flick is enough to move one photo.
      go(Math.abs(dx) > t.clientWidth * 0.12 ? from - Math.sign(dx) : from);
    };
    const click = (e: MouseEvent) => moved && (e.preventDefault(), e.stopPropagation());
    t.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    t.addEventListener('click', click, true);
    return () => {
      t.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      t.removeEventListener('click', click, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div className="hv-carousel" role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        className="hv-track"
        tabIndex={0}
        aria-label={`${label}: photo ${index + 1} of ${n}. Use the arrow keys to move.`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') (e.preventDefault(), e.stopPropagation(), go(index + 1));
          if (e.key === 'ArrowLeft') (e.preventDefault(), e.stopPropagation(), go(index - 1));
        }}
      >
        {images.map((img, j) => {
          const file = img.kind === 'css' ? '' : img.src;
          const rot = getDesign().rotate[file] ?? 0;
          return (
          <figure key={j} className="hv-slide" aria-label={`${j + 1} of ${n}`}>
            {/* Turned a quarter at a time (Edit images → rotate) */}
            <div className="hv-rot" data-rot={rot} style={{ '--rot': `${rot}deg` } as CSSProperties}>
              <Cover art={img} className="hv-photo" slot={slots[j]} eager={j === 0} />
            </div>
            {extra && file && (
              <button type="button" className="hv-rotate" data-slot-rotate={file} aria-label="Rotate this photo">
                ⟳ rotate
              </button>
            )}
            {extra && j >= extra.from && (
              <button type="button" className="hv-remove" data-slot-remove={`${extra.slot}|${j - extra.from}`} aria-label="Remove this photo">
                ×
              </button>
            )}
          </figure>
          );
        })}
      </div>
      {/* Photo counter only, like the Figma carousel (no dots or arrows) */}
      {n > 1 && (
        <p className="hv-counter" aria-hidden="true">
          {index + 1} / {n}
        </p>
      )}
      {extra && (
        <button type="button" className="hv-add" data-slot-add={extra.slot}>
          + add photos <span>(or drop them anywhere on the essay)</span>
        </button>
      )}
    </div>
  );
}
