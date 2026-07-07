import type { FavoriteState } from '@/features/favorites/favorite-types';
import { createStore } from '@/state';

export const initialFavoriteState: FavoriteState = {
  error: null,
  favorites: [],
  status: 'idle',
};

export const favoriteStore = createStore<FavoriteState>(initialFavoriteState);
