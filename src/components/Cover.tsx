import { useEffect, useRef } from 'react';
import type { CoverArt } from '../data/projects';

interface Props {
  art: CoverArt;
  className?: string;
  /** Decorative copies (e.g. inside folders) hide from screen readers. */
  decorative?: boolean;
  /** Load straight away (e.g. the first thing on screen) instead of lazily. */
  eager?: boolean;
  /** Replaceable slot id (Design panel → Edit images), e.g. "cover:polished". */
  slot?: string;
}

export function Cover({ art, className = '', decorative, eager, slot }: Props) {
  const slotProps = slot ? { 'data-slot': slot } : {};
  if (art.kind === 'image') {
    return (
      <img
        className={`cover cover--img ${className}`}
        src={art.src}
        alt={decorative ? '' : art.alt}
        style={{ objectFit: art.fit ?? 'cover', background: art.background }}
        draggable={false}
        {...slotProps}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchPriority: 'high' as const } : {})}
      />
    );
  }
  if (art.kind === 'video') {
    return <HoverVideo src={art.src} poster={art.poster} label={decorative ? undefined : art.alt} className={className} slot={slot} />;
  }
  return (
    <div
      className={`cover ${className}`}
      style={{ background: art.background, color: art.ink }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : art.alt}
      aria-hidden={decorative || undefined}
      {...slotProps}
    >
      {art.mark && <span className="cover-mark">{art.mark}</span>}
    </div>
  );
}

/**
 * A muted, looping video that plays while you hover over it (or over the
 * folder/link it sits in), and pauses when you leave. Only its first frame
 * loads until then. Tap toggles it on touch screens.
 */
export function HoverVideo({
  src,
  poster,
  label,
  className = '',
  slot,
}: {
  src: string;
  poster?: string;
  label?: string;
  className?: string;
  slot?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const host = (v.closest('a, button, .folder, [data-hover-host]') as HTMLElement | null) ?? v;
    const play = () => {
      v.preload = 'auto';
      void v.play().catch(() => {});
    };
    const pause = () => v.pause();
    const tap = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      if (v.paused) play();
      else pause();
    };
    host.addEventListener('pointerenter', play);
    host.addEventListener('pointerleave', pause);
    host.addEventListener('focusin', play);
    host.addEventListener('focusout', pause);
    v.addEventListener('pointerup', tap);
    return () => {
      host.removeEventListener('pointerenter', play);
      host.removeEventListener('pointerleave', pause);
      host.removeEventListener('focusin', play);
      host.removeEventListener('focusout', pause);
      v.removeEventListener('pointerup', tap);
    };
  }, [src]);
  return (
    <video
      ref={ref}
      className={`cover cover--video ${className}`}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...(slot ? { 'data-slot': slot } : {})}
    />
  );
}
