import {
  StorageFavoriteRepository,
  type FavoriteRepository,
} from '@/features/favorites/favorite-repository';
import { favoriteStore } from '@/features/favorites/favorite-store';
import type {
  ConversationFavorite,
  FavoriteState,
  ToggleFavoriteInput,
} from '@/features/favorites/favorite-types';
import type { EntityId } from '@/shared/types';
import type { Store } from '@/state';
import { ChromeStorageDriver, type StorageUnsubscribe } from '@/storage';

export interface FavoriteService {
  initialize(): Promise<void>;
  isFavorite(conversationId: EntityId): boolean;
  listFavorites(): Promise<readonly ConversationFavorite[]>;
  setFavorite(conversationId: EntityId, favorite: boolean): Promise<void>;
  toggleFavorite(input: ToggleFavoriteInput): Promise<boolean>;
}

interface FavoriteServiceOptions {
  readonly clock?: () => Date;
  readonly repository: FavoriteRepository;
  readonly store?: Store<FavoriteState>;
}

export class DefaultFavoriteService implements FavoriteService {
  private readonly clock: () => Date;
  private readonly repository: FavoriteRepository;
  private readonly store: Store<FavoriteState>;
  private unsubscribeFromRepository: StorageUnsubscribe | null = null;

  public constructor(options: FavoriteServiceOptions) {
    this.clock = options.clock ?? createCurrentDate;
    this.repository = options.repository;
    this.store = options.store ?? favoriteStore;
  }

  public async initialize(): Promise<void> {
    this.unsubscribeFromRepository ??= this.repository.subscribe(() => {
      void this.synchronizeFromRepository();
    });

    await this.synchronizeFromRepository();
  }

  public async listFavorites(): Promise<readonly ConversationFavorite[]> {
    return await this.synchronizeFromRepository();
  }

  public isFavorite(conversationId: EntityId): boolean {
    return this.store
      .getState()
      .favorites.some((favorite) => favorite.conversationId === conversationId);
  }

  public async toggleFavorite(input: ToggleFavoriteInput): Promise<boolean> {
    const nextFavorite = !this.isFavorite(input.conversationId);

    await this.setFavorite(input.conversationId, nextFavorite);

    return nextFavorite;
  }

  public async setFavorite(conversationId: EntityId, favorite: boolean): Promise<void> {
    const previousState = this.store.getState();
    const currentFavorites = previousState.favorites;
    const nextFavorites = favorite
      ? upsertFavorite(currentFavorites, {
          conversationId,
          createdAt: this.clock().toISOString(),
          groupId: null,
        })
      : currentFavorites.filter((item) => item.conversationId !== conversationId);

    this.store.setState({
      error: null,
      favorites: nextFavorites,
      status: 'saving',
    });

    try {
      await this.repository.saveFavorites(nextFavorites);
      this.store.setState({
        error: null,
        favorites: nextFavorites,
        status: 'ready',
      });
    } catch (error) {
      this.store.replaceState(previousState);
      this.store.setState({
        error: toFavoriteError(error),
        status: 'error',
      });
      throw error;
    }
  }

  private async synchronizeFromRepository(): Promise<readonly ConversationFavorite[]> {
    this.store.setState({
      error: null,
      status: 'loading',
    });

    try {
      const favorites = await this.repository.getFavorites();

      this.store.setState({
        error: null,
        favorites,
        status: 'ready',
      });

      return favorites;
    } catch (error) {
      this.store.setState({
        error: toFavoriteError(error),
        status: 'error',
      });
      throw error;
    }
  }
}

let defaultFavoriteService: FavoriteService | null = null;

export function configureFavoriteService(service: FavoriteService): void {
  defaultFavoriteService = service;
}

export function getFavoriteService(): FavoriteService {
  defaultFavoriteService ??= new DefaultFavoriteService({
    repository: new StorageFavoriteRepository(new ChromeStorageDriver()),
  });

  return defaultFavoriteService;
}

function createCurrentDate(): Date {
  return new Date();
}

function upsertFavorite(
  favorites: readonly ConversationFavorite[],
  favorite: ConversationFavorite,
): readonly ConversationFavorite[] {
  return [...favorites.filter((item) => item.conversationId !== favorite.conversationId), favorite];
}

function toFavoriteError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown favorite error.');
}
