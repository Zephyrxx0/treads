'use client';

import * as React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, type UserSettings } from '@/lib/db';

export async function syncThemeToDexie(theme: 'light' | 'dark' | 'system'): Promise<void> {
  try {
    const current = await db.settings.get('user_settings');
    await db.settings.put({
      ...(current || DEFAULT_SETTINGS),
      theme,
    });
  } catch (err) {
    console.error('Failed to sync theme to Dexie:', err);
  }
}

export function useConsent() {
  // All state — nothing read from localStorage synchronously at render time
  const [mounted, setMounted] = React.useState(false);
  const [directSettings, setDirectSettings] = React.useState<UserSettings | null>(null);
  const [timedOut, setTimedOut] = React.useState(false);
  const [hasLocalConsent, setHasLocalConsent] = React.useState(false);

  const liveSettings = useLiveQuery(() => db.settings.get('user_settings'), []);

  React.useEffect(() => {
    setMounted(true);

    // Read localStorage only on the client inside useEffect
    try {
      if (localStorage.getItem('treads_consented') === 'true') {
        setHasLocalConsent(true);
      }
    } catch {}

    let active = true;

    // Direct Dexie fetch as fallback for slow/stalled useLiveQuery
    db.settings.get('user_settings')
      .then((s) => {
        if (!active) return;
        if (s) {
          setDirectSettings(s);
          // Also sync local consent flag from Dexie
          if (s.consentVersion === '1.0.0' || s.consentVersion === '1.0') {
            setHasLocalConsent(true);
            try { localStorage.setItem('treads_consented', 'true'); } catch {}
          }
        }
      })
      .catch(() => {});

    // Ensure we never stay indefinitely in loading state on mobile
    const timer = setTimeout(() => {
      if (active) setTimedOut(true);
    }, 1500);

    const handleThemeChange = async (e: Event) => {
      const customEvent = e as CustomEvent<{ theme?: 'light' | 'dark' | 'system' }>;
      const theme =
        customEvent.detail?.theme ||
        (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      await syncThemeToDexie(theme);
    };

    const handleStorage = async (e: StorageEvent) => {
      if (e.key === 'treads_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        await syncThemeToDexie(e.newValue);
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('themechange', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Prefer liveSettings, fall back to directSettings from one-shot fetch
  const settings = liveSettings ?? directSettings;

  const acceptConsent = React.useCallback(async () => {
    let isPersisted = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
        isPersisted = await navigator.storage.persist();
      }
    } catch {
      isPersisted = false;
    }

    try {
      localStorage.setItem('treads_consented', 'true');
      setHasLocalConsent(true);
    } catch {}

    const current = await db.settings.get('user_settings');
    const storedTheme =
      typeof localStorage !== 'undefined'
        ? (localStorage.getItem('treads_theme') as 'light' | 'dark' | null)
        : null;

    const updatedSettings: UserSettings = {
      ...(current || DEFAULT_SETTINGS),
      consentVersion: '1.0.0',
      consentTimestamp: Date.now(),
      storagePersisted: isPersisted,
      theme: storedTheme ?? current?.theme ?? DEFAULT_SETTINGS.theme,
    };

    await db.settings.put(updatedSettings);
    setDirectSettings(updatedSettings);
  }, []);

  const syncTheme = React.useCallback(async (theme: 'light' | 'dark' | 'system') => {
    await syncThemeToDexie(theme);
  }, []);

  // isLoading: true only if we haven't timed out, have no data, AND no local consent signal
  const isLoading = !mounted || (!timedOut && settings === undefined && !hasLocalConsent);
  const hasConsented =
    hasLocalConsent ||
    settings?.consentVersion === '1.0.0' ||
    settings?.consentVersion === '1.0';
  const consentTimestamp = settings?.consentTimestamp ?? null;
  const storagePersisted = settings?.storagePersisted ?? false;

  return {
    mounted,
    isLoading,
    hasConsented,
    consentTimestamp,
    storagePersisted,
    settings: settings ?? DEFAULT_SETTINGS,
    acceptConsent,
    syncThemeToDexie: syncTheme,
  };
}
