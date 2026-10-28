import { useEffect, useState } from 'react';
import { customFonts, fontFileUrls } from '../data/fonts';
import type { Project } from '../data/projects';
import {
  FONTS,
  HOME_LAYOUTS,
  fontById,
  isDirty,
  resetDesign,
  resetPositions,
  saveDesign,
  setEditor,
  updateDesign,
  useDesign,
  useEditor,
  type Design,
  type HomeLayout,
} from '../lib/design';
import { CoverPicker, ProjectImages } from './CoverPicker';
import { MediaLayer } from './MediaLayer';
import { MoveLayer } from './MoveLayer';
import { TextLayer } from './TextLayer';
import '../design-panel.css';

/**
 * Dev-only panel for editing the design live. "Save" writes the settings to
 * src/data/design.json so they ship with the site. Not included in the build.
 */
export function DesignPanel({ projects }: { projects: Project[] }) {
  const d = useDesign();
  const { editing, selected, texting, imaging } = useEditor();
  const [open, setOpen] = useState(false);
  const sel = selected ? d.positions[selected] : undefined;
  const selLabel = selected ? document.querySelector<HTMLElement>(`[data-edit="${selected}"]`)?.dataset.editLabel ?? selected : '';
  const moved = Object.keys(d.positions).length;
  const missing = useMissingFonts();
  const [status, setStatus] = useState('');
  const dirty = isDirty();

  const set = (change: (d: Design) => void) => {
    setStatus('');
    updateDesign(change);
  };

  const save = async () => {
    setStatus('Saving…');
    setStatus((await saveDesign()) ? 'Saved to src/data/design.json' : 'Couldn’t save. Is npm run dev running?');
  };

  return (
    <>
    <MoveLayer />
    <TextLayer />
    <MediaLayer />
    <div className="dpanel" data-no-nav>
      <button
        type="button"
        className={`dpanel-toggle${dirty ? ' is-dirty' : ''}`}
        aria-expanded={open}
        aria-controls="dpanel-body"
        onClick={() => setOpen((o) => !o)}
      >
        Design{dirty ? ' •' : ''}
      </button>

      {open && (
        <section id="dpanel-body" className="dpanel-body" aria-label="Design settings">
          <fieldset>
            <legend>Front page</legend>
            {HOME_LAYOUTS.map((l) => (
              <label key={l.id} className="dp-radio">
                <input
                  type="radio"
                  name="dp-home"
                  value={l.id}
                  checked={d.home === l.id}
                  onChange={() => set((x) => void (x.home = l.id as HomeLayout))}
                />
                <span>
                  <strong>{l.label}</strong>
                  <small>{l.note}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Folder</legend>
            <Range label="Size" unit="vw" min={35} max={85} value={d.folder.size} onChange={(v) => set((x) => void (x.folder.size = v))} />
            <Range label="Left / right" unit="vw" min={-30} max={30} step={0.5} value={d.folder.x} onChange={(v) => set((x) => void (x.folder.x = v))} />
            <Range label="Up / down" unit="vh" min={-30} max={30} step={0.5} value={d.folder.y} onChange={(v) => set((x) => void (x.folder.y = v))} />
            <Range label="Lean back (3D)" unit="°" min={0} max={40} step={0.5} value={d.folder.lean} onChange={(v) => set((x) => void (x.folder.lean = v))} />
            <Range label="Turn (3D)" unit="°" min={-35} max={35} step={0.5} value={d.folder.turn} onChange={(v) => set((x) => void (x.folder.turn = v))} />
            <Range label="Tilt" unit="°" min={-15} max={15} step={0.5} value={d.folderTilt} onChange={(v) => set((x) => void (x.folderTilt = v))} />
            <Range label="Text margin" unit="vw" min={2} max={16} step={0.5} value={d.indent} onChange={(v) => set((x) => void (x.indent = v))} />
            <p className="dp-sub">Cover photo on each folder</p>
            <CoverPicker projects={projects} />
          </fieldset>

          <fieldset>
            <legend>Folder look</legend>
            <Range label="Corner roundness" unit="px" min={0} max={48} value={d.look.radius} onChange={(v) => set((x) => void (x.look.radius = v))} />
            <Range label="Tab roundness" unit="px" min={0} max={30} value={d.look.tabRadius} onChange={(v) => set((x) => void (x.look.tabRadius = v))} />
            <Range label="Tab slant" unit="°" min={0} max={14} step={0.5} value={d.look.tabSlant} onChange={(v) => set((x) => void (x.look.tabSlant = v))} />
            <Range label="Peek (front page)" unit="px" min={10} max={110} value={d.look.peek} onChange={(v) => set((x) => void (x.look.peek = v))} />
            <Range label="Peek (project page)" unit="px" min={10} max={110} value={d.stack.step} onChange={(v) => set((x) => void (x.stack.step = v))} />
            <Range label="Paper texture" unit="%" min={0} max={200} step={5} value={Math.round(d.look.paper * 100)} onChange={(v) => set((x) => void (x.look.paper = v / 100))} />
            <Range label="Shadow" unit="%" min={0} max={200} step={5} value={Math.round(d.look.shadow * 100)} onChange={(v) => set((x) => void (x.look.shadow = v / 100))} />
            <Range label="Edge highlight" unit="%" min={0} max={200} step={5} value={Math.round(d.look.edge * 100)} onChange={(v) => set((x) => void (x.look.edge = v / 100))} />
            <Range label="Margin around the work" unit="%" min={1} max={14} step={0.5} value={d.look.inset} onChange={(v) => set((x) => void (x.look.inset = v))} />
            <Color label="Tab text" value={d.look.ink} onChange={(v) => set((x) => void (x.look.ink = v))} />
          </fieldset>

          <fieldset>
            <legend>Home tab</legend>
            <label className="dp-row">
              <span>Label</span>
              <input
                className="dp-input"
                value={d.text['ui.home'] ?? 'home'}
                onChange={(e) => set((x) => void (x.text['ui.home'] = e.target.value))}
              />
            </label>
            <Color label="Color" value={d.homeTab.color || '#b9d4dc'} onChange={(v) => set((x) => void (x.homeTab.color = v))} />
            {d.homeTab.color && (
              <button type="button" className="dp-link" onClick={() => set((x) => void (x.homeTab.color = ''))}>
                Use each project's folder color
              </button>
            )}
            <p className="dp-note">The tab on the left edge of project pages that takes you back.</p>
          </fieldset>

          <fieldset>
            <legend>Project images</legend>
            <p className="dp-note">Swap any image on a project page for a full-quality file, or a video (it plays while hovered). Big photos are optimized on upload.</p>
            <button
              type="button"
              className={`dp-move${imaging ? ' is-on' : ''}`}
              aria-pressed={imaging}
              onClick={() => setEditor({ imaging: !imaging, editing: false, texting: false, selected: null })}
            >
              {imaging ? 'Done editing images' : 'Edit images'}
            </button>
            <p className="dp-note">
              {imaging
                ? 'Click any outlined image or video on the page to replace it, or drag a file from your computer onto it.'
                : 'Or pick from the list below. Use your original 2x exports for full quality; iPhone videos (.mov) work if they are H.264.'}
            </p>
            <ProjectImages projects={projects} />
          </fieldset>

          <fieldset>
            <legend>Text</legend>
            <Segmented
              label="Side"
              value={d.textSide}
              options={[['left', 'Left'], ['right', 'Right']]}
              onChange={(v) => set((x) => void (x.textSide = v as Design['textSide']))}
            />
            <Segmented
              label="Align"
              value={d.textAlign}
              options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right']]}
              onChange={(v) => set((x) => void (x.textAlign = v as Design['textAlign']))}
            />
            <button
              type="button"
              className={`dp-move${texting ? ' is-on' : ''}`}
              aria-pressed={texting}
              onClick={() => setEditor({ texting: !texting, editing: false, imaging: false, selected: null })}
            >
              {texting ? 'Done editing text' : 'Edit text'}
            </button>
            <p className="dp-note">
              {texting
                ? 'Click any outlined text and type. Click away or press Enter to keep it, Esc to cancel. Then Save.'
                : 'Change any wording on the page: names, titles, descriptions, notes, the report, About.'}
            </p>
            {Object.keys(d.text).length > 0 && (
              <button type="button" className="dp-link" onClick={() => set((x) => void (x.text = {}))}>
                Put all text back ({Object.keys(d.text).length} edited)
              </button>
            )}
          </fieldset>

          <fieldset>
            <legend>Move things</legend>
            <button
              type="button"
              className={`dp-move${editing ? ' is-on' : ''}`}
              aria-pressed={editing}
              onClick={() => setEditor({ editing: !editing, selected: null, texting: false, imaging: false })}
            >
              {editing ? 'Done moving' : 'Move things'}
            </button>
            <p className="dp-note">
              {editing
                ? 'Drag an outlined piece. Arrow keys nudge it (hold Shift for bigger steps). Esc to stop.'
                : 'Drag pieces of the page to new spots. Desktop only; phones keep their own layout.'}
            </p>
            {editing && selected && (
              <div className="dp-selected">
                <strong>{selLabel}</strong>
                <Range
                  label="Size"
                  unit="%"
                  min={50}
                  max={160}
                  step={5}
                  value={Math.round((sel?.s ?? 1) * 100)}
                  onChange={(v) =>
                    set((x) => {
                      const p = x.positions[selected] ?? { x: 0, y: 0, s: 1 };
                      x.positions[selected] = { ...p, s: v / 100 };
                    })
                  }
                />
                <Range
                  label="Rotate"
                  unit="°"
                  min={-45}
                  max={45}
                  step={0.5}
                  value={sel?.r ?? 0}
                  onChange={(v) =>
                    set((x) => {
                      const p = x.positions[selected] ?? { x: 0, y: 0, s: 1 };
                      x.positions[selected] = { ...p, r: v };
                    })
                  }
                />
                <button type="button" className="dp-link" onClick={() => set((x) => void delete x.positions[selected])}>
                  Put this back
                </button>
              </div>
            )}
            {moved > 0 && (
              <button type="button" className="dp-link" onClick={() => (resetPositions(), setStatus(''))}>
                Put everything back ({moved} moved)
              </button>
            )}
          </fieldset>

          <fieldset>
            <legend>Fonts</legend>
            <FontPick missing={missing} label="Titles" value={d.fonts.display} onChange={(v) => set((x) => void (x.fonts.display = v))} sample={projects[0]?.title ?? 'Title'} big />
            <FontPick missing={missing} label="Text" value={d.fonts.body} onChange={(v) => set((x) => void (x.fonts.body = v))} sample="A display typeface hand-painted in nail polish." />
            <FontPick missing={missing} label="Labels" value={d.fonts.label} onChange={(v) => set((x) => void (x.fonts.label = v))} sample="N.01  POLISHED  { TYPE }" />
            <p className="dp-note">Your project slides keep their own fonts.</p>
          </fieldset>

          <fieldset>
            <legend>Colors</legend>
            <Color label="Background" value={d.colors.bg} onChange={(v) => set((x) => void (x.colors.bg = v))} />
            <Color label="Side panel" value={d.colors.panel} onChange={(v) => set((x) => void (x.colors.panel = v))} />
            <Color label="Text" value={d.colors.text} onChange={(v) => set((x) => void (x.colors.text = v))} />
            <Color label="Muted text" value={d.colors.muted} onChange={(v) => set((x) => void (x.colors.muted = v))} />
            <Color label="Highlight" value={d.colors.highlight} onChange={(v) => set((x) => void (x.colors.highlight = v))} />
            <Color label="Cabinet" value={d.cabinet} onChange={(v) => set((x) => void (x.cabinet = v))} />
          </fieldset>

          <fieldset>
            <legend>Folder colors</legend>
            {projects.map((p) => (
              <Color
                key={p.id}
                label={p.title}
                value={d.folders[p.id] ?? p.folderColor ?? '#b7c8d4'}
                onChange={(v) => set((x) => void (x.folders[p.id] = v))}
              />
            ))}
          </fieldset>

          <fieldset>
            <legend>Project page</legend>
            <Range label="Work width" unit="px" min={700} max={1500} step={10} value={d.workWidth} onChange={(v) => set((x) => void (x.workWidth = v))} />
            <Range label="Folder step" unit="px" min={16} max={90} value={d.stack.step} onChange={(v) => set((x) => void (x.stack.step = v))} />
            <Range label="Tab height" unit="px" min={22} max={60} value={d.stack.tabHeight} onChange={(v) => set((x) => void (x.stack.tabHeight = v))} />
            <Range label="Tab width" unit="%" min={10} max={21} value={d.stack.tabWidth} onChange={(v) => set((x) => void (x.stack.tabWidth = v))} />
            <p className="dp-note">Open a project to see these.</p>
          </fieldset>

          <div className="dp-actions">
            <button type="button" className="dp-save" onClick={save} disabled={!dirty}>
              Save
            </button>
            <button type="button" onClick={() => (resetDesign(), setStatus('Changes undone'))} disabled={!dirty}>
              Undo changes
            </button>
          </div>
          <p className="dp-status" role="status">
            {status || (dirty ? 'Unsaved changes' : 'All saved')}
          </p>
        </section>
      )}
    </div>
    </>
  );
}

/** Ids of custom fonts whose files aren't in /public/fonts yet. */
function useMissingFonts() {
  const [missing, setMissing] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    (async () => {
      const out = new Set<string>();
      for (const f of customFonts) {
        let found = false;
        for (const url of fontFileUrls(f, f.files[0].name)) {
          try {
            const res = await fetch(url, { method: 'HEAD' });
            // The dev server answers unknown paths with the page itself, so check the type too.
            if (res.ok && !(res.headers.get('content-type') ?? '').includes('text/html')) {
              found = true;
              break;
            }
          } catch {
            /* keep looking */
          }
        }
        if (!found) out.add(f.id);
      }
      if (alive) setMissing(out);
    })();
    return () => {
      alive = false;
    };
  }, []);
  return missing;
}

/** A small row of toggle buttons. */
function Segmented(props: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="dp-row" role="group" aria-label={props.label}>
      <span>{props.label}</span>
      <span className="dp-seg">
        {props.options.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={props.value === v} className={props.value === v ? 'is-on' : undefined} onClick={() => props.onChange(v)}>
            {l}
          </button>
        ))}
      </span>
    </div>
  );
}

