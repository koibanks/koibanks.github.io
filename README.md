# File Cabinet portfolio

Projects are folders in an open drawer; the folder tabs on the right edge are the navigation.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

Dev-only: add `?reduce-motion` to the URL to preview the reduced-motion version.

## Edit content

- **Projects:** `src/data/projects.ts` (order = drawer order; `id` = URL `#/project/<id>`; `category` = which black divider card it sits behind)
- **Name, drawer label, about text:** `src/data/site.ts`
- **Real images:** put files in `public/work/` and replace an `art.*(...)` call with
  `{ kind: 'image', src: '/work/file.jpg', alt: 'Describe the image' }`

## Tweak

- Motion timing, 3D angles, scroll lock: `src/config.ts`
- Colors, line weight, card size, tab sizes: the `:root` block at the top of `src/styles.css`
- Where tabs sit on the cards: `PROJECT_TAB` / `DIVIDER_TAB` in `src/components/Drawer.tsx`

## Structure

| File | What it does |
| --- | --- |
| `src/App.tsx` | Hash routing, current project, folder open/close sequences |
| `src/components/Drawer.tsx` | Card stack (dividers + filler cards), 3D poses, GSAP "next file" timeline |
| `src/components/CardTab.tsx` | The index-card tab shape |
| `src/components/TabRail.tsx` | Folder-tab nav (`<nav><ol><button aria-current>`) |
| `src/components/ProjectInfo.tsx` | Title, one-liner, "Open case study" |
| `src/components/CaseStudy.tsx` | Case study page |
| `src/hooks/useStepNavigation.ts` | Wheel / swipe / keys, one project per gesture |

## Design panel (edit the look without code)

Run `npm run dev` and click the yellow **Design** button at the bottom of the page.

- **Front page:** Split index, Tab index, File cabinet, or Desk
- **Fonts:** Titles, Text and Labels, from a list of sans, serif and mono fonts (plus Polished)
- **Move things:** drag pieces of the page (your name, the work, the title block, the index…) to new spots, nudge with arrow keys, resize and rotate. Desktop only; phones keep their layout.
- **Edit text:** click any outlined text on the page (names, titles, descriptions, notes, labels, About) and type. Project pages (the slides) stay exactly as designed. Also set which side the front-page text sits on and how it's aligned. Edits are saved in src/data/design.json → "text"; the original copy in src/data stays as the fallback.
- **Edit images:** turn it on, then click any outlined image or video (folder covers, project pages) to replace it, or drag a file from your computer onto it. Videos (.mp4, .webm, iPhone .mov) play on a loop while hovered; you get a warning if the browser cannot play one (re-export as H.264 .mp4). Photos over 3600px or 4 MB are saved as near-lossless WebP, so drop in your original 2x exports for full quality.
- **[heaven or] page:** the photo essay slides on its own and can be swiped or dragged. In Edit images, drop photos anywhere on the essay (or click + add photos) to add them, click a photo to replace it, ⟳ rotate turns it a quarter, × removes an added one. The EPUB section runs the In Spades flipbook unpacked in public/work/heaven-or/in-spades/, with a download link to the .epub. The wide spread scrolls sideways, and the cover Elvis dances on hover.
- **Folder look:** corner and tab roundness, tab slant, how far folders peek out, paper texture, shadow, edge light, margin around your work.
- **Home tab:** the tab on project pages that takes you back; change its wording and color.
- **Folder:** size, position, 3D lean and turn, tilt, and the cover photo on each project's folder (pick an image in public/work, or upload one; it's copied into public/work/<project>/)
- **Colors, folder colors, cabinet color**
- **Project page:** work width, how far folders step up, tab height and width

Changes show live. **Save** writes them to `src/data/design.json`, so they stick and ship with the site.
**Undo changes** goes back to the last save. The panel only exists in `npm run dev`; it's left out of the built site.

## Publishing the site

The live site is the split home page with no Design panel (that only exists in `npm run dev`).

- `npm run build` makes the site in `dist/`; `npm run preview` opens that build locally.
- `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.
- One-time setup: publish this repo to GitHub as `koibanks/koibanks.github.io` (GitHub Desktop → Publish repository, public), then on GitHub go to Settings → Pages → Source and pick "GitHub Actions". The site goes live at https://koibanks.github.io.
- Design changes: run `npm run dev`, edit with the Design panel, press Save, then commit and push.
