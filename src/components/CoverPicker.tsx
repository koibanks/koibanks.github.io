import { useEffect, useRef, useState } from 'react';
import { artFromSrc, type CoverArt } from '../data/art';
import type { Project, ReportBlock } from '../data/projects';
import { updateDesign, useDesign } from '../lib/design';
import { ACCEPT, isVideo, uploadMedia } from '../lib/upload';
import { Cover } from './Cover';
import { defaultReport, slotId } from './Report';

/** The images/videos in public/work (refreshable after uploads). */
function useMediaList() {
  const [list, setList] = useState<string[]>([]);
  const load = () =>
    fetch('/__images')
      .then((r) => r.json())
      .then((j: { images: string[] }) => setList(j.images.filter((f) => !/\.epub$/i.test(f))))
      .catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);
  return { list, load };
}

/**
 * One row: thumbnail, name, and a chooser (files already in the project,
 * "Default", or upload a new one from your computer).
 */
function MediaRow(props: {
  project: Project;
  title: string;
  current: CoverArt;
  chosen?: string;
  list: string[];
  onPick: (src: string | null) => void;
  reload: () => Promise<void>;
  setNote: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mine = props.list.filter((s) => s.startsWith(`work/${props.project.id}/`));
  const others = props.list.filter((s) => !s.startsWith(`work/${props.project.id}/`));

  const upload = async (file: File) => {
    props.setNote(`Uploading ${file.name}…`);
    try {
      const { src, note } = await uploadMedia(props.project.id, file);
      await props.reload();
      props.onPick(src);
      props.setNote(`Added ${src}${note ? ` (${note})` : ''}`);
    } catch {
      props.setNote('Upload failed (images, or .mp4/.webm/.mov video up to 120 MB).');
    }
  };

  return (
    <div className="cpick-row">
      <div className="cpick-head">
        <span className="cpick-thumb">
          <Cover art={props.current} decorative />
        </span>
        <span className="cpick-name">
          <strong>{props.title}</strong>
          <small>{props.chosen ? props.chosen.split('/').pop() : 'Default'}</small>
        </span>
        <button type="button" className="dp-link" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Change'}
        </button>
      </div>
      {open && (
        <div className="cpick-grid" role="listbox" aria-label={`Choose: ${props.title}`}>
          <button
            type="button"
            role="option"
            aria-selected={!props.chosen}
            className={`cpick-opt cpick-default${!props.chosen ? ' is-on' : ''}`}
            onClick={() => props.onPick(null)}
          >
            Default
          </button>
          {[...mine, ...others].map((src) => (
            <button
              key={src}
              type="button"
              role="option"
              aria-selected={props.chosen === src}
              className={`cpick-opt${props.chosen === src ? ' is-on' : ''}`}
              title={src}
              onClick={() => props.onPick(src)}
            >
              {isVideo(src) ? <video src={src} muted preload="metadata" /> : <img src={src} alt={src.split('/').pop()} loading="lazy" />}
            </button>
          ))}
          <button type="button" className="cpick-opt cpick-upload" onClick={() => input.current?.click()}>
            + Upload
          </button>
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Dev only: the image (or video) on each project's folder on the front page. */
export function CoverPicker({ projects }: { projects: Project[] }) {
  const d = useDesign();
  const { list, load } = useMediaList();
  const [note, setNote] = useState('');
  return (
    <div className="cpick">
      {projects.map((p) => {
        const chosen = d.covers[p.id];
        return (
          <MediaRow
            key={p.id}
            project={p}
            title={p.title}
            current={chosen ? artFromSrc(chosen, p.title) : (p.feature ?? p.cover)}
            chosen={chosen}
            list={list}
            reload={load}
            setNote={setNote}
            onPick={(src) =>
              updateDesign((x) => {
                if (src) x.covers[p.id] = src;
                else delete x.covers[p.id];
              })
            }
          />
        );
      })}
      {note && <p className="dp-note">{note}</p>}
    </div>
  );
}

/** Every image slot in a project's report, in page order. */
function slotsOf(p: Project, index: number): { slot: string; label: string; art: CoverArt }[] {
  const blocks: ReportBlock[] = p.report ?? defaultReport(p, index + 1);
  const out: { slot: string; label: string; art: CoverArt }[] = [];
  let n = 0;
  blocks.forEach((b, i) => {
    if (b.type === 'image') out.push({ slot: slotId(p, i), label: `Image ${++n}`, art: b.image });
    if (b.type === 'images') b.images.forEach((img, j) => out.push({ slot: slotId(p, i, j), label: `Image ${++n}`, art: img }));
    if (b.type === 'intro') b.aside?.forEach((img, j) => out.push({ slot: slotId(p, i, j), label: `Side image ${j + 1}`, art: img }));
  });
  return out;
}

/** Dev only: swap any image on a project page for a full-quality file (or a video). */
export function ProjectImages({ projects }: { projects: Project[] }) {
  const d = useDesign();
  const { list, load } = useMediaList();
  const [note, setNote] = useState('');
  const [which, setWhich] = useState(projects[0]?.id ?? '');
  const index = Math.max(0, projects.findIndex((p) => p.id === which));
  const p = projects[index];
  if (!p) return null;
  return (
    <div className="cpick">
      <label className="dp-row">
        <span>Project</span>
        <select className="dp-select" value={p.id} onChange={(e) => setWhich(e.target.value)}>
          {projects.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title}
            </option>
          ))}
        </select>
      </label>
      {slotsOf(p, index).map(({ slot, label, art }) => {
        const chosen = d.media[slot];
        return (
          <MediaRow
            key={slot}
            project={p}
            title={label}
            current={chosen ? artFromSrc(chosen, art.alt) : art}
            chosen={chosen}
            list={list}
            reload={load}
            setNote={setNote}
            onPick={(src) =>
              updateDesign((x) => {
                if (src) x.media[slot] = src;
                else delete x.media[slot];
              })
            }
          />
        );
      })}
      {note && <p className="dp-note">{note}</p>}
    </div>
  );
}
