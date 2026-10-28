import type { Project } from '../data/projects';
import { site as baseSite } from '../data/site';
import { getDesign } from './design';

/**
 * Text you edit on the page ("Edit text" in the Design panel) is saved as
 * overrides in src/data/design.json → "text", keyed like:
 *   site.name            p.polished.title
 *   ui.next              p.polished.description
 * Project pages (the slides) are not editable, on purpose.
 * The original copy in src/data/*.ts stays as the fallback.
 */
type Lookup = (key: string, fallback: string) => string;
const lookup = (): Lookup => {
  const text = getDesign().text;
  return (key, fallback) => text[key] ?? fallback;
};

/** Props marking an element as editable text. `multi` allows line breaks. */
export const et = (key: string, multi = false) => ({ 'data-text': key, ...(multi ? { 'data-text-multi': '' } : {}) });

/** A UI label (e.g. "Next file") with any edit applied. */
export const ui = (key: string, fallback: string) => lookup()(`ui.${key}`, fallback);

/** Site text (name, role, about) with edits applied. */
export function getSite() {
  const T = lookup();
  return {
    ...baseSite,
    name: T('site.name', baseSite.name),
    role: T('site.role', baseSite.role),
    about: baseSite.about.map((a, i) => T(`site.about.${i}`, a)),
    email: T('site.email', baseSite.email),
  };
}

/** Projects with edits applied to every visible piece of copy. */
export function withText(projects: Project[]): Project[] {
  const T = lookup();
  return projects.map((p) => {
    const k = `p.${p.id}`;
    return {
      ...p,
      title: T(`${k}.title`, p.title),
      description: T(`${k}.description`, p.description),
      category: T(`${k}.category`, p.category),
      role: T(`${k}.role`, p.role),
      yearLabel: T(`${k}.year`, p.yearLabel ?? String(p.year)),
    };
  });
}

