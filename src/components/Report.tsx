import type { CSSProperties } from 'react';
import { artFromSrc, type CoverArt } from '../data/art';
import type { Project, ReportBlock, StageItem } from '../data/projects';
import { getDesign } from '../lib/design';
import { lazy, Suspense, useState } from 'react';
import { Carousel } from './Carousel';
import { Cover, HoverVideo } from './Cover';
import { Flipbook } from './Flipbook';
import { Suit } from './Suit';

// The EPUB reader (and epub.js) only load on pages that have one.
const EpubReader = lazy(() => import('./EpubReader').then((m) => ({ default: m.EpubReader })));

/**
 * The project sheet: one long page, block after block, exactly like the slide
 * it came from. Not editable on purpose. Images can be swapped for full-quality
 * files in the Design panel ("Project images"); slots are numbered by block.
 */
export function Report({ project: p, number }: { project: Project; number: number }) {
  const blocks = p.report ?? defaultReport(p, number);
  const { media, lists } = getDesign();
  // Your replacement file for an image slot, if you've set one.
  const pick = (slot: string, art: CoverArt): CoverArt => (media[slot] ? artFromSrc(media[slot], art.alt) : art);
  const style = {
    background: p.reportBackground ?? '#fdfcf8',
    ...(p.reportFont ? { fontFamily: p.reportFont } : {}),
    ...(p.font ? { '--pfont': `"${p.font.family}", var(--font)` } : {}),
  } as CSSProperties;
  return (
    <div className="report" style={style}>
      {p.reportFontHref && <link rel="stylesheet" href={p.reportFontHref} />}
      {p.font && (
        <style>{`@font-face{font-family:"${p.font.family}";src:url("${p.font.src}");font-display:swap}`}</style>
      )}
      {blocks.map((b, i) => {
        const block = <Block key={i} block={b} hasFont={!!p.font} pick={(art, j) => pick(slotId(p, i, j), art)} slot={(j) => slotId(p, i, j)} extra={lists[slotId(p, i)] ?? []} media={media} />;
        // A block's own strip of background, when the slide changes colour behind it.
        return b.backdrop ? (
          <div key={i} className="rb-backdrop" style={{ background: b.backdrop }}>
            {block}
          </div>
        ) : (
          block
        );
      })}
    </div>
  );
}

/** Id of an image slot: "p.<project>.report.<block>" or ".<block>.<item>" for groups. */
export const slotId = (p: Project, block: number, item?: number | string) =>
  `p.${p.id}.report.${block}${item === undefined ? '' : `.${item}`}`;

const paras = (body: string) => body.split(/\n\s*\n/).map((t, j) => <p key={j}>{t}</p>);
const inset = (on?: boolean) => (on ? ' rb-inset' : '');

