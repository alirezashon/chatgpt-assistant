import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { getFavoriteService, type FavoriteService } from '@/features/favorites/favorite-service';
import { favoriteStore } from '@/features/favorites/favorite-store';
import type { FavoriteState, ToggleFavoriteInput } from '@/features/favorites/favorite-types';
import type { EntityId } from '@/shared/types';

export interface FavoriteActions {
  readonly setFavorite: (conversationId: EntityId, favorite: boolean) => Promise<void>;
  readonly toggleFavorite: (input: ToggleFavoriteInput) => Promise<boolean>;
}

export interface UseFavoritesResult extends FavoriteState {
  readonly actions: FavoriteActions;
  readonly favoriteIds: ReadonlySet<EntityId>;
}

export function useFavoriteState(): FavoriteState {
  return useSyncExternalStore(
    (listener) => favoriteStore.subscribe(listener),
    () => favoriteStore.getState(),
    () => favoriteStore.getState(),
  );
}

export function useFavoriteActions(
  service: FavoriteService = getFavoriteService(),
): FavoriteActions {
  const toggleFavorite = useCallback(
    async (input: ToggleFavoriteInput) => {
      return await service.toggleFavorite(input);
    },
    [service],
  );

  const setFavorite = useCallback(
    async (conversationId: EntityId, favorite: boolean) => {
      await service.setFavorite(conversationId, favorite);
    },
    [service],
  );

  return useMemo(
    () => ({
      setFavorite,
      toggleFavorite,
    }),
    [setFavorite, toggleFavorite],
  );
}

export function useFavorites(service: FavoriteService = getFavoriteService()): UseFavoritesResult {
  const state = useFavoriteState();
  const actions = useFavoriteActions(service);
  const favoriteIds = useMemo(
    () => new Set(state.favorites.map((favorite) => favorite.conversationId)),
    [state.favorites],
  );

  useEffect(() => {
    void service.initialize();
  }, [service]);

  return {
    ...state,
    actions,
    favoriteIds,
  };
}
