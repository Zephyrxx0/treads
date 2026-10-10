'use client';

import { useSyncExternalStore } from 'react';

/** Tracks a CSS media query. `serverValue` is what renders on the server and during hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
