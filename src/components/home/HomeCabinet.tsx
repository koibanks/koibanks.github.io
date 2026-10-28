import { useRef, type CSSProperties } from 'react';
import { hrefFor } from '../../hooks/useHashRoute';
import { rememberFolder } from '../../lib/flip';
import { folderColor, homeImage } from '../../lib/folders';
import { Cover } from '../Cover';
import { HomeCaption, HomeLive, num, useReturnFlip, type HomeProps } from './shared';
import '../../home-variants.css';
import { movable } from '../../lib/design';
import { getSite } from '../../lib/text';

/**
 * File cabinet: one drawer per project. The current drawer slides open and
 * its file rises out, big, above the cabinet.
 */
export function HomeCabinet({ projects, index, active, reduced, onSelect }: HomeProps) {
  const files = useRef<HTMLAnchorElement[]>([]);
  useReturnFlip(active, reduced, () => files.current[index]);
  const open = () => rememberFolder(files.current[index]);

  return (
    <main id="main" className={`hcab${active ? '' : ' is-hidden'}`} inert={!active} aria-hidden={!active || undefined}>
      <h1 className="visually-hidden">
        {getSite().name}, {getSite().role}: selected work
      </h1>
      <HomeCaption projects={projects} index={index} className="hcab-cap" editId="cabinet.caption" />

      <div className="hcab-stage" {...movable('cabinet.cabinet', 'Cabinet', { '--n': projects.length } as CSSProperties)}>
        {/* Files rising out of their drawers (each clipped at its drawer's opening) */}
        {projects.map((p, k) => {
          const current = k === index;
          return (
            <div
              key={p.id}
              className={`hcab-slot${current ? ' is-current' : ''}`}
              style={{ '--k': k, '--folder': folderColor(p) } as CSSProperties}
              aria-hidden={!current}
            >
              <a
                ref={(el) => {
                  if (el) files.current[k] = el;
                }}
                className="folder hcab-file"
                href={hrefFor.project(p.id)}
                tabIndex={current ? 0 : -1}
                aria-label={`Open ${p.title}`}
                onClick={open}
              >
                <span className="ftab">{p.title}</span>
                <span className="folder-sheet">
                  <Cover art={homeImage(p)} decorative className="hcab-img" slot={`cover:${p.id}`} />
                </span>
              </a>
            </div>
          );
        })}

        {/* The cabinet */}
        <nav className="hcab-body" aria-label="Projects">
          <span className="hcab-top" aria-hidden="true" />
          {projects.map((p, k) => {
            const current = k === index;
            return (
              <button
                key={p.id}
                type="button"
                className={`hcab-drawer${current ? ' is-open' : ''}`}
                style={{ '--k': k } as CSSProperties}
                aria-current={current ? 'true' : undefined}
                data-home-focus={current || undefined}
                onClick={() => onSelect(k)}
              >
                <span className="hcab-label">
                  <span className="hcab-card">
                    N.{num(k)} — {p.title}
                  </span>
                </span>
                <span className="hcab-handle" aria-hidden="true" />
              </button>
            );
          })}
          <span className="hcab-base" aria-hidden="true" />
        </nav>
      </div>
      <HomeLive projects={projects} index={index} active={active} />
    </main>
  );
}
