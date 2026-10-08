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
  const [mounted, setMounted] = React.useState(false);
  const settings = useLiveQuery(() => db.settings.get('user_settings'), []);

  React.useEffect(() => {
    setMounted(true);

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
      window.removeEventListener('themechange', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const acceptConsent = React.useCallback(async () => {
    let isPersisted = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
        isPersisted = await navigator.storage.persist();
      }
    } catch {
      isPersisted = false;
    }

    const current = await db.settings.get('user_settings');
    const storedTheme =
      typeof localStorage !== 'undefined'
        ? (localStorage.getItem('treads_theme') as 'light' | 'dark' | null)
        : null;

    const updatedSettings: UserSettings = {
      ...(current || DEFAULT_SETTINGS),
      consentVersion: '1.0',
      consentTimestamp: Date.now(),
      storagePersisted: isPersisted,
      theme: storedTheme ?? current?.theme ?? DEFAULT_SETTINGS.theme,
    };

    await db.settings.put(updatedSettings);
  }, []);

  const syncTheme = React.useCallback(async (theme: 'light' | 'dark' | 'system') => {
    await syncThemeToDexie(theme);
  }, []);

  const isLoading = settings === undefined;
  const hasConsented = settings?.consentVersion === '1.0';
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
