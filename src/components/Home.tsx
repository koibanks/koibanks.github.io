import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { TIMING as T } from '../config';
import type { Project } from '../data/projects';
import { hrefFor } from '../hooks/useHashRoute';
import { movable } from '../lib/design';
import { flipFromRemembered, rememberFolder } from '../lib/flip';
import { behindOf, folderVars, homeImage } from '../lib/folders';
import { Cover } from './Cover';
import { et, getSite, ui } from '../lib/text';

interface Props {
  projects: Project[];
  index: number;
  active: boolean;
  reduced: boolean;
  onSelect: (i: number) => void;
}

const num = (i: number) => String(i + 1).padStart(2, '0');

/**
 * Split index: a big 3D folder on the left (the other files wait behind it;
 * click a tab to switch). Text sits in the right-hand corners: the counter top
 * right, the title block bottom right. Click the folder to open the project.
 */
export function Home({ projects, index, active, reduced, onSelect }: Props) {
  const root = useRef<HTMLElement>(null);
  const folders = useRef<HTMLAnchorElement[]>([]);
  const details = useRef<HTMLDivElement[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const shown = useRef(-1);
  const wasActive = useRef(active);

  // Switch files: the current folder drops back down, the next is pulled up from below.
  useLayoutEffect(() => {
    const prev = shown.current;
    shown.current = index;
    const all = [...folders.current, ...details.current];
    const pair = (k: number) => [folders.current[k], details.current[k]];
    gsap.to(counter.current, {
      // yPercent is relative to the whole column (one number per file), so divide by the count.
      yPercent: (-100 * index) / projects.length,
      duration: prev === -1 || reduced ? 0 : 0.6,
      ease: `back.out(${T.overshoot})`,
    });
    if (prev === -1) {
      gsap.set(all, { autoAlpha: 0 });
      gsap.set(details.current[index], { autoAlpha: 1 });
      if (reduced) gsap.set(folders.current[index], { autoAlpha: 1 });
      // On load: pulled up from the bottom.
      else gsap.fromTo(folders.current[index], { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, duration: 1, delay: 0.15, ease: 'back.out(1.1)' });
      return;
    }
    if (prev === index) return;
    gsap.killTweensOf(all);
    if (reduced) {
      gsap.to(pair(prev), { autoAlpha: 0, duration: T.crossfade });
      gsap.to(pair(index), { autoAlpha: 1, duration: T.crossfade });
      return;
    }
    projects.forEach((_, k) => {
      if (k !== prev && k !== index) gsap.set(pair(k), { autoAlpha: 0 });
    });
    gsap.to(folders.current[prev], { yPercent: 115, duration: T.switchOut + 0.1, ease: 'power2.in' });
    gsap.set(folders.current[prev], { autoAlpha: 0, delay: T.switchOut + 0.1 });
    gsap.fromTo(
      folders.current[index],
      { yPercent: 115, rotation: 1.5, autoAlpha: 1 },
      { yPercent: 0, rotation: 0, duration: T.switchIn + 0.15, delay: 0.12, ease: `back.out(${T.overshoot - 0.2})` },
    );
    gsap.to(details.current[prev], { y: -16, autoAlpha: 0, duration: T.switchOut * 0.8, ease: 'power2.in' });
    gsap.fromTo(
      details.current[index],
      { y: 24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.55, delay: 0.2, ease: 'power3.out' },
    );
  }, [index, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Coming back from a project: morph its folder back into this one.
  useLayoutEffect(() => {
    const came = active && !wasActive.current;
    wasActive.current = active;
    if (!came) return;
    gsap.set(folders.current[index], { autoAlpha: 1, yPercent: 0, rotation: 0 });
    gsap.set(details.current[index], { autoAlpha: 1, y: 0 });
    const flipped = flipFromRemembered(folders.current[index], reduced);
    // Animate the contents, not the movable wrappers (that would override their saved position).
    gsap.from(root.current!.querySelectorAll('.home-count, .home-detail:not([aria-hidden="true"])'), {
      opacity: 0,
      y: reduced ? 0 : 16,
      duration: 0.4,
      stagger: 0.05,
      delay: flipped ? 0.35 : 0,
    });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main ref={root} id="main" className={`home${active ? '' : ' is-hidden'}`} inert={!active} aria-hidden={!active || undefined}>
      <h1 className="visually-hidden">
        {getSite().name}, {getSite().role}: selected work
      </h1>

      {/* Left: the work, in its folder, rising from the bottom */}
      <section className="home-media" aria-label="Current file">
        <div className="home-stage" {...movable('split.work', 'The work')}>
          <div className="hstack">
            {/* The other files, stacked behind. Click a tab to switch to it. */}
            <nav className="hstack-nav" aria-label="Other files">
              {behindOf(index, projects.length)
                .map((k, d) => ({ k, depth: d + 1 }))
                .reverse()
                .map(({ k, depth }) => (
                  <div
                    key={projects[k].id}
                    role="button"
                    tabIndex={0}
                    className="folder folder--behind"
                    style={folderVars(projects[k], k, depth)}
                    onClick={() => onSelect(k)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).isContentEditable) {
                        e.preventDefault();
                        onSelect(k);
                      }
                    }}
                    aria-label={`Show ${projects[k].title}`}
                  >
                    <span className="ftab" aria-hidden="true" {...et(`p.${projects[k].id}.title`)}>
                      {projects[k].title}
                    </span>
                  </div>
                ))}
            </nav>

            {/* The current file, in front (one per project so they can animate between each other) */}
            {projects.map((p, k) => (
              <a
                key={p.id}
                ref={(el) => {
                  if (el) folders.current[k] = el;
                }}
                className="folder folder--front hfolder"
                href={hrefFor.project(p.id)}
                style={folderVars(p, k)}
                tabIndex={k === index ? 0 : -1}
                aria-hidden={k !== index}
                aria-label={`Open ${p.title}`}
                data-home-focus={k === index || undefined}
                onClick={() => rememberFolder(folders.current[k])}
              >
                <span className="ftab" {...et(`p.${p.id}.title`)}>
                  {p.title}
                </span>
                {/* The work, sitting inside the folder */}
                <span className="folder-sheet hfolder-sheet">
                  <Cover art={homeImage(p)} decorative className="hfolder-img" eager={k === index} slot={`cover:${p.id}`} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Right: counter and title */}
      <section className="home-info">
        <div className="home-top" {...movable('split.index', 'Counter')}>
          <div className="home-count" aria-hidden="true">
            <span ref={counter} className="home-count-col">
              {projects.map((p, k) => (
                <span key={p.id}>{num(k)}</span>
              ))}
            </span>
          </div>
        </div>

        <div className="home-bottom" {...movable('split.title', 'Title block')}>
          <div className="home-details">
            {projects.map((p, k) => (
              <div
                key={p.id}
                ref={(el) => {
                  if (el) details.current[k] = el;
                }}
                className="home-detail"
                aria-hidden={k !== index}
              >
                <h2 className="home-title" {...et(`p.${p.id}.title`)}>
                  {p.title}
                </h2>
                <p className="home-desc" {...et(`p.${p.id}.description`, true)}>
                  {p.description}
                </p>
                <p className="home-tags">
                  <span>
                    [ <span {...et(`p.${p.id}.category`)}>{p.category}</span> ]
                  </span>
                  <span>
                    [ <span {...et(`p.${p.id}.year`)}>{p.yearLabel ?? p.year}</span> ]
                  </span>
                  <span>
                    [ <span {...et(`p.${p.id}.role`)}>{p.role}</span> ]
                  </span>
                  {p.standIn && (
                    <span className="home-standin">
                      [ <span {...et('ui.standin')}>{ui('standin', 'Stand-in')}</span> ]
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="visually-hidden" aria-live="polite">
        {active ? `File ${index + 1} of ${projects.length}: ${projects[index].title}` : ''}
      </p>
    </main>
  );
}
