import { useSyncExternalStore } from 'react';

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Dev only: add ?reduce-motion to the URL to preview the reduced-motion version. */
const forceReduced = import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduce-motion');

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)') || forceReduced;
export const useMobile = () => useMedia('(max-width: 767px)');
