/**
 * Your own typefaces (fonts that aren't on Google Fonts).
 *
 * To add one: put its files in /public/fonts/<folder>/ and list them here.
 * Any of .woff2, .woff, .otf or .ttf works; the site uses whichever exists
 * (woff2 is smallest, so prefer it). It then shows up under "Yours" in the
 * Design panel's font menus.
 *
 * Licensing: using a font on a website usually needs a *web* licence from the
 * foundry, separate from a desktop licence.
 */
export interface CustomFont {
  id: string;
  /** Name shown in the Design panel. */
  label: string;
  /** CSS family name. */
  family: string;
  /** Folder inside /public/fonts/. */
  folder: string;
  /** File names without extension, with their weight and style. */
  files: { name: string; weight: number; style?: 'normal' | 'italic' }[];
  /** Fallback stack if the files are missing. */
  fallback: string;
}

export const customFonts: CustomFont[] = [
  {
    id: 'parabolica',
    label: 'Parabolica',
    family: 'Parabolica',
    folder: 'parabolica',
    files: [
      { name: 'Parabolica-Regular', weight: 400 },
      { name: 'Parabolica-Medium', weight: 500 },
      { name: 'Parabolica-Bold', weight: 700 },
    ],
    fallback: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  },
];

const FORMATS = [
  ['woff2', 'woff2'],
  ['woff', 'woff'],
  ['otf', 'opentype'],
  ['ttf', 'truetype'],
] as const;

/** All the URLs a file might live at, best format first. */
export const fontFileUrls = (f: CustomFont, name: string) => FORMATS.map(([ext]) => `fonts/${f.folder}/${name}.${ext}`);

/** @font-face rules for every custom font. Browsers only download a file once the font is used. */
export function customFontFaces(): string {
  return customFonts
    .flatMap((f) =>
      f.files.map(
        (file) =>
          `@font-face{font-family:"${f.family}";font-weight:${file.weight};font-style:${file.style ?? 'normal'};font-display:swap;src:${FORMATS.map(
            ([ext, fmt]) => `url("fonts/${f.folder}/${file.name}.${ext}") format("${fmt}")`,
          ).join(',')}}`,
      ),
    )
    .join('\n');
}
