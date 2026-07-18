import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage';

import {
  DEFAULT_APP_LOCALE,
  isAppLocale,
  loadAppLocale,
  saveAppLocale,
  type AppLocale,
} from './app-locale';

export function useAppLocale(): readonly [AppLocale, (locale: AppLocale) => Promise<void>] {
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_APP_LOCALE);

  useEffect(() => {
    let cancelled = false;

    void loadAppLocale().then((loadedLocale) => {
      if (!cancelled) {
        setLocale(loadedLocale);
      }
    });

    const chromeGlobal = (
      globalThis as { readonly chrome?: { readonly storage?: typeof chrome.storage } }
    ).chrome;
    const storageEvents = chromeGlobal?.storage?.onChanged;

    if (storageEvents === undefined) {
      return () => {
        cancelled = true;
      };
    }

    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') {
        return;
      }

      const localeChange = changes[STORAGE_KEYS.appLocale];

      if (localeChange !== undefined && isAppLocale(localeChange.newValue)) {
        setLocale(localeChange.newValue);
      }
    };

    storageEvents.addListener(listener);

    return () => {
      cancelled = true;
      storageEvents.removeListener(listener);
    };
  }, []);

  const updateLocale = useCallback(async (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    await saveAppLocale(nextLocale);
  }, []);

  return [locale, updateLocale] as const;
}
