import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const DESIGN_FILE = fileURLToPath(new URL('./src/data/design.json', import.meta.url));
const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
const WORK_DIR = join(PUBLIC_DIR, 'work');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.mp4', '.webm', '.mov', '.m4v', '.epub']);
const MAX_UPLOAD = 120 * 1024 * 1024; // 120 MB (videos)

/** Every image or video under public/work, as paths the site can use (e.g. "work/polished/words.png"). */
function listImages(dir = WORK_DIR): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listImages(full);
    return IMAGE_EXT.has(extname(name).toLowerCase()) ? [relative(PUBLIC_DIR, full).split(sep).join('/')] : [];
  });
}

/**
 * Dev only (npm run dev): endpoints the Design panel uses.
 *   POST /__design         save settings to src/data/design.json
 *   GET  /__images         list images and videos in public/work
 *   POST /__upload?project=<id>&name=<file>   add an image/video to public/work/<id>/
 * None of this is part of the built site.
 */
function designTools(): Plugin {
  return {
    name: 'design-tools',
    apply: 'serve',
    configureServer(server) {
      const readBody = (req: import('node:http').IncomingMessage, limit: number) =>
        new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          let size = 0;
          req.on('data', (c: Buffer) => {
            size += c.length;
            if (size > limit) {
              reject(new Error('too big'));
              req.destroy();
            } else chunks.push(c);
          });
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', reject);
        });
      const json = (res: import('node:http').ServerResponse, status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      };

      server.middlewares.use('/__design', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false });
        try {
          const data = JSON.parse((await readBody(req, 200_000)).toString('utf8'));
          if (!data || typeof data !== 'object' || typeof data.home !== 'string' || typeof data.colors !== 'object') {
            throw new Error('not a design file');
          }
          writeFileSync(DESIGN_FILE, JSON.stringify(data, null, 2) + '\n');
          json(res, 200, { ok: true });
        } catch {
          json(res, 400, { ok: false });
        }
      });

      server.middlewares.use('/__images', (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false });
        json(res, 200, { images: listImages() });
      });

      server.middlewares.use('/__upload', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false });
        try {
          const url = new URL(req.url ?? '', 'http://x');
          const project = url.searchParams.get('project') ?? '';
          const rawName = url.searchParams.get('name') ?? '';
          if (!/^[a-z0-9-]{1,60}$/.test(project)) throw new Error('bad project');
          const ext = extname(rawName).toLowerCase();
          if (!IMAGE_EXT.has(ext)) throw new Error('not an image');
          const base =
            rawName
              .slice(0, -ext.length)
              .replace(/[^a-zA-Z0-9._-]+/g, '-')
              .replace(/^[-.]+/, '')
              .slice(0, 60) || 'image';
          const dir = join(WORK_DIR, project);
          mkdirSync(dir, { recursive: true });
          // Never overwrite: add -1, -2… if the name is taken.
          let name = base + ext;
          for (let n = 1; existsSync(join(dir, name)); n++) name = `${base}-${n}${ext}`;
          const data = await readBody(req, MAX_UPLOAD);
          if (!data.length) throw new Error('empty');
          writeFileSync(join(dir, name), data);
          json(res, 200, { ok: true, src: `work/${project}/${name}` });
        } catch (e) {
          json(res, 400, { ok: false, error: (e as Error).message });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), designTools()],
  base: './',
});
