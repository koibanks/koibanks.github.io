import { useSyncExternalStore, type CSSProperties } from 'react';
import saved from '../data/design.json';
import { customFonts } from '../data/fonts';

/**
 * Design settings: front page layout, colors, fonts, sizes and moved pieces.
 * Saved in src/data/design.json. While running locally (npm run dev), the
 * Design panel edits these live and "Save" writes them back to that file.
 */
export type HomeLayout = 'split' | 'tabs' | 'cabinet' | 'desk';

/** An offset for a movable piece: x in vw, y in vh, s = scale. Desktop only. */
export interface Placement {
  x: number;
  y: number;
  s: number;
  /** Rotation in degrees. */
  r?: number;
}

export interface Design {
  home: HomeLayout;
  colors: { bg: string; panel: string; text: string; muted: string; highlight: string };
  /** Font ids (see FONTS) for each role. */
  fonts: { display: string; body: string; label: string };
  /** Folder color per project id. */
  folders: Record<string, string>;
  /** Project page folder stack: px each folder steps up, tab height px, tab width %. */
  stack: { step: number; tabHeight: number; tabWidth: number };
  /** Max width of the work on project pages, px. */
  workWidth: number;
  /** Cabinet body color (file cabinet front page). */
  cabinet: string;
  /** Pieces you've moved in "Move things" mode, by piece id. */
  positions: Record<string, Placement>;
  /** Image shown on each project's folder on the front page (path inside /public), by project id. */
  covers: Record<string, string>;
  /** Tilt of the folder on the front page, degrees. */
  folderTilt: number;
  /** Front-page folder: size (vw), offset x (vw) / y (vh), 3D lean back and turn (degrees). */
  folder: { size: number; x: number; y: number; lean: number; turn: number };
  /** Margin for the front-page text from the screen edge, vw. */
  indent: number;
  /** Text you've edited on the page, by key (see src/lib/text.ts). */
  text: Record<string, string>;
  /** Images/videos you've swapped in on project pages, by slot (e.g. "p.polished.report.5"). */
  media: Record<string, string>;
  /** Extra photos added to a carousel (Edit images → add photos), by slot. */
  lists: Record<string, string[]>;
  /** Quarter turns for photos (degrees: 90, 180, 270), by file path. */
  rotate: Record<string, number>;
  /** Front-page text: which side it sits on, and how it's aligned. */
  textSide: 'left' | 'right';
  textAlign: 'left' | 'center' | 'right';
  /** What the folders look like. */
  look: {
    radius: number; // folder corner roundness, px
    tabRadius: number; // tab corner roundness, px
    tabSlant: number; // how much the tab sides slant, degrees (0 = straight)
    paper: number; // paper texture strength, 0 = none, 1 = normal, 2 = heavy
    shadow: number; // drop shadow strength, 0 = none, 1 = normal
    edge: number; // light catching the top edge, 0 = none, 1 = normal
    inset: number; // margin between the folder edge and your work, % of width
    peek: number; // front page: how far each folder behind peeks out, px
    ink: string; // colour of the text on folder tabs
  };
  /** The "home" tab on project pages: its color ('' = the project's folder color). */
  homeTab: { color: string };
}

export const HOME_LAYOUTS: { id: HomeLayout; label: string; note: string }[] = [
  { id: 'split', label: 'Split index', note: 'Work left, numbered index right' },
  { id: 'tabs', label: 'Tab index', note: 'Full-screen folder tabs, work rises out' },
  { id: 'cabinet', label: 'File cabinet', note: 'A drawer per project, file rises out' },
  { id: 'desk', label: 'Desk', note: 'Folders on a desk, slide between them' },
];

// ---- Fonts ---------------------------------------------------------------

export interface FontOption {
  id: string;
  label: string;
  group: 'Sans' | 'Serif' | 'Mono' | 'Yours';
  /** CSS font-family value. */
  css: string;
  /** Google Fonts family spec, if it needs loading. */
  google?: string;
}

const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

