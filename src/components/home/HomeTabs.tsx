import { useRef, type CSSProperties } from 'react';
import { hrefFor } from '../../hooks/useHashRoute';
import { rememberFolder } from '../../lib/flip';
import { folderColor, homeImage, tabLeft } from '../../lib/folders';
import { Cover } from '../Cover';
import { HomeCaption, HomeLive, num, useReturnFlip, type HomeProps } from './shared';
import '../../home-variants.css';
import { movable } from '../../lib/design';
import { getSite } from '../../lib/text';

/**
 * Tab index: full-width folders stacked up the bottom of the screen with big
 * tabs (like the inspo photos). The current file's work rises out of its folder.
 */
export function HomeTabs({ projects, index, active, reduced, onSelect }: HomeProps) {
  const sheets = useRef<HTMLAnchorElement[]>([]);
  useReturnFlip(active, reduced, () => sheets.current[index]);
  const open = () => rememberFolder(sheets.current[index]);

  return (
    <main id="main" className={`htabs${active ? '' : ' is-hidden'}`} inert={!active} aria-hidden={!active || undefined}>
      <h1 className="visually-hidden">
        {getSite().name}, {getSite().role}: selected work
      </h1>
      <HomeCaption projects={projects} index={index} className="htabs-cap" editId="tabs.caption" />

      <nav className="htabs-stack" aria-label="Projects" {...movable('tabs.stack', 'Folder stack', { '--n': projects.length } as CSSProperties)}>
        {projects.map((p, k) => {
          const current = k === index;
          const style = { '--k': k, '--folder': folderColor(p), '--tab-x': `${tabLeft(k)}%` } as CSSProperties;
          return (
            <div key={p.id} className={`htabs-file${current ? ' is-current' : ''}`} style={style}>
              {/* The work, tucked into its folder; slides up when current */}
              <a
                ref={(el) => {
                  if (el) sheets.current[k] = el;
                }}
                className="htabs-sheet"
                href={hrefFor.project(p.id)}
                tabIndex={current ? 0 : -1}
                aria-hidden={!current}
                aria-label={`Open ${p.title}`}
                onClick={open}
              >
                <Cover art={homeImage(p)} decorative className="htabs-img" slot={`cover:${p.id}`} />
              </a>
              <div className="folder htabs-folder">
                <button
                  type="button"
                  className="ftab htabs-tab"
                  aria-current={current ? 'true' : undefined}
                  data-home-focus={current || undefined}
                  onClick={() => onSelect(k)}
                >
                  <span className="htabs-tab-n">N.{num(k)}</span> {p.title}
                </button>
              </div>
            </div>
          );
        })}
      </nav>
      <HomeLive projects={projects} index={index} active={active} />
    </main>
  );
}
