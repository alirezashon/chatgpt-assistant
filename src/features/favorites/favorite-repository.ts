import { STORAGE_KEYS } from '@/constants/storage';
import type { ConversationFavorite } from '@/features/favorites/favorite-types';
import type { StorageDriver, StorageUnsubscribe } from '@/storage';

export interface FavoriteRepository {
  getFavorites(): Promise<readonly ConversationFavorite[]>;
  saveFavorites(favorites: readonly ConversationFavorite[]): Promise<void>;
  subscribe(listener: () => void): StorageUnsubscribe;
}

export class StorageFavoriteRepository implements FavoriteRepository {
  private readonly storage: StorageDriver;

  public constructor(storage: StorageDriver) {
    this.storage = storage;
  }

  public async getFavorites(): Promise<readonly ConversationFavorite[]> {
    const storedFavorites = await this.storage.get(STORAGE_KEYS.favorites);

    if (!Array.isArray(storedFavorites)) {
      return [];
    }

    return storedFavorites.filter(isConversationFavorite);
  }

  public async saveFavorites(favorites: readonly ConversationFavorite[]): Promise<void> {
    await this.storage.set(STORAGE_KEYS.favorites, favorites);
  }

  public subscribe(listener: () => void): StorageUnsubscribe {
    return this.storage.subscribe((changes) => {
      if (changes.some((change) => change.key === STORAGE_KEYS.favorites)) {
        listener();
      }
    });
  }
}

function isConversationFavorite(value: unknown): value is ConversationFavorite {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['conversationId'] === 'string' &&
    typeof candidate['createdAt'] === 'string' &&
    (candidate['groupId'] === null || typeof candidate['groupId'] === 'string')
  );
}