export const FONTS: FontOption[] = [
  { id: 'system', label: 'System sans (default)', group: 'Sans', css: SANS },
  { id: 'inter', label: 'Inter', group: 'Sans', css: `'Inter', ${SANS}`, google: 'Inter:wght@400;500;600;700' },
  { id: 'hanken', label: 'Hanken Grotesk', group: 'Sans', css: `'Hanken Grotesk', ${SANS}`, google: 'Hanken+Grotesk:wght@400;500;600;700' },
  { id: 'instrument-sans', label: 'Instrument Sans', group: 'Sans', css: `'Instrument Sans', ${SANS}`, google: 'Instrument+Sans:wght@400;500;600;700' },
  { id: 'space-grotesk', label: 'Space Grotesk', group: 'Sans', css: `'Space Grotesk', ${SANS}`, google: 'Space+Grotesk:wght@400;500;600;700' },
  { id: 'dm-sans', label: 'DM Sans', group: 'Sans', css: `'DM Sans', ${SANS}`, google: 'DM+Sans:wght@400;500;600;700' },
  { id: 'archivo', label: 'Archivo', group: 'Sans', css: `'Archivo', ${SANS}`, google: 'Archivo:wght@400;500;600;700' },
  { id: 'syne', label: 'Syne', group: 'Sans', css: `'Syne', ${SANS}`, google: 'Syne:wght@400;500;600;700' },
  // Free (open-license) fonts close in spirit to Parabolica: utilitarian, technical grotesques
  { id: 'ibm-plex-sans', label: 'IBM Plex Sans', group: 'Sans', css: `'IBM Plex Sans', ${SANS}`, google: 'IBM+Plex+Sans:wght@400;500;600;700' },
  { id: 'geist', label: 'Geist', group: 'Sans', css: `'Geist', ${SANS}`, google: 'Geist:wght@400;500;600;700' },
  { id: 'schibsted', label: 'Schibsted Grotesk', group: 'Sans', css: `'Schibsted Grotesk', ${SANS}`, google: 'Schibsted+Grotesk:wght@400;500;600;700' },
  { id: 'bricolage', label: 'Bricolage Grotesque', group: 'Sans', css: `'Bricolage Grotesque', ${SANS}`, google: 'Bricolage+Grotesque:opsz,wght@12..96,400..700' },
  { id: 'instrument-serif', label: 'Instrument Serif', group: 'Serif', css: `'Instrument Serif', ${SERIF}`, google: 'Instrument+Serif:ital@0;1' },
  { id: 'fraunces', label: 'Fraunces', group: 'Serif', css: `'Fraunces', ${SERIF}`, google: 'Fraunces:wght@400;500;600;700' },
  { id: 'eb-garamond', label: 'EB Garamond', group: 'Serif', css: `'EB Garamond', ${SERIF}`, google: 'EB+Garamond:wght@400;500;600;700' },
  { id: 'playfair', label: 'Playfair Display', group: 'Serif', css: `'Playfair Display', ${SERIF}`, google: 'Playfair+Display:wght@400;500;600;700' },
  { id: 'dm-serif', label: 'DM Serif Display', group: 'Serif', css: `'DM Serif Display', ${SERIF}`, google: 'DM+Serif+Display' },
  { id: 'system-mono', label: 'System mono', group: 'Mono', css: MONO },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono', group: 'Mono', css: `'IBM Plex Mono', ${MONO}`, google: 'IBM+Plex+Mono:wght@400;500;600' },
  { id: 'space-mono', label: 'Space Mono', group: 'Mono', css: `'Space Mono', ${MONO}`, google: 'Space+Mono:wght@400;700' },
  { id: 'courier-prime', label: 'Courier Prime', group: 'Mono', css: `'Courier Prime', ${MONO}`, google: 'Courier+Prime:wght@400;700' },
  { id: 'polished', label: 'Polished (your font)', group: 'Yours', css: `'Polished Extras', ${SANS}` },
  // Fonts you add in src/data/fonts.ts
  ...customFonts.map((f): FontOption => ({ id: f.id, label: f.label, group: 'Yours', css: `'${f.family}', ${f.fallback}` })),
];

