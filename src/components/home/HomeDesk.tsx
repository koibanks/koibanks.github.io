import { useRef, type CSSProperties } from 'react';
import { hrefFor } from '../../hooks/useHashRoute';
import { rememberFolder } from '../../lib/flip';
import { folderVars, homeImage } from '../../lib/folders';
import { Cover } from '../Cover';
import { HomeCaption, HomeLive, num, useReturnFlip, type HomeProps } from './shared';
import '../../home-variants.css';
import { movable } from '../../lib/design';
import { getSite } from '../../lib/text';

/**
 * Desk: folders laid out side by side on a dark desk. The current one sits in
 * the middle, big; the others wait at the edges. Scroll or click to slide.
 */
export function HomeDesk({ projects, index, active, reduced, onSelect }: HomeProps) {
  const folders = useRef<HTMLElement[]>([]);
  useReturnFlip(active, reduced, () => folders.current[index]);
  const open = () => rememberFolder(folders.current[index]);

  return (
    <main id="main" className={`hdesk${active ? '' : ' is-hidden'}`} inert={!active} aria-hidden={!active || undefined}>
      <h1 className="visually-hidden">
        {getSite().name}, {getSite().role}: selected work
      </h1>

      <div className="hdesk-track" {...movable('desk.folders', 'Folders')}>
        {projects.map((p, k) => {
          const o = k - index;
          const current = o === 0;
          const style = { ...folderVars(p, 0), '--o': o, '--abs': Math.abs(o) } as CSSProperties;
          const inner = (
            <>
              <span className="ftab">
                N.{num(k)} — {p.title}
              </span>
              <span className="folder-sheet">
                <Cover art={homeImage(p)} decorative className="hdesk-img" slot={`cover:${p.id}`} />
              </span>
            </>
          );
          return current ? (
            <a
              key={p.id}
              ref={(el) => {
                if (el) folders.current[k] = el;
              }}
              className="folder hdesk-folder is-current"
              style={style}
              href={hrefFor.project(p.id)}
              aria-label={`Open ${p.title}`}
              onClick={open}
            >
              {inner}
            </a>
          ) : (
            <button
              key={p.id}
              ref={(el) => {
                if (el) folders.current[k] = el;
              }}
              type="button"
              className="folder hdesk-folder"
              style={style}
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => onSelect(k)}
            >
              {inner}
            </button>
          );
        })}
      </div>

      <HomeCaption projects={projects} index={index} className="hdesk-cap" editId="desk.caption" />

      <nav className="hdesk-nav" aria-label="Projects" {...movable('desk.links', 'File links')}>
        {projects.map((p, k) => (
          <button
            key={p.id}
            type="button"
            className={`hdesk-dot${k === index ? ' is-active' : ''}`}
            aria-current={k === index ? 'true' : undefined}
            aria-label={`N.${num(k)} ${p.title}`}
            data-home-focus={k === index || undefined}
            onClick={() => onSelect(k)}
          >
            N.{num(k)}
          </button>
        ))}
      </nav>
      <HomeLive projects={projects} index={index} active={active} />
    </main>
  );
}
