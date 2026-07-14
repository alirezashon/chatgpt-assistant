import { DEFAULT_SETTINGS } from '@/constants/settings';
import { STORAGE_KEYS } from '@/constants/storage';
import { applyWorkspaceThemeTokens } from '@/content/shadow/create-extension-shadow-root';
import { ChromeStorageDriver, type StorageValue } from '@/storage';
import type { WorkspaceSettings, WorkspaceThemePreset } from '@/shared/types';

export async function installWorkspaceThemeSync(hostElement: HTMLElement): Promise<() => void> {
  const storage = new ChromeStorageDriver();

  applyWorkspaceThemeTokens(
    hostElement,
    normalizeWorkspaceSettings(await storage.get(STORAGE_KEYS.settings)),
  );

  return storage.subscribe((changes) => {
    const settingsChange = changes.find((change) => change.key === STORAGE_KEYS.settings);

    if (settingsChange === undefined) {
      return;
    }

    applyWorkspaceThemeTokens(hostElement, normalizeWorkspaceSettings(settingsChange.newValue));
  });
}

function normalizeWorkspaceSettings(value: StorageValue): WorkspaceSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return DEFAULT_SETTINGS;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return {
    enableDebugLogging:
      typeof candidate['enableDebugLogging'] === 'boolean'
        ? candidate['enableDebugLogging']
        : DEFAULT_SETTINGS.enableDebugLogging,
    schemaVersion: DEFAULT_SETTINGS.schemaVersion,
    sidebarWidth:
      typeof candidate['sidebarWidth'] === 'number'
        ? Math.min(520, Math.max(320, Math.round(candidate['sidebarWidth'])))
        : DEFAULT_SETTINGS.sidebarWidth,
    theme:
      candidate['theme'] === 'light' || candidate['theme'] === 'system'
        ? candidate['theme']
        : DEFAULT_SETTINGS.theme,
    themePreset: normalizeThemePreset(candidate['themePreset']),
  };
}

function normalizeThemePreset(value: unknown): WorkspaceThemePreset {
  return value === 'classic' || value === 'mint' || value === 'ocean' || value === 'violet'
    ? value
    : DEFAULT_SETTINGS.themePreset;
}
