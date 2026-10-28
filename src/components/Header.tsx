import { useEffect, useRef, useState } from 'react';
import { hrefFor } from '../hooks/useHashRoute';
import { movable, useEditor } from '../lib/design';
import { et, getSite, ui } from '../lib/text';
import { MailslotIcon, MailslotPanel } from './Mailslot';

export function Header({ aboutActive }: { aboutActive: boolean }) {
  const site = getSite();
  const { editing, texting, imaging } = useEditor();
  const [peek, setPeek] = useState(false);
  const [mail, setMail] = useState(false); // the note panel (mail slot)
  const [left, setLeft] = useState(false); // open the card toward the side with room
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);

  // Hovering (or tabbing to) About slides a preview of the About card down.
  // A short grace period lets you move the pointer onto the card itself.
  const canPeek = !aboutActive && !editing && !texting && !imaging;
  const open = () => {
    clearTimeout(timer.current);
    if (!canPeek) return;
    const r = wrap.current?.getBoundingClientRect();
    if (r) setLeft(r.left + r.width / 2 < window.innerWidth / 2);
    setPeek(true);
  };
  const close = (delay = 180) => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeek(false), delay);
  };
  useEffect(() => {
    if (!canPeek) setPeek(false);
  }, [canPeek]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <header className="site-header">
      <a className="hd-name" href={hrefFor.cabinet} {...movable('header.name', 'Your name')}>
        <span {...et('site.name')}>{site.name}</span>
        <span className="hd-role" {...et('site.role')}>
          {site.role}
        </span>
      </a>
      <div
        ref={wrap}
        className="hd-about"
        {...movable('header.about', 'About link')}
        onPointerLeave={() => close()}
        onKeyDown={(e) => e.key === 'Escape' && peek && (e.stopPropagation(), setPeek(false))}
      >
        <a
          className="hd-link"
          href={aboutActive ? hrefFor.cabinet : hrefFor.about}
          aria-current={aboutActive ? 'page' : undefined}
          onClick={() => setPeek(false)}
          onPointerEnter={(e) => e.pointerType !== 'touch' && open()}
          onFocus={open}
          onBlur={() => close(0)}
        >
          {aboutActive ? <span {...et('ui.close')}>{ui('close', 'Close')}</span> : <span {...et('ui.about')}>{ui('about', 'About')}</span>}
        </a>
        <MailslotIcon onOpen={() => (setPeek(false), setMail(true))} />
        {!aboutActive && (
          // A preview of the About page; the link above is the way in, so screen readers skip this copy.
          <a className={`hd-peek${peek ? ' is-open' : ''}${left ? ' is-left' : ''}`} href={hrefFor.about} aria-hidden="true" tabIndex={-1} onClick={() => setPeek(false)}>
            <span className="hd-peek-k">{ui('aboutKicker', 'Index card')}</span>
            <span className="hd-peek-name">{site.name}</span>
            <span className="hd-peek-role">{site.role}</span>
            {site.about.map((t, i) => (
              <span key={i} className="hd-peek-p">
                {t}
              </span>
            ))}
            <span className="hd-peek-mail">{site.email}</span>
          </a>
        )}
      </div>
      {mail && <MailslotPanel onClose={() => setMail(false)} />}
    </header>
  );
}
