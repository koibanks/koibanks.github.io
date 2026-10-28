import { useEffect, useRef } from 'react';
import { INPUT } from '../config';

interface Options {
  enabled: boolean;
  /** Called with +1 / -1. Return false if the step was not taken. */
  onStep: (dir: 1 | -1, source: 'wheel' | 'touch' | 'key') => void;
  onJump: (to: 'first' | 'last') => void;
}

/**
 * One project per wheel gesture / swipe / key press.
 *
 * Trackpads keep firing wheel events after the fingers lift ("momentum").
 * Those events decay in size, so after the lock expires we only accept
 * a new step if (a) there was a pause, or (b) the delta is growing again,
 * or (c) it looks like a mouse notch (large and constant).
 */
export function useStepNavigation({ enabled, onStep, onJump }: Options) {
  const cb = useRef({ onStep, onJump });
  cb.current = { onStep, onJump };

  useEffect(() => {
    if (!enabled) return;
    let lockedUntil = 0;
    let lastTime = 0;
    let lastAbs = 0;
    let acc = 0;

    const step = (dir: 1 | -1, source: 'wheel' | 'touch' | 'key') => {
      lockedUntil = performance.now() + INPUT.lockMs;
      acc = 0;
      cb.current.onStep(dir, source);
    };

    // Ignore input aimed at the Design panel (or anything marked data-no-nav).
    const skip = (e: Event) => !!(e.target as Element | null)?.closest?.('[data-no-nav]');

    const onWheel = (e: WheelEvent) => {
      if (skip(e)) return;
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const px = e.deltaMode === 1 ? delta * 16 : e.deltaMode === 2 ? delta * 400 : delta;
      const abs = Math.abs(px);
      const now = performance.now();
      const gap = now - lastTime;
      const newGesture = gap > INPUT.gestureGapMs || abs > lastAbs * 1.2 + 1 || (abs >= 50 && abs === lastAbs);
      lastTime = now;
      lastAbs = abs;
      if (now < lockedUntil) return;
      if (gap > INPUT.gestureGapMs) acc = 0;
      if (!newGesture && acc === 0) return; // momentum tail
      acc += px;
      if (Math.abs(acc) >= INPUT.wheelThreshold) step(acc > 0 ? 1 : -1, 'wheel');
    };

    let sx = 0;
    let sy = 0;
    let tracking = false;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || skip(e)) return;
      tracking = true;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      // Keep the page from rubber-banding while swiping between projects.
      if (tracking && e.cancelable) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      const d = horizontal ? dx : dy;
      if (Math.abs(d) < INPUT.swipeMin || performance.now() < lockedUntil) return;
      // swipe left / swipe up → next
      step(d < 0 ? 1 : -1, 'touch');
    };

    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.lightbox, .mailslot')) return; // an overlay is open: its keys come first
      if (e.altKey || e.ctrlKey || e.metaKey || skip(e)) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const next = ['ArrowDown', 'ArrowRight', 'PageDown'];
      const prev = ['ArrowUp', 'ArrowLeft', 'PageUp'];
      if (next.includes(e.key) || prev.includes(e.key)) {
        e.preventDefault();
        if (e.repeat && performance.now() < lockedUntil) return;
        // Keys get a shorter lock so holding/tapping feels responsive.
        lockedUntil = 0;
        step(next.includes(e.key) ? 1 : -1, 'key');
        lockedUntil = performance.now() + 180;
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        cb.current.onJump(e.key === 'Home' ? 'first' : 'last');
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled]);
}
