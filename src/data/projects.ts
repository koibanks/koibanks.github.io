/**
 * ALL PROJECT CONTENT LIVES HERE.
 *
 * Order in this array = order on the home page (N.01, N.02, …).
 * `id` becomes the URL: #/project/<id>
 * `feature` is the big image on the home page; `report` is the case study sheet.
 * `accent` tints the page background and the case study.
 * Covers and section images use generated CSS art (see art.ts). Replace with
 *   { kind: 'image', src: 'work/file.jpg', alt: '...' } when you have real images
 *   (put the files in /public/work/). See the "polished" project for a real example.
 */
import type { CoverArt } from './art';

export type { CoverArt };

export interface CaseSection {
  heading: string;
  /** Separate paragraphs with a blank line ("\n\n"). */
  body?: string;
  images?: CoverArt[];
}

/**
 * A report is the scrolling sheet clipped inside the open folder.
 * Blocks stack top to bottom with no gaps, like one long slide.
 * Projects without a `report` get one built from their sections.
 */
/** Any block can paint the strip of slide behind it (CSS background; cqw = % of the sheet width). */
export type ReportBlock = ReportBlockBody & { backdrop?: string };

type ReportBlockBody =
  /** Title area: title (set in the project font) or title art, a small heading, a date, paragraphs, images on the right. */
  | {
      type: 'intro';
      titleArt?: CoverArt;
      title?: string;
      kicker?: string;
      date?: string;
      body: string;
      aside?: CoverArt[];
      /** Title colour (default black). */
      titleColor?: string;
    }
  /** Plain text, optional heading. */
  | { type: 'text'; heading?: string; body: string }
  /** An image at its own proportions. `inset` gives it a margin, like a panel on the page. */
  | { type: 'image'; image: CoverArt; inset?: boolean; /** Space above it, % of the sheet width (for evenly spaced stacks). */ space?: number }
  /** Two or more images side by side. */
  | { type: 'images'; images: CoverArt[]; inset?: boolean }
  /** A video panel. Plays muted and loops; `poster` shows before it loads. */
  | { type: 'video'; src: string; poster?: string; label: string; inset?: boolean }
  /**
   * Live type set in the project's font. Line breaks with "\n".
   * `size` is a % of the sheet width, so it scales like a slide.
   */
  | {
      type: 'set';
      text: string;
      size: number;
      color?: string;
      /** A CSS gradient for the letters (overrides color). */
      gradient?: string;
      background?: string;
      align?: 'left' | 'center' | 'right';
      /** CSS padding, e.g. '6% 5%'. */
      padding?: string;
      /** Optional link on its own line at the end. */
      link?: { text: string; href: string };
      inset?: boolean;
      /** What a screen reader should read, if different from `text`. */
      label?: string;
    }
  /** Side-by-side columns of live type in the project font. */
  | {
      type: 'columns';
      size: number;
      columns: { text: string; color: string; background: string; align: 'left' | 'right' }[];
      inset?: boolean;
    }
  /** A type tester: visitors type and see it in the project font. */
  | { type: 'tester'; placeholder?: string; size: number; background?: string; inset?: boolean }
  /** An empty block, e.g. a grey placeholder for a photo you'll add later. */
  | { type: 'box'; height: number; color?: string; inset?: boolean }
  /** A black panel with a line of text and a link (plain type). */
  | { type: 'cta'; text: string; label: string; href: string }
  /**
   * A magazine-cover opening: colour bar along the top, title, heading, date,
   * blurb, a big cut-out image placed freely (it dances when hovered), suits in
   * the corners and a label. Sizes are % of the sheet width (cqw).
   */
  | {
      type: 'cover';
      height: number;
      bar: string;
      title: string;
      heading: string;
      date: string;
      body: string;
      hero: CoverArt;
      /** Where the cut-out sits, in % of the sheet width. */
      heroBox: { left: number; top: number; width: number };
      suitTop?: Suit;
      suitBottom?: Suit;
      label?: string;
    }
  /** A thin row with a label (e.g. "photo essay:") and playing-card suits. */
  | { type: 'label'; text: string; suits: Suit[]; side: 'left' | 'right'; background?: string }
  /**
   * Something wider than the sheet (e.g. a two-page spread). It sticks out past
   * the right edge and scrolls sideways. `width` is a % of the sheet width.
   */
  | { type: 'wide'; image: CoverArt; width: number; hint?: string }
  /** Photos that slide by on their own and can be swiped/dragged. */
  | { type: 'carousel'; images: CoverArt[]; background: string; label: string; interval?: number }
  /** An EPUB you can read right on the page. `src` is a path inside /public. */
  | {
      type: 'epub';
      src?: string;
      /** A scripted flipbook unpacked from the EPUB (its book page), shown as-is instead of the plain reader. */
      book?: string;
      background: string;
      placeholder: string;
      title: string;
    }
  /** A closing strip of small text, right-aligned, with a star. */
  | { type: 'note'; text: string; background: string; color?: string }
  /**
   * A free layout, like a Figma frame: images, text and lines placed by
   * position. All numbers are % of the sheet width (cqw), so it scales like the slide.
   */
  | { type: 'stage'; height: number; background: string; items: StageItem[] }
  /** A plain strip of colour (e.g. the thin orange line between photos). */
  | { type: 'bar'; height: number; background: string }
  /**
   * A live website inside the sheet, e.g. a published Figma Make (its .figma.site
   * link). `aspect` is width / height. Without a `src` it shows `placeholder`.
   */
  | { type: 'embed'; src?: string; aspect: number; title: string; placeholder: string; background?: string };