function Block({
  block: b,
  hasFont,
  pick,
  slot,
  extra,
  media,
}: {
  block: ReportBlock;
  hasFont: boolean;
  pick: (art: CoverArt, item?: number | string) => CoverArt;
  slot: (item?: number | string) => string;
  /** Photos added to this block's list (carousels). */
  extra: string[];
  media: Record<string, string>;
}) {
  switch (b.type) {
    case 'intro':
      return (
        <header className={`rb-intro${b.aside?.length ? '' : ' rb-intro--solo'}`}>
          <div className="rb-intro-text">
            <h2 className={`rb-title${hasFont && !b.titleArt ? ' rb-title--font' : ''}`} style={b.titleColor ? { color: b.titleColor } : undefined}>
              {b.titleArt ? <Cover art={pick(b.titleArt, 'title')} className="rb-title-art" slot={slot('title')} /> : b.title}
            </h2>
            {b.kicker && <p className="rb-kicker">{b.kicker}</p>}
            {b.date && <p className="rb-date">{b.date}</p>}
            <div className="rb-body">{paras(b.body)}</div>
          </div>
          {b.aside && b.aside.length > 0 && (
            <div className="rb-aside">
              {b.aside.map((img, j) => (
                <Cover key={j} art={pick(img, j)} className="rb-tile" slot={slot(j)} />
              ))}
            </div>
          )}
        </header>
      );
    case 'text':
      return (
        <section className="rb-text">
          {b.heading && <h3>{b.heading}</h3>}
          <div className="rb-body">{paras(b.body)}</div>
        </section>
      );
    case 'image':
      return (
        <div className={`rb-image${inset(b.inset)}`} data-hover-host style={b.space ? { marginTop: `${b.space}cqw` } : undefined}>
          <Cover art={pick(b.image)} className="rb-img" slot={slot()} />
        </div>
      );
    case 'images':
      return (
        <div className={`rb-images${inset(b.inset)}`} style={{ '--n': b.images.length } as CSSProperties}>
          {b.images.map((img, j) => (
            <Cover key={j} art={pick(img, j)} className="rb-img" slot={slot(j)} />
          ))}
        </div>
      );
    case 'video':
      return (
        <div className={`rb-video${inset(b.inset)}`} data-hover-host>
          <HoverVideo src={getDesign().media[slot()] ?? b.src} poster={b.poster} label={b.label} className="rb-img" slot={slot()} />
        </div>
      );
    case 'set':
      return (
        <div className={`rb-set-wrap${inset(b.inset)}`}>
          <p
            className="rb-set"
            style={{
              fontSize: `${b.size}cqw`,
              color: b.color,
              background: b.background,
              textAlign: b.align ?? 'left',
              padding: b.padding,
            }}
          >
            <span
              className={b.gradient ? 'rb-grad' : undefined}
              style={b.gradient ? { backgroundImage: b.gradient } : undefined}
              aria-label={b.label}
              role={b.label ? 'img' : undefined}
            >
              {b.text}
              {b.link && (
                <>
                  {'\n'}
                  <a href={b.link.href}>{b.link.text}</a>
                </>
              )}
            </span>
          </p>
        </div>
      );
    case 'columns':
      return (
        <div className={`rb-cols${inset(b.inset)}`} style={{ '--n': b.columns.length } as CSSProperties}>
          {b.columns.map((c, j) => (
            <div
              key={j}
              className="rb-col"
              style={{ fontSize: `${b.size}cqw`, color: c.color, background: c.background, textAlign: c.align }}
            >
              {paras(c.text)}
            </div>
          ))}
        </div>
      );
    case 'tester':
      // The type tester takes the grey square's place: same spot and size, no stroke, rounded.
      return (
        <div className="rb-tester-wrap">
          <textarea
            className="rb-tester"
            style={{ fontSize: `${b.size}cqw`, background: b.background ?? '#d9d9d9' }}
            placeholder={b.placeholder ?? 'Type to try the font…'}
            aria-label="Type to try the font"
            spellCheck={false}
          />
        </div>
      );
    case 'box':
      return (
        <div
          className={`rb-box${inset(b.inset)}`}
          style={{ height: b.height, background: b.color ?? '#d9d9d9' }}
          aria-hidden="true"
        />
      );
    case 'cover':
      return (
        <header className="hv-cover" style={{ height: `${b.height}cqw` }}>
          <div className="hv-bar" style={{ background: b.bar }} />
          {b.suitTop && <Suit suit={b.suitTop} className="hv-suit-top" />}
          <h2 className="hv-title">{b.title}</h2>
          <p className="hv-heading">{b.heading}</p>
          <p className="hv-date">{b.date}</p>
          <p className="hv-body">{b.body}</p>
          <Dancer art={pick(b.hero, 'hero')} slot={slot('hero')} box={b.heroBox} />
          {b.suitBottom && <Suit suit={b.suitBottom} className="hv-suit-bottom" />}
          {b.label && <p className="hv-label hv-cover-label">{b.label}</p>}
        </header>
      );
    case 'label':
      return (
        <div className={`hv-row hv-row--${b.side}`} style={{ background: b.background }}>
          <span className="hv-suits">
            {b.suits.map((s, j) => (
              <Suit key={j} suit={s} />
            ))}
          </span>
          <p className="hv-label">{b.text}</p>
        </div>
      );
    case 'wide':
      return <Wide image={pick(b.image)} slot={slot()} width={b.width} hint={b.hint} />;
    case 'carousel': {
      const base = b.images.map((img, j) => pick(img, j));
      const added = extra.map((src, k) => artFromSrc(src, `Photo ${base.length + k + 1}`));
      return (
        <div className="hv-essay" style={{ background: b.background }}>
          <Carousel
            images={[...base, ...added]}
            label={b.label}
            interval={b.interval}
            slots={[...base.map((_, j) => slot(j)), ...added.map(() => undefined)]}
            extra={import.meta.env.DEV ? { slot: slot(), from: base.length } : undefined}
          />
        </div>
      );
    }
    case 'epub': {
      const src = media[slot()] ?? b.src;
      // Your own flipbook (unless you've dropped a different EPUB on it in Edit images).
      if (b.book && !media[slot()])
        return (
          <div className="hv-epub-wrap hv-epub-wrap--flip" style={{ background: b.background }} data-slot={slot()}>
            <Flipbook src={b.book} epub={b.src} title={b.title} />
          </div>
        );
      return (
        <div className="hv-epub-wrap" style={{ background: b.background }}>
          {src ? (
            <Suspense fallback={<p className="hv-epub-empty">Opening the book…</p>}>
              <EpubReader src={src} title={b.title} />
            </Suspense>
          ) : (
            // Until there's a file: the placeholder from the design. Drop an .epub on it in Edit images.
            <p className="hv-epub-empty" data-slot={slot()}>
              {b.placeholder}
            </p>
          )}
        </div>
      );
    }
    case 'note':
      return (
        <div className="hv-note" style={{ background: b.background, color: b.color }}>
          <p>
            <span aria-hidden="true">★ </span>
            {b.text}
          </p>
        </div>
      );
    case 'stage':
      return (
        <div className="rb-stage" style={{ height: `${b.height}cqw`, background: b.background }}>
          {b.items.map((it, j) => (
            <StagePiece key={j} item={it} art={it.kind === 'image' ? pick(it.art, j) : undefined} slot={slot(j)} />
          ))}
        </div>
      );
    case 'bar':
      return <div className="rb-bar" style={{ height: `${b.height}cqw`, background: b.background }} aria-hidden="true" />;
    case 'embed':
      return <Embed src={media[slot()] ?? b.src} aspect={b.aspect} title={b.title} placeholder={b.placeholder} background={b.background} slot={slot()} />;
    case 'cta':
      return (
        <div className="rb-inset">
          <p className="rb-cta">
            {b.text} <a href={b.href}>{b.label}</a>
          </p>
        </div>
      );
  }
}

