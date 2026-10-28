import { useEffect, useRef, useState } from 'react';

/** The flipbook's own page size (from its viewport). */
const W = 1312;
const H = 872;

/**
 * Your EPUB's own flipbook (page curl, arrows, keys), running as-is in a frame
 * and scaled to fill the panel. Its dark "table" is made see-through so the
 * panel colour shows around the open magazine. Loads only when scrolled near.
 */
export function Flipbook({ src, epub, title }: { src: string; epub?: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onLoad = () => {
    const doc = frame.current?.contentDocument;
    if (!doc?.head) return;
    const s = doc.createElementNS('http://www.w3.org/1999/xhtml', 'style');
    s.textContent = 'html,body{background:transparent!important;background-image:none!important}';
    doc.head.appendChild(s);
  };

  return (
    <div ref={box} className="hv-flip">
      <iframe
        ref={frame}
        src={src}
        title={title}
        loading="lazy"
        width={W}
        height={H}
        onLoad={onLoad}
        style={{ transform: `scale(${scale})` }}
      />
      {epub && (
        <a className="hv-flip-dl" href={epub} download>
          download epub
        </a>
      )}
    </div>
  );
}
