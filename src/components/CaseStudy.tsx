import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Project } from '../data/projects';
import { hrefFor } from '../hooks/useHashRoute';
import { flipFromRemembered, rememberFolder } from '../lib/flip';
import { behindOf, folderColor, folderVars } from '../lib/folders';
import { Report } from './Report';
import '../case.css';
import { et, ui } from '../lib/text';

interface Props {
  projects: Project[];
  index: number;
  reduced: boolean;
  onBack: () => void;
}

const num = (i: number) => String(i + 1).padStart(2, '0');

/**
 * Project page: the work, big, in the center. The project's sheet pops up out
 * of its folder; the other files sit in folders stacked behind it — click a
 * tab to switch.
 */
export function CaseStudy({ projects, index, reduced, onBack }: Props) {
  const p = projects[index];
  // The other files, in order after this one (so the next file is right behind).
  const behind = behindOf(index, projects.length);
  const next = behind[0];
  const root = useRef<HTMLElement>(null);
  const folder = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    el.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
    const q = gsap.utils.selector(el);
    const flipped = flipFromRemembered(folder.current, reduced);
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.from(el, { opacity: 0, duration: 0.3 });
        return;
      }
      const t0 = flipped ? 0.45 : 0.1;
      if (!flipped) gsap.from(folder.current, { y: 60, opacity: 0, duration: 0.6, ease: 'power3.out' });
      // The work rises up into place inside the folder.
      gsap.from(q('.pfolder-sheet'), { y: 70, duration: 0.75, delay: t0, ease: 'back.out(1.5)' });
      gsap.from(q('.folder--behind'), { y: 40, opacity: 0, duration: 0.5, delay: t0, stagger: 0.08, ease: 'power3.out' });
      gsap.from(q('.case-nextbig'), { opacity: 0, duration: 0.4, delay: t0 + 0.3 });
    }, el);
    return () => ctx.revert();
  }, [p.id, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = () => {
    rememberFolder(folder.current);
    onBack();
  };

  return (
    <article
      ref={root}
      className="case"
      style={{ ['--accent' as string]: p.accent, ['--folder' as string]: folderColor(p) }}
      aria-labelledby="case-title"
    >
      <h1 id="case-title" ref={heading} tabIndex={-1} className="visually-hidden">
        {p.title}: {p.description}
      </h1>

      <div className="case-wrap">
        {/* Home tab: a folder tab poking out of the left edge. (A div with button behaviour so its label can be edited in place.) */}
        <div
          role="button"
          tabIndex={0}
          className="case-back"
          onClick={back}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).isContentEditable) {
              e.preventDefault();
              back();
            }
          }}
          aria-label={`Back to ${ui('home', 'home')}`}
        >
          <span>
            <span aria-hidden="true">⟵</span>
            <span {...et('ui.home')}>{ui('home', 'home')}</span>
          </span>
        </div>

        <div className="pstack">
          {/* Other files, stacked straight up behind. Furthest first so DOM order matches the stacking. */}
          {behind
            .map((k, d) => ({ k, depth: d + 1 }))
            .reverse()
            .map(({ k, depth }) => (
              <a
                key={projects[k].id}
                href={hrefFor.project(projects[k].id)}
                className="folder folder--behind"
                style={folderVars(projects[k], k, depth)}
                aria-label={`Open file N.${num(k)}, ${projects[k].title}`}
              >
                <span className="ftab" {...et(`p.${projects[k].id}.title`)}>
                  {projects[k].title}
                </span>
              </a>
            ))}

          {/* This file, in front, with the work inside */}
          <div ref={folder} className="folder folder--front pfolder" style={folderVars(p, index)}>
            <span className="ftab" aria-hidden="true" {...et(`p.${p.id}.title`)}>
              {p.title}
            </span>
            <div className="folder-sheet pfolder-sheet">
              <Report project={p} number={index + 1} />
            </div>
          </div>
        </div>

        <a className="case-nextbig" href={hrefFor.project(projects[next].id)}>
          <span className="cn-k">
            <span {...et('ui.next')}>{ui('next', 'Next file')}</span> — N.{num(next)}
          </span>
          <span className="cn-t">
            <span {...et(`p.${projects[next].id}.title`)}>{projects[next].title}</span> <span aria-hidden="true">⟶</span>
          </span>
        </a>
      </div>
    </article>
  );
}