const GROUPS = ['Sans', 'Serif', 'Mono', 'Yours'] as const;

function FontPick(props: {
  label: string;
  value: string;
  sample: string;
  big?: boolean;
  missing: Set<string>;
  onChange: (v: string) => void;
}) {
  const custom = customFonts.find((f) => f.id === props.value);
  const needsFiles = custom && props.missing.has(custom.id);
  return (
    <label className="dp-font">
      <span className="dp-row">
        <span>{props.label}</span>
        <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
          {GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {FONTS.filter((f) => f.group === g).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                  {props.missing.has(f.id) ? ' (add files)' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </span>
      <span className={`dp-sample${props.big ? ' is-big' : ''}`} style={{ fontFamily: fontById(props.value).css }}>
        {props.sample}
      </span>
      {needsFiles && (
        <span className="dp-hint">
          {custom.label}'s files aren't in the project yet. Put them in <code>public/fonts/{custom.folder}/</code> named{' '}
          <code>{custom.files[0].name}.woff2</code> (or .woff / .otf / .ttf). Until then this shows a fallback font.
        </span>
      )}
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="dp-row">
      <span>{label}</span>
      <span className="dp-color">
        <code>{value}</code>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  );
}

function Range(props: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="dp-row dp-range">
      <span>
        {props.label}
        <code>
          {props.value}
          {props.unit}
        </code>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}