export const fontById = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];

/** Google Fonts stylesheet URL for the fonts in use (null if none need loading). */
export function googleFontsUrl(d: Design): string | null {
  const specs = [...new Set([d.fonts.display, d.fonts.body, d.fonts.label].map((id) => fontById(id).google).filter(Boolean))];
  if (!specs.length) return null;
  return `https://fonts.googleapis.com/css2?${specs.map((s) => `family=${s}`).join('&')}&display=swap`;
}

// ---- Store ---------------------------------------------------------------

const DEFAULTS: Pick<Design, 'fonts' | 'positions' | 'covers' | 'folderTilt' | 'folder' | 'indent' | 'text' | 'media' | 'lists' | 'rotate' | 'textSide' | 'textAlign' | 'look' | 'homeTab'> = {
  look: { radius: 22, tabRadius: 18, tabSlant: 5, paper: 1, shadow: 1, edge: 1, inset: 5, peek: 48, ink: '#ffffff' },
  homeTab: { color: '' },
  folder: { size: 56, x: 0, y: 0, lean: 0, turn: 0 },
  indent: 5,
  text: {},
  media: {},
  lists: {},
  rotate: {},
  textSide: 'right',
  textAlign: 'right',
  fonts: { display: 'system', body: 'system', label: 'system' },
  positions: {},
  covers: {},
  folderTilt: 0,
};
const clone = (d: Design): Design => JSON.parse(JSON.stringify(d));
const initial = {
  ...DEFAULTS,
  ...(saved as Partial<Design>),
  look: { ...DEFAULTS.look, ...((saved as Partial<Design>).look ?? {}) },
  homeTab: { ...DEFAULTS.homeTab, ...((saved as Partial<Design>).homeTab ?? {}) },
} as Design;

let current: Design = clone(initial);
let lastSaved: Design = clone(initial);
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const getDesign = () => current;
export const useDesign = (): Design => useSyncExternalStore(subscribe, getDesign, getDesign);

/** Change settings live (not saved until saveDesign). */
export function updateDesign(change: (d: Design) => void) {
  const next = clone(current);
  change(next);
  current = next;
  emit();
}

export const isDirty = () => JSON.stringify(current) !== JSON.stringify(lastSaved);

/** Undo unsaved changes. */
export function resetDesign() {
  current = clone(lastSaved);
  emit();
}

/** Dev only: write the current settings to src/data/design.json via the dev server. */
export async function saveDesign(): Promise<boolean> {
  try {
    const res = await fetch('/__design', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(current),
    });
    if (!res.ok) return false;
    lastSaved = clone(current);
    emit();
    return true;
  } catch {
    return false;
  }
}

/** CSS variables for the whole page. */
export function designVars(d: Design): Record<string, string> {
  return {
    '--bg': d.colors.bg,
    '--panel': d.colors.panel,
    '--fg': d.colors.text,
    '--muted': d.colors.muted,
    '--highlight': d.colors.highlight,
    '--font': fontById(d.fonts.body).css,
    '--font-display': fontById(d.fonts.display).css,
    '--font-label': fontById(d.fonts.label).css,
    '--d-stack-y': `${d.stack.step}px`,
    '--d-tab-h': `${d.stack.tabHeight}px`,
    '--d-tab-w': `${d.stack.tabWidth}%`,
    '--d-work-w': `${d.workWidth}px`,
    '--cabinet': d.cabinet,
    '--folder-tilt': `${d.folderTilt}deg`,
    '--folder-size': `${d.folder.size}vw`,
    '--folder-x': `${d.folder.x}vw`,
    '--folder-y': `${d.folder.y}vh`,
    '--folder-lean': `${d.folder.lean}deg`,
    '--folder-turn': `${d.folder.turn}deg`,
    '--indent': `${d.indent}vw`,
    '--folder-radius': `${d.look.radius}px`,
    '--tab-radius': `${d.look.tabRadius}px`,
    '--tab-slant': `${d.look.tabSlant}deg`,
    '--shadow-k': String(d.look.shadow),
    '--edge': String(0.45 * d.look.edge),
    '--folder-inset': `${d.look.inset}%`,
    '--tab-ink': d.look.ink,
    '--home-peek': `${d.look.peek}px`,
    '--paper': paperTexture(d.look.paper),
    ...(d.homeTab.color ? { '--home-tab': d.homeTab.color } : {}),
  };
}

