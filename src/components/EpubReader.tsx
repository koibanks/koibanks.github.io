import { useEffect, useRef, useState } from 'react';

type Rendition = {
  display: (target?: string) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  on: (ev: string, cb: (loc: { start: { displayed: { page: number; total: number } }; atEnd?: boolean; atStart?: boolean }) => void) => void;
  destroy: () => void;
};

/**
 * An EPUB you can page through right on the project page. The reader
 * (epub.js) only downloads once you scroll near it.
 */
export function EpubReader({ src, title }: { src: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const rendition = useRef<Rendition | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [page, setPage] = useState('');

  useEffect(() => {
    const el = box.current!;
    let cancelled = false;
    let book: { destroy: () => void } | null = null;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setState('loading');
        try {
          const { default: ePub } = await import('epubjs');
          if (cancelled) return;
          const b = ePub(src);
          book = b;
          const r = b.renderTo(host.current!, { width: '100%', height: '100%', flow: 'paginated', spread: 'auto' }) as unknown as Rendition;
          rendition.current = r;
          r.on('relocated', (loc) => {
            const d = loc.start.displayed;
            setPage(d.total ? `${d.page} / ${d.total}` : '');
          });
          await r.display();
          if (!cancelled) setState('ready');
        } catch {
          if (!cancelled) setState('error');
        }
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      rendition.current?.destroy();
      rendition.current = null;
      book?.destroy();
    };
  }, [src]);

  return (
    <div
      ref={box}
      className="hv-epub"
      role="region"
      aria-label={title}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') (e.preventDefault(), e.stopPropagation(), void rendition.current?.next());
        if (e.key === 'ArrowLeft') (e.preventDefault(), e.stopPropagation(), void rendition.current?.prev());
      }}
    >
      <div ref={host} className="hv-epub-page" />
      {state !== 'ready' && (
        <p className="hv-epub-status">{state === 'error' ? "This EPUB couldn't be opened." : 'Opening the book…'}</p>
      )}
      <div className="hv-epub-bar">
        <button type="button" onClick={() => void rendition.current?.prev()} aria-label="Previous page" disabled={state !== 'ready'}>
          ←
        </button>
        <span aria-live="polite">{page}</span>
        <button type="button" onClick={() => void rendition.current?.next()} aria-label="Next page" disabled={state !== 'ready'}>
          →
        </button>
        <a href={src} download>
          download
        </a>
      </div>
    </div>
  );
}
