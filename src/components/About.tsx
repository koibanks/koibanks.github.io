import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { et, getSite, ui } from '../lib/text';

export function About({ reduced }: { reduced: boolean }) {
  const site = getSite();
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    root.current?.querySelector('h1')?.focus({ preventScroll: true });
    const t = gsap.from(root.current!.children, {
      opacity: 0,
      y: reduced ? 0 : 24,
      duration: reduced ? 0.25 : 0.5,
      ease: 'power3.out',
      stagger: 0.05,
    });
    return () => {
      t.revert();
    };
  }, [reduced]);
  return (
    <main ref={root} className="about" aria-labelledby="about-title">
      <p className="mono" {...et('ui.aboutKicker')}>
        {ui('aboutKicker', 'Index card')}
      </p>
      <h1 id="about-title" tabIndex={-1} {...et('site.name')}>
        {site.name}
      </h1>
      <p className="about-role" {...et('site.role')}>
        {site.role}
      </p>
      {site.about.map((t, i) => (
        <p key={i} {...et(`site.about.${i}`, true)}>
          {t}
        </p>
      ))}
      <p>
        <a href={`mailto:${site.email}`} {...et('site.email')}>
          {site.email}
        </a>
      </p>
    </main>
  );
}