/** One piece of a 'stage' block. x / y / w / size are % of the sheet width. */
export type StageItem =
  | {
      kind: 'image';
      art: CoverArt;
      x: number;
      y: number;
      w: number;
      /** Subtle hover: 'lift' rises a little, 'turn' swivels a little. */
      hover?: 'lift' | 'turn';
    }
  | {
      kind: 'text';
      /** Plain text, or parts with their own colour / underline. */
      text: string | { t: string; color?: string; underline?: boolean }[];
      x: number;
      y: number;
      size: number;
      font?: string;
      weight?: number;
      color?: string;
      /** Letter spacing in em. */
      tracking?: number;
      /** Use h2 for the title, so the page has a proper heading. */
      as?: 'h2' | 'p';
      /** Width (% of sheet). Set it to let a paragraph wrap; without it the text stays on its lines. */
      w?: number;
      /** Line height, e.g. 1.4 for a paragraph. */
      lines?: number;
    }
  | { kind: 'rule'; x: number; y: number; w: number; h: number; color: string };

/** Playing-card suits, drawn as pixel art. */
export type Suit = 'club' | 'diamond' | 'spade' | 'heart';

export interface Project {
  id: string;
  title: string;
  /** Optional image used for the title (e.g. a wordmark) on the folder label. */
  titleArt?: CoverArt;
  /** One line, shown under the title in the cabinet. */
  description: string;
  /** Short discipline label, e.g. 'Type', 'Print'. */
  category: string;
  year: number;
  /** Optional display text for the year, e.g. '2024–2026'. */
  yearLabel?: string;
  role: string;
  tools: string[];
  /** Hex color, e.g. '#c8553d'. Tints the background and the folder label. */
  accent: string;
  /** Small preview image (used if there is no `feature`). */
  cover: CoverArt;
  /** The big image of the work on the home page. Defaults to `cover`. */
  feature?: CoverArt;
  /** The case study sheet, block by block. If left out, one is built from `sections`. */
  report?: ReportBlock[];
  /** The project's own typeface, for live type in the report. `src` is a path inside /public. */
  font?: { family: string; src: string };
  /** Typeface for the whole report sheet (CSS font-family), if not the default. */
  reportFont?: string;
  /** Stylesheet that loads reportFont (e.g. a Google Fonts URL). */
  reportFontHref?: string;
  /** Background of the report sheet (any CSS background). */
  reportBackground?: string;
  /** Folder color for this project's case study. */
  folderColor?: string;
  /** Marks a placeholder project (shows a small "Stand-in" note). Delete when you add the real one. */
  standIn?: boolean;
  sections?: CaseSection[];
}

