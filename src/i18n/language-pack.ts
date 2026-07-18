import { STORAGE_KEYS } from '@/constants/storage';
import { getExtensionUrl, hasChromeRuntime } from '@/lib/chrome/chrome-api';
import { ChromeExtensionStorage } from '@/lib/storage';

export interface LanguagePackManifest {
  readonly code: 'fa';
  readonly features: readonly string[];
  readonly loadedAt: string;
  readonly source: string;
  readonly version: string;
}

/** Preloads local Persian language metadata the first time the user switches to Persian. */
export async function ensurePersianLanguagePack(): Promise<void> {
  if (!hasChromeRuntime()) {
    return;
  }

  const storage = new ChromeExtensionStorage('local');
  const packs = normalizeLanguagePacks(await storage.get(STORAGE_KEYS.languagePacks));

  if (packs['fa'] !== undefined) {
    return;
  }

  const manifest = await fetch(getExtensionUrl('language-packs/fa.json')).then(
    async (response) => (await response.json()) as Omit<LanguagePackManifest, 'loadedAt'>,
  );

  await storage.set(STORAGE_KEYS.languagePacks, {
    ...packs,
    fa: {
      ...manifest,
      loadedAt: new Date().toISOString(),
    },
  } satisfies Readonly<Record<string, LanguagePackManifest>>);
}

function normalizeLanguagePacks(value: unknown): Readonly<Record<string, LanguagePackManifest>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Readonly<Record<string, LanguagePackManifest>>;
}
