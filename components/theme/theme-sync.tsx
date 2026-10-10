'use client';

import * as React from 'react';
import { syncThemeToDexie } from '@/hooks/use-consent';

export function ThemeSync() {
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('treads_theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: 'light' | 'dark' =
        stored === 'dark' || (!stored && systemDark) ? 'dark' : 'light';
      syncThemeToDexie(initialTheme);
    } catch {}

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme?: 'light' | 'dark' | 'system' }>;
      const theme =
        customEvent.detail?.theme ||
        (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      syncThemeToDexie(theme);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'treads_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        syncThemeToDexie(e.newValue);
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    window.addEventListener('storage', handleStorage);

    // One-time user interaction unlock for Web Audio on mobile browsers
    const handleFirstInteraction = () => {
      import('@/lib/audio/cuelume').then(({ unlockAudio }) => {
        unlockAudio();
      }).catch(() => {});
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  return null;
}
