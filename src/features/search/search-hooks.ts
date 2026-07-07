import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { DEFAULT_SEARCH_CONFIG } from '@/features/search/search-config';
import { getSearchService, type SearchService } from '@/features/search/search-service';
import { searchStore } from '@/features/search/search-store';
import type { SearchResponse, SearchState } from '@/features/search/search-types';

export interface SearchActions {
  readonly clearHistory: () => Promise<void>;
  readonly recordSearch: (query: string) => Promise<void>;
  readonly search: (query: string) => Promise<SearchResponse>;
}

export interface UseSearchResult extends SearchState {
  readonly actions: SearchActions;
  readonly debounceMs: number;
}

export function useSearchState(): SearchState {
  return useSyncExternalStore(
    (listener) => searchStore.subscribe(listener),
    () => searchStore.getState(),
    () => searchStore.getState(),
  );
}

export function useSearchActions(service: SearchService = getSearchService()): SearchActions {
  const search = useCallback(
    async (query: string) => {
      return await service.search(query);
    },
    [service],
  );

  const recordSearch = useCallback(
    async (query: string) => {
      await service.recordSearch(query);
    },
    [service],
  );

  const clearHistory = useCallback(async () => {
    await service.clearHistory();
  }, [service]);

  return useMemo(
    () => ({
      clearHistory,
      recordSearch,
      search,
    }),
    [clearHistory, recordSearch, search],
  );
}

export function useSearch(service: SearchService = getSearchService()): UseSearchResult {
  const state = useSearchState();
  const actions = useSearchActions(service);

  useEffect(() => {
    void service.initialize();
  }, [service]);

  return {
    ...state,
    actions,
    debounceMs: DEFAULT_SEARCH_CONFIG.debounceMs,
  };
}