/** One piece of a 'stage' block, placed in % of the sheet width. */
function StagePiece({ item: it, art, slot }: { item: StageItem; art?: CoverArt; slot: string }) {
  const at = { left: `${it.x}cqw`, top: `${it.y}cqw` };
  if (it.kind === 'image')
    return (
      <div className={`rb-piece rb-piece--img${it.hover ? ` is-${it.hover}` : ''}`} style={{ ...at, width: `${it.w}cqw` }}>
        <Cover art={art ?? it.art} className="rb-piece-img" slot={slot} />
      </div>
    );
  if (it.kind === 'rule')
    return <div className="rb-piece" style={{ ...at, width: `${it.w}cqw`, height: `${it.h}cqw`, background: it.color }} aria-hidden="true" />;
  const Tag = it.as ?? 'p';
  return (
    <Tag
      className="rb-piece rb-piece--text"
      style={{
        ...at,
        fontSize: `${it.size}cqw`,
        fontFamily: it.font,
        fontWeight: it.weight,
        color: it.color,
        letterSpacing: it.tracking ? `${it.tracking}em` : undefined,
        ...(it.w ? { width: `${it.w}cqw`, whiteSpace: 'normal' as const } : {}),
        ...(it.lines ? { lineHeight: it.lines } : {}),
      }}
    >
      {typeof it.text === 'string'
        ? it.text
        : it.text.map((part, k) => (
            <span key={k} style={{ color: part.color, textDecoration: part.underline ? 'underline' : undefined }}>
              {part.t}
            </span>
          ))}
    </Tag>
  );
}