// ---- Movable pieces ------------------------------------------------------

/**
 * Props for a piece you can move in "Move things" mode. Spread onto the element:
 *   <div className="x" {...movable('split.work', 'The work')}>
 * Offsets apply on desktop only (see [data-edit] in styles.css).
 */
export function movable(id: string, label: string, style?: CSSProperties) {
  const p = current.positions[id];
  return {
    'data-edit': id,
    'data-edit-label': label,
    style: {
      ...style,
      ...(p ? { '--ex': `${p.x}vw`, '--ey': `${p.y}vh`, '--es': p.s, '--er': `${p.r ?? 0}deg` } : {}),
    } as CSSProperties,
  };
}

// ---- Move mode (not saved) ----------------------------------------------

let editor = { editing: false, selected: null as string | null, texting: false, imaging: false };
const editorListeners = new Set<() => void>();
export const getEditor = () => editor;

export const useEditor = () =>
  useSyncExternalStore(
    (cb) => {
      editorListeners.add(cb);
      return () => editorListeners.delete(cb);
    },
    getEditor,
    getEditor,
  );

export function setEditor(change: Partial<typeof editor>) {
  editor = { ...editor, ...change };
  editorListeners.forEach((l) => l());
}

/** Move/resize a piece by an amount (x/y in vw/vh), or set its scale. */
export function nudge(id: string, dx: number, dy: number, scale?: number) {
  updateDesign((d) => {
    const p = d.positions[id] ?? { x: 0, y: 0, s: 1 };
    const round = (n: number) => Math.round(n * 10) / 10;
    d.positions[id] = { ...p, x: round(p.x + dx), y: round(p.y + dy), s: scale ?? p.s };
  });
}

export function resetPositions(prefix?: string) {
  updateDesign((d) => {
    for (const id of Object.keys(d.positions)) if (!prefix || id.startsWith(prefix)) delete d.positions[id];
  });
}

/**
 * Real paper texture: fractal noise lit from the top-left (paper "tooth") plus
 * long faint fibres, drawn once as a small tile. `strength` 0 = none, 1 = normal.
 */
export function paperTexture(strength: number): string {
  if (strength <= 0) return 'none';
  const slope = (1.8 * strength).toFixed(3);
  const icpt = (1 - 1.8 * strength * 0.983).toFixed(3);
  const icptB = (Number(icpt) - 0.01).toFixed(3);
  return (
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'>" +
    "<filter id='t' x='0' y='0' width='100%' height='100%'>" +
    "<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='7' stitchTiles='stitch' result='n'/>" +
    "<feDiffuseLighting in='n' lighting-color='white' surfaceScale='1.4' result='tooth'><feDistantLight azimuth='225' elevation='62'/></feDiffuseLighting>" +
    "<feTurbulence type='fractalNoise' baseFrequency='0.012 0.32' numOctaves='3' seed='3' stitchTiles='stitch' result='f'/>" +
    "<feColorMatrix in='f' type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.6 1.25' result='fibres'/>" +
    "<feComposite in='tooth' in2='fibres' operator='arithmetic' k1='0' k2='1' k3='0.14' k4='0' result='paper'/>" +
    `<feComponentTransfer in='paper'><feFuncR type='linear' slope='${slope}' intercept='${icpt}'/><feFuncG type='linear' slope='${slope}' intercept='${icpt}'/><feFuncB type='linear' slope='${slope}' intercept='${icptB}'/></feComponentTransfer>` +
    "</filter><rect width='100%' height='100%' filter='url(%23t)'/></svg>\")"
  );
}
