import { STORAGE_KEYS } from '@/constants/storage';
import type { SearchHistoryItem } from '@/features/search/search-types';
import type { StorageDriver } from '@/storage';

export interface SearchRepository {
  clearHistory(): Promise<void>;
  getHistory(): Promise<readonly SearchHistoryItem[]>;
  saveHistory(history: readonly SearchHistoryItem[]): Promise<void>;
}

export class StorageSearchRepository implements SearchRepository {
  private readonly storage: StorageDriver;

  public constructor(storage: StorageDriver) {
    this.storage = storage;
  }

  public async getHistory(): Promise<readonly SearchHistoryItem[]> {
    const history = await this.storage.get(STORAGE_KEYS.searchHistory);

    if (!Array.isArray(history)) {
      return [];
    }

    return history.filter(isSearchHistoryItem);
  }

  public async saveHistory(history: readonly SearchHistoryItem[]): Promise<void> {
    await this.storage.set(STORAGE_KEYS.searchHistory, history);
  }

  public async clearHistory(): Promise<void> {
    await this.storage.remove(STORAGE_KEYS.searchHistory);
  }
}

function isSearchHistoryItem(value: unknown): value is SearchHistoryItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['pinned'] === 'boolean' &&
    typeof candidate['query'] === 'string'
  );
}