/**
 * A live website in the sheet (e.g. a published Figma Make). It only loads once
 * it scrolls near, and there's always a link to open it full size.
 */
function Embed({
  src,
  aspect,
  title,
  placeholder,
  background,
  slot,
}: {
  src?: string;
  aspect: number;
  title: string;
  placeholder: string;
  background?: string;
  slot: string;
}) {
  return (
    <div className="rb-embed" style={{ aspectRatio: String(aspect), background }}>
      {src ? (
        <>
          <iframe src={src} title={title} loading="lazy" allow="fullscreen; clipboard-write" referrerPolicy="no-referrer-when-downgrade" />
          <a className="rb-embed-open" href={src} target="_blank" rel="noreferrer">
            open full screen ↗
          </a>
        </>
      ) : (
        <p className="rb-embed-empty" data-slot={import.meta.env.DEV ? slot : undefined}>
          {placeholder}
        </p>
      )}
    </div>
  );
}

/** The cover cut-out: it flips back and forth like it's dancing while hovered (tap on touch screens). */
function Dancer({ art, slot, box }: { art: CoverArt; slot: string; box: { left: number; top: number; width: number } }) {
  const [on, setOn] = useState(false);
  return (
    <div
      className={`hv-hero${on ? ' is-dancing' : ''}`}
      style={{ left: `${box.left}cqw`, top: `${box.top}cqw`, width: `${box.width}cqw` }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOn(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOn(false)}
      onClick={() => setOn((v) => !v)}
    >
      <Cover art={art} className="hv-hero-img" slot={slot} eager />
    </div>
  );
}

/** Wider than the sheet: sticks out past the right edge and scrolls sideways (drag, swipe or shift-scroll). */
function Wide({ image, slot, width, hint }: { image: CoverArt; slot: string; width: number; hint?: string }) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <div
      className="hv-wide"
      tabIndex={0}
      role="region"
      aria-label={`${image.alt} (scrolls sideways)`}
      onScroll={(e) => !scrolled && e.currentTarget.scrollLeft > 8 && setScrolled(true)}
      // A drag shouldn't also count as a click (which would open the picture full screen).
      onClickCapture={(e) => e.currentTarget.dataset.dragged && (e.preventDefault(), delete e.currentTarget.dataset.dragged)}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse' || document.body.classList.contains('is-imaging')) return;
        const el = e.currentTarget;
        const x0 = e.clientX;
        const left = el.scrollLeft;
        el.classList.add('is-dragging');
        delete el.dataset.dragged;
        const move = (ev: PointerEvent) => {
          if (Math.abs(ev.clientX - x0) > 4) el.dataset.dragged = '1';
          el.scrollLeft = left - (ev.clientX - x0);
        };
        const up = () => {
          el.classList.remove('is-dragging');
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      }}
    >
      <div className="hv-wide-inner" style={{ width: `${width}cqw` }}>
        <Cover art={image} className="hv-wide-img" slot={slot} />
      </div>
      {hint && (
        <span className={`hv-hint${scrolled ? ' is-gone' : ''}`} aria-hidden="true">
          {hint}
        </span>
      )}
    </div>
  );
}

/** For projects without a hand-built report: title, cover, then each section. */
export function defaultReport(p: Project, number: number): ReportBlock[] {
  const blocks: ReportBlock[] = [
    {
      type: 'intro',
      title: p.title,
      titleArt: p.titleArt,
      kicker: `${p.category} — File No. ${String(number).padStart(2, '0')}`,
      date: p.yearLabel ?? String(p.year),
      body: p.description,
    },
    { type: 'image', image: p.cover },
  ];
  for (const s of p.sections ?? []) {
    blocks.push({ type: 'text', heading: s.heading, body: s.body ?? '' });
    const imgs = s.images ?? [];
    if (imgs.length === 1) blocks.push({ type: 'image', image: imgs[0], inset: true });
    if (imgs.length > 1) blocks.push({ type: 'images', images: imgs, inset: true });
  }
  return blocks;
}
