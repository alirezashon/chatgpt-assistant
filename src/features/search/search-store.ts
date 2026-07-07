import { createEmptySearchResponse } from '@/features/search/search-selectors';
import type { SearchState } from '@/features/search/search-types';
import { createStore } from '@/state';

export const initialSearchState: SearchState = {
  error: null,
  history: [],
  indexedAt: null,
  query: '',
  response: createEmptySearchResponse(),
  status: 'idle',
  suggestions: [],
};

export const searchStore = createStore<SearchState>(initialSearchState);
