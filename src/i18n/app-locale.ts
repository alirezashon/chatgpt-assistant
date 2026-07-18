import { STORAGE_KEYS } from '@/constants/storage';
import { hasChromeRuntime } from '@/lib/chrome/chrome-api';
import { ChromeExtensionStorage } from '@/lib/storage';

import { ensurePersianLanguagePack } from './language-pack';

export const SUPPORTED_APP_LOCALES = ['fa', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_APP_LOCALES)[number];
export type AppDirection = 'ltr' | 'rtl';

export const DEFAULT_APP_LOCALE: AppLocale = 'en';

export const APP_LOCALE_OPTIONS: readonly {
  readonly label: string;
  readonly locale: AppLocale;
  readonly nativeLabel: string;
}[] = [
  { label: 'فارسی', locale: 'fa', nativeLabel: 'فارسی' },
  { label: 'English', locale: 'en', nativeLabel: 'English' },
];

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'fa' || value === 'en';
}

export function localeDirection(locale: AppLocale): AppDirection {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

export function localeName(locale: AppLocale): string {
  return locale === 'fa' ? 'فارسی' : 'English';
}

export async function loadAppLocale(): Promise<AppLocale> {
  if (!hasChromeRuntime()) {
    return DEFAULT_APP_LOCALE;
  }

  try {
    const storage = new ChromeExtensionStorage('local');
    const stored = await storage.get(STORAGE_KEYS.appLocale);

    return isAppLocale(stored) ? stored : DEFAULT_APP_LOCALE;
  } catch {
    return DEFAULT_APP_LOCALE;
  }
}

export async function saveAppLocale(locale: AppLocale): Promise<void> {
  if (!hasChromeRuntime()) {
    return;
  }

  if (locale === 'fa') {
    await ensurePersianLanguagePack();
  }

  const storage = new ChromeExtensionStorage('local');
  await storage.set(STORAGE_KEYS.appLocale, locale);
}
