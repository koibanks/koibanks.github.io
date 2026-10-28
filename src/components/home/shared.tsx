import { useLayoutEffect, useRef } from 'react';
import type { Project } from '../../data/projects';
import { flipFromRemembered } from '../../lib/flip';
import { movable } from '../../lib/design';
import { et, ui } from '../../lib/text';

/** Props every front-page layout takes. */
export interface HomeProps {
  projects: Project[];
  index: number;
  active: boolean;
  reduced: boolean;
  onSelect: (i: number) => void;
}

export const num = (i: number) => String(i + 1).padStart(2, '0');

/** Title, one-liner and notes for the current project. Swaps with a fade-up. */
export function HomeCaption({
  projects,
  index,
  className = '',
  editId,
}: {
  projects: Project[];
  index: number;
  className?: string;
  /** Id for "Move things" mode, e.g. 'tabs.caption'. */
  editId: string;
}) {
  const p = projects[index];
  return (
    <div className={`hcap ${className}`} {...movable(editId, 'Title block')}>
      <div className="hcap-in" key={p.id}>
        <p className="hcap-n">
          ( N.{num(index)} ) <span>— {num(index)} / {num(projects.length - 1)}</span>
        </p>
        <h2 className="hcap-title" {...et(`p.${p.id}.title`)}>
          {p.title}
        </h2>
        <p className="hcap-desc" {...et(`p.${p.id}.description`, true)}>
          {p.description}
        </p>
        <p className="home-tags">
          <span>
            [ <span {...et(`p.${p.id}.category`)}>{p.category}</span> ]
          </span>
          <span>
            [ <span {...et(`p.${p.id}.year`)}>{p.yearLabel ?? p.year}</span> ]
          </span>
          {p.standIn && (
            <span className="home-standin">
              [ <span {...et('ui.standin')}>{ui('standin', 'Stand-in')}</span> ]
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/** Coming back from a project page: morph its folder into `target`. */
export function useReturnFlip(active: boolean, reduced: boolean, target: () => HTMLElement | null | undefined) {
  const was = useRef(active);
  useLayoutEffect(() => {
    const came = active && !was.current;
    was.current = active;
    if (came) flipFromRemembered(target() ?? null, reduced);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Screen-reader announcement of the current file. */
export function HomeLive({ projects, index, active }: { projects: Project[]; index: number; active: boolean }) {
  return (
    <p className="visually-hidden" aria-live="polite">
      {active ? `File ${index + 1} of ${projects.length}: ${projects[index].title}` : ''}
    </p>
  );
}
