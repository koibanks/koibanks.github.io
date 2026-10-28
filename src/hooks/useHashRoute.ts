import { useSyncExternalStore } from 'react';

export type Route = { name: 'cabinet' } | { name: 'project'; id: string } | { name: 'about' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const m = path.match(/^\/project\/([^/?#]+)/);
  if (m) return { name: 'project', id: decodeURIComponent(m[1]) };
  if (path.startsWith('/about')) return { name: 'about' };
  return { name: 'cabinet' };
}

export const hrefFor = {
  cabinet: '#/',
  about: '#/about',
  project: (id: string) => `#/project/${encodeURIComponent(id)}`,
};

/** Returns the raw hash; parse with parseHash (keeps snapshots stable). */
export function useHash(): string {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb);
      return () => window.removeEventListener('hashchange', cb);
    },
    () => window.location.hash,
    () => '',
  );
}
