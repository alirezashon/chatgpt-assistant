import { STORAGE_KEYS } from '@/constants/storage';
import { hasChromeRuntime } from '@/lib/chrome/chrome-api';
import { ChromeExtensionStorage } from '@/lib/storage';

import { parseCommandFavorites } from './command-favorite-manager';
import { parseCommandHistory } from './command-history-manager';
import type { PaletteCommandHistoryEntry } from './command-palette-types';

/** Persisted command palette user memory. */
export interface PersistedCommandPaletteState {
  readonly favorites: readonly string[];
  readonly history: readonly PaletteCommandHistoryEntry[];
}

/** Loads persisted command history and favorites. */
export async function loadCommandPaletteState(): Promise<PersistedCommandPaletteState> {
  if (!hasChromeRuntime()) {
    return {
      favorites: [],
      history: [],
    };
  }

  const storage = new ChromeExtensionStorage('local');
  const values = await storage.getMany([
    STORAGE_KEYS.commandFavorites,
    STORAGE_KEYS.commandHistory,
  ]);

  return {
    favorites: parseCommandFavorites(values[STORAGE_KEYS.commandFavorites]),
    history: parseCommandHistory(values[STORAGE_KEYS.commandHistory]),
  };
}

/** Persists command history. */
export async function saveCommandHistory(
  history: readonly PaletteCommandHistoryEntry[],
): Promise<void> {
  if (!hasChromeRuntime()) {
    return;
  }

  const storage = new ChromeExtensionStorage('local');
  await storage.set(STORAGE_KEYS.commandHistory, history);
}

/** Persists favorite commands. */
export async function saveCommandFavorites(favorites: readonly string[]): Promise<void> {
  if (!hasChromeRuntime()) {
    return;
  }

  const storage = new ChromeExtensionStorage('local');
  await storage.set(STORAGE_KEYS.commandFavorites, favorites);
}