export const projects: Project[] = [
  {
    id: 'polished',
    title: 'Polished',
    titleArt: { kind: 'image', src: 'work/polished/wordmark.png', alt: 'Polished', fit: 'contain' },
    description: 'A display typeface hand-painted in nail polish.',
    category: 'Type',
    year: 2026,
    yearLabel: '2024–2026',
    role: 'Type Designer',
    tools: ['Nail polish', 'UV lamp', 'Figma'],
    accent: '#e0262b',
    folderColor: '#b9d4dc',
    feature: { kind: 'image', src: 'work/polished/words-hq.webp', alt: 'Polished set in red on paper: Coat, Basecoat, Topcoat, Layer, Brush, Stroke, Swipe…' },
    cover: { kind: 'image', src: 'work/polished/wordmark.png', alt: 'Polished wordmark', fit: 'contain', background: '#ffffff' },
    // The project's typeface, used by 'set', 'columns' and 'tester' blocks and the intro title.
    font: { family: 'Polished Extras', src: 'fonts/PolishedExtras-Regular.ttf' },
    // The Figma slide, top to bottom.
    reportBackground: '#ffffff',
    report: [
      {
        type: 'intro',
        title: 'Polished',
        titleColor: '#ffffff',
        // black behind the title, fading to white just below it
        backdrop: 'linear-gradient(180deg, #000 0, #000 16cqw, #fff 26cqw)',
        kicker: 'Nail polish typeface',
        date: '2024.2026',
        body: 'A display typeface hand-painted in nail polish, built around the way polish pools, drips and catches the light as it dries.\n\nThe typeface is a collection of 65 hand-painted glyphs: uppercase and lowercase letters, numbers 0–9, and a question mark, exclamation point and number sign. Each letter made by hand with nail polish, letting the polish settle and run. It was then cured under a UV Lamp to set the drips and glossy highlights set in place.\n\nEach glyph keeps the uneven weight and soft, wet edges of the original polish, which gives the typeface a tactile, imperfect feel',
        // Drawn with the font itself, so they stay sharp at any size.
        aside: [
          {
            kind: 'css',
            mark: 'A',
            ink: '#e6e6e6',
            background: 'linear-gradient(180deg, #f2f2f2 0%, #8c8c8c 28%, #000 68%)',
            alt: 'Hand-painted uppercase A in nail polish',
          },
          { kind: 'css', mark: 'a', ink: '#ffffff', background: '#000', alt: 'Hand-painted lowercase a in nail polish' },
        ],
      },
      { type: 'tester', placeholder: 'Type to try the font…', size: 6.2, background: '#d9d9d9', inset: true },
      {
        type: 'set',
        text: 'ABCDEFGHIJKLMNOPQRSTUV\nWXYZ#!,.-0123456789abcde\nfghijklmnopqrstuvwxyz',
        label: 'The full Polished character set: A to Z, number sign, punctuation, 0 to 9, a to z',
        size: 8.4,
        color: '#000',
        background: 'linear-gradient(180deg, rgb(255 255 255 / 0) 0%, rgb(255 255 255 / 0.85) 100%)',
        padding: '5% 7% 6%',
      },
      {
        type: 'set',
        text: 'This is a font made\nusing nailpolish, then\ncured under a UV lamp,\nthen transfered to\ndigital format.',
        size: 8.8,
        color: '#fff',
        background: '#000',
        padding: '7% 3.5% 10%',
        inset: true,
      },
      {
        type: 'columns',
        size: 2.15,
        inset: true,
        columns: [
          {
            color: '#fff',
            background: '#000',
            align: 'left',
            text: 'Tur aut accusdant ullaut ulliqui adit, com-niminihil ipsum fuga. Vition ressunt fugitas-peror as num aped que as ducipicae qui quis-sin cillupt aquam, adignat idebis dolluptur? Itatur aspe et dis resequiat.\n\nEt expediorem estinctore nonseque dus. Nesto debis re sandae. Itaqui ut fuga. Pos quam sunt ut ea que illatur? Quis eum voles enis esciende nobit utecus. Dratusdam enihicit quates es cullorero mag-nistibus volorrum derit eum nem nos adis enim cusam, is doluptus.\n\nCaepel exerum, sedis et ut volore preic tem rerciet omnis aboreribus nimincium simint ut min con repti beaquoditin niam, et, inihi-ciendae volorum ipsusdae voleces ecust, cus exerum quia aut por aut vera vendebitem',
          },
          {
            color: '#000',
            background: '#fff',
            align: 'right',
            text: 'Tur aut accusdant ullaut ulliqui adit, com-niminihil ipsum fuga. Vition ressunt fugitas-peror as num aped que as ducipicae qui quis-sin cillupt aquam, adignat idebis dolluptur? Itatur aspe et dis resequiat.\n\nEt expediorem estinctore nonseque dus. Nesto debis re sandae. Itaqui ut fuga. Pos quam sunt ut ea que illatur? Quis eum voles enis esciende nobit utecus. Dratusdam enihicit quates es cullorero mag-nistibus volorrum derit eum nem nos adis enim cusam, is doluptus.\n\nCaepel exerum, sedis et ut volore preic tem rerciet omnis aboreribus nimincium simint ut min con repti beaquoditin niam, et, inihi-ciendae volorum ipsusdae voleces ecust, cus exerum quia aut por aut vera vendebitem',
          },
        ],
      },
      {
        type: 'image',
        inset: true,
        backdrop: 'linear-gradient(180deg, #fff 0%, #9a9a9a 50%, #2a2a2a 100%)',
        image: {
          kind: 'image',
          src: 'work/polished/words-hq.webp',
          alt: 'Set in red Polished on paper: Coat, Basecoat, Topcoat, Layer, Brush, Stroke, Swipe, Paint, Polish, Apply, Buff, File, Shape, Dry, Cure, Set, Seal, Harden, Flash, Lamp, Wipe, Remover, Acetone.',
        },
      },
      {
        type: 'set',
        text: 'If interested in downloading\nthis font, please contact',
        link: { text: 'koiibanks@gmail.com :)', href: 'mailto:koiibanks@gmail.com' },
        size: 7,
        gradient: 'linear-gradient(90deg, #ff1d3a 0%, #ff5a72 50%, #ffa27c 100%)',
        background: '#000',
        backdrop: 'linear-gradient(180deg, #1a1a1a 0, #000 3cqw)',
        align: 'center',
        padding: '14% 4% 15%',
        inset: true,
      },
    ],
  },
  {
    id: 'locus',
    title: 'LOCUS',
    titleArt: { kind: 'image', src: 'work/locus/logo.png', alt: 'LOCUS', fit: 'contain' },
    description: 'A concept product brand for a speaker: a center of activity, attention, or concentration.',
    category: 'Product brand',
    year: 2026,
    yearLabel: '2026',
    role: 'Brand & Product Designer',
    tools: ['Figma', 'Figma Make'],
    accent: '#ff5a2c',
    folderColor: '#ff5a2c',
    feature: { kind: 'image', src: 'work/locus/room-night.jpg', alt: 'The LOCUS speaker on a windowsill at night, city lights behind it' },
    cover: { kind: 'image', src: 'work/locus/room-night.jpg', alt: 'The LOCUS speaker on a windowsill at night' },
    // Inter stands in for the headline grotesque; the definition is IBM Plex Mono.
    reportFont: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    reportFontHref: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400&family=Inter:wght@400;500&display=swap',
    reportBackground: '#15171a',
    // The Figma page, top to bottom (Project Two).
    report: [
      {
        // Title page fading into the orange definition, speakers placed like the frame.
        type: 'stage',
        height: 155, // room below the speakers so they don't touch the photo underneath
        background: 'linear-gradient(180deg, #15171a 0%, #15171a 42%, #6b2e1f 66%, #ff5a2c 100%)',
        items: [
          { kind: 'image', art: { kind: 'image', src: 'work/locus/logo.png', alt: 'LOCUS' }, x: -5.2, y: 4.8, w: 53.2 },
          { kind: 'text', text: 'CONCEPT PRODUCT BRAND', x: 3.3, y: 18.9, size: 4.26, weight: 500, color: '#ede9e2', tracking: -0.01 },
          { kind: 'text', text: '.2026', x: 3.3, y: 23.4, size: 2.06, color: '#ede9e2' },
          // The project description, wrapping beside the front-view speaker.
          { kind: 'text', text: 'The brief was to create a brand around a small speaker system for small apartments. I focused on the biggest problem of apartment living: sound doesn’t stay where you want it. Thin walls mean your music becomes your neighbor’s music, so people just keep the volume down. My answer is Locus, a speaker for small apartments that spatially maps the apartment where sound can then be placed where you want it.', x: 3.3, y: 29, w: 54, size: 2.06, color: '#ede9e2', lines: 1.4 },
          { kind: 'image', art: { kind: 'image', src: 'work/locus/speaker-front.webp', alt: 'The LOCUS speaker from the front: a round mesh face with a glowing red eye, on a tripod' }, x: 65, y: 21.2, w: 31.3, hover: 'lift' },
          { kind: 'text', as: 'h2', text: 'LOCUS', x: 3.3, y: 76.2, size: 7.56, font: '"IBM Plex Mono", ui-monospace, monospace', weight: 300, color: '#ede9e2' },
          { kind: 'rule', x: 3.3, y: 85.6, w: 92.3, h: 0.35, color: '#d9d9d9' }, // a little space under LOCUS
          {
            kind: 'text',
            x: 3.7,
            y: 88.2,
            size: 2.27,
            font: '"IBM Plex Mono", ui-monospace, monospace',
            color: '#ede9e2',
            text: [{ t: 'a: ', color: '#ff5a2c' }, { t: 'the place where something is situated or occurs : ' }, { t: 'site', underline: true }, { t: ', ' }, { t: 'location', underline: true }],
          },
          {
            kind: 'text',
            x: 9,
            y: 91.9,
            size: 2.75,
            font: '"IBM Plex Mono", ui-monospace, monospace',
            color: '#ede9e2',
            text: [{ t: 'b: ', color: '#ff5a2c' }, { t: 'a center of activity, attention, or concentration' }],
          },
          { kind: 'image', art: { kind: 'image', src: 'work/locus/speaker-side.webp', alt: 'The LOCUS speaker from the side: a cone with a brushed-metal volume dial' }, x: 17.1, y: 99.7, w: 30.9, hover: 'turn' },
          { kind: 'image', art: { kind: 'image', src: 'work/locus/speaker-back.webp', alt: 'The LOCUS speaker from the back: a rounded shell with a USB-C port and headphone jack' }, x: 50.6, y: 99.6, w: 28.3, hover: 'turn' },
        ],
      },
      { type: 'image', image: { kind: 'image', src: 'work/locus/room-night.jpg', alt: 'The LOCUS speaker on a wooden windowsill at night, a lamp and armchair behind, city lights outside' } },
      { type: 'bar', height: 1.8, background: '#ff5a2c' },
      { type: 'image', image: { kind: 'image', src: 'work/locus/room-desk.jpg', alt: 'The LOCUS speaker on a desk beside a lamp, a laptop, a succulent and a mug, in a warm living room' } },
      { type: 'bar', height: 1.8, background: '#ff5a2c' },
      // The video: drop the file onto this in Design panel → Edit images (it plays while hovered).
      { type: 'image', image: { kind: 'image', src: 'work/locus/video-poster.png', alt: 'LOCUS video' } },
      { type: 'bar', height: 12.6, background: 'linear-gradient(180deg, #17181c 0%, #a3421f 100%)' },
      // The Figma Make, live. Paste its published link (…figma.site) into src.
      {
        type: 'embed',
        src: 'https://job-shout-75434473.figma.site',
        aspect: 1455 / 1021,
        title: 'LOCUS interactive prototype (Figma Make)',
        placeholder: 'interactive prototype coming soon',
        background: '#ffffff',
      },
    ],
  },
  {
    id: 'heaven-or',
    title: '[heaven or]',
    description: 'A magazine issue about Las Vegas casino culture, built around the disorienting architecture designed to keep visitors inside, spending and losing track of time.',
    category: 'Editorial',
    year: 2026,
    yearLabel: '2026',
    role: 'Editorial Designer',
    tools: ['InDesign', 'Photoshop', 'Figma'],
    accent: '#e3202a',
    folderColor: '#e3202a',
    feature: { kind: 'image', src: 'work/heaven-or/production-01.webp', alt: 'The printed [heaven or] magazine held open on its Elvis spread' },
    cover: { kind: 'image', src: 'work/heaven-or/production-01.webp', alt: 'The printed [heaven or] magazine' },
    // Inter stands in for Helvetica Neue (renders the same on every computer).
    reportFont: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    reportFontHref: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    reportBackground: '#ffffff',
    // The Figma page, top to bottom (Project Three).
    report: [
      {
        type: 'cover',
        height: 100,
        bar: 'linear-gradient(90deg, #e3202a 0%, #ee3b44 35%, #f7a9ad 75%, #ffffff 100%)',
        title: '[heaven or]',
        heading: 'MAGAZINE ALL ON RED',
        date: '.2026',
        body: 'A magazine issue about Las Vegas casino culture, built around the disorienting architecture designed to keep visitors inside, spending and losing track of time.',
        hero: { kind: 'image', src: 'work/heaven-or/elvis-cutout.png', alt: 'Red halftone Elvis impersonator, lying back and pointing' },
        heroBox: { left: 44.5, top: 42, width: 55.5 }, // just below the blurb
        suitTop: 'club',
        suitBottom: 'diamond',
        label: 'spread layouts:',
      },
      {
        type: 'wide',
        width: 200.9,
        hint: 'scroll →',
        image: {
          kind: 'image',
          src: 'work/heaven-or/spread-fill-in-the-blank.webp',
          alt: 'Spread, pages 2–3: "fill in the blank: its not ___ if you always win", with a red casino chip and a slot machine',
        },
      },
      { type: 'image', image: { kind: 'image', src: 'work/heaven-or/page-royal-flush.webp', alt: 'Page 4: a royal flush of hearts beside the opening of the article' } },
      { type: 'image', image: { kind: 'image', src: 'work/heaven-or/page-las-vegas.webp', alt: 'Page 5: article continued, with the red las vegas folio' } },
      { type: 'label', text: 'photo essay:', suits: ['spade'], side: 'right' },
      {
        type: 'carousel',
        background: '#e3202a',
        label: 'Photo essay',
        interval: 4200,
        images: [{ kind: 'image', src: 'work/heaven-or/essay-01.webp', alt: 'Two women in sunglasses and party dresses in a neon-patterned casino lounge' }],
      },
      { type: 'label', text: 'epub:', suits: ['heart'], side: 'left' },
      {
        type: 'epub',
        src: 'work/heaven-or/in-spades-issue-01.epub',
        book: 'work/heaven-or/in-spades/book.xhtml',
        background: '#2f8a3c',
        placeholder: 'EPUB GOES HERE',
        title: 'In Spades, Issue 01: [heaven or] las vegas (flip through the magazine)',
      },
      { type: 'label', text: 'production:', suits: ['club', 'diamond', 'spade', 'heart'], side: 'left' },
      { type: 'image', image: { kind: 'image', src: 'work/heaven-or/production-01.webp', alt: 'The printed magazine held open on the Elvis spread' } },
      { type: 'image', space: 1.6, image: { kind: 'image', src: 'work/heaven-or/production-02.webp', alt: 'The printed magazine open on an article spread' } },
      { type: 'image', space: 1.6, image: { kind: 'image', src: 'work/heaven-or/production-03.webp', alt: 'The printed magazine open on a Welcome to Las Vegas spread' } },
      {
        type: 'note',
        text: "If you or a loved one needs help, don't hesitate\nto reach out. 24/7, free, and confidential.\ncall 1-800-GAMBLER.",
        background: 'linear-gradient(90deg, #f6a3a7 0%, #ef5560 45%, #e3202a 100%)',
        color: '#ffffff',
      },
    ],
  },
];
