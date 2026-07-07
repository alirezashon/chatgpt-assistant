import { workspaceStore } from '@/app/workspace/workspace-state';
import { DEFAULT_SEARCH_CONFIG, type SearchConfig } from '@/features/search/search-config';
import {
  SearchEvents,
  type SearchEventListener,
  type SearchEventName,
  type SearchEventUnsubscribe,
} from '@/features/search/search-events';
import { SearchEngine } from '@/features/search/search-engine';
import { SearchHistory } from '@/features/search/search-history';
import { DEFAULT_SEARCH_PROVIDERS } from '@/features/search/search-providers';
import {
  StorageSearchRepository,
  type SearchRepository,
} from '@/features/search/search-repository';
import { createEmptySearchResponse } from '@/features/search/search-selectors';
import { createSearchSuggestions } from '@/features/search/search-suggestions';
import { searchStore } from '@/features/search/search-store';
import type { SearchProvider, SearchResponse, SearchState } from '@/features/search/search-types';
import { createIsoTimestamp, normalizeSearchText } from '@/features/search/search-utils';
import type { Logger } from '@/shared/logger';
import { logger as defaultLogger } from '@/shared/logger';
import type { Store, Unsubscribe } from '@/state';
import { ChromeStorageDriver } from '@/storage';

export interface SearchService {
  clearHistory(): Promise<void>;
  destroy(): void;
  getState(): SearchState;
  initialize(): Promise<void>;
  recordSearch(query: string): Promise<void>;
  registerProvider(provider: SearchProvider): void;
  search(query: string): Promise<SearchResponse>;
  subscribe<EventName extends SearchEventName>(
    eventName: EventName,
    listener: SearchEventListener<EventName>,
  ): SearchEventUnsubscribe;
}

interface SearchServiceOptions {
  readonly config?: SearchConfig;
  readonly engine?: SearchEngine;
  readonly events?: SearchEvents;
  readonly logger?: Logger;
  readonly providers?: readonly SearchProvider[];
  readonly repository: SearchRepository;
  readonly store?: Store<SearchState>;
}

export class DefaultSearchService implements SearchService {
  private readonly config: SearchConfig;
  private readonly engine: SearchEngine;
  private readonly events: SearchEvents;
  private readonly history: SearchHistory;
  private readonly logger: Logger;
  private readonly providers: readonly SearchProvider[];
  private readonly store: Store<SearchState>;
  private initialized = false;
  private unsubscribeFromWorkspace: Unsubscribe | null = null;

  public constructor(options: SearchServiceOptions) {
    this.config = options.config ?? DEFAULT_SEARCH_CONFIG;
    this.engine = options.engine ?? new SearchEngine(this.config);
    this.events = options.events ?? new SearchEvents();
    this.history = new SearchHistory(options.repository, this.config);
    this.logger = options.logger ?? defaultLogger;
    this.providers = options.providers ?? DEFAULT_SEARCH_PROVIDERS;
    this.store = options.store ?? searchStore;

    for (const provider of this.providers) {
      this.engine.registerProvider(provider);
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.store.setState({
      error: null,
      status: 'indexing',
    });

    try {
      const history = await this.history.load();

      this.updateIndex();
      this.unsubscribeFromWorkspace = workspaceStore.subscribe(() => {
        this.updateIndex();
      });
      this.store.setState({
        error: null,
        history,
        indexedAt: createIsoTimestamp(),
        status: 'ready',
        suggestions: createSearchSuggestions('', this.engine.getDocuments(), history, this.config),
      });
    } catch (error) {
      const searchError = toSearchError(error);

      this.store.setState({
        error: searchError,
        status: 'error',
      });
      this.events.emit('searchFailed', {
        error: searchError,
      });
      this.logger.error('Search initialization failed.', searchError);
    }
  }

  public getState(): SearchState {
    return this.store.getState();
  }

  public registerProvider(provider: SearchProvider): void {
    this.engine.registerProvider(provider);
    this.updateIndex();
  }

  public async search(query: string): Promise<SearchResponse> {
    await this.initialize();
    const normalizedQuery = normalizeSearchText(query);

    if (normalizedQuery.length === 0) {
      const response = createEmptySearchResponse();

      this.store.setState({
        error: null,
        query: '',
        response,
        status: 'ready',
        suggestions: createSearchSuggestions(
          '',
          this.engine.getDocuments(),
          this.store.getState().history,
          this.config,
        ),
      });

      return response;
    }

    this.events.emit('searchStarted', {
      query: normalizedQuery,
    });
    this.store.setState({
      error: null,
      query: normalizedQuery,
      status: 'searching',
    });

    try {
      const response = this.engine.search({
        text: normalizedQuery,
      });

      this.store.setState({
        error: null,
        query: normalizedQuery,
        response,
        status: 'ready',
        suggestions: createSearchSuggestions(
          normalizedQuery,
          this.engine.getDocuments(),
          this.store.getState().history,
          this.config,
        ),
      });
      this.events.emit('searchCompleted', {
        response,
      });

      return response;
    } catch (error) {
      const searchError = toSearchError(error);

      this.store.setState({
        error: searchError,
        status: 'error',
      });
      this.events.emit('searchFailed', {
        error: searchError,
      });
      throw searchError;
    }
  }

  public async recordSearch(query: string): Promise<void> {
    const history = await this.history.record(query);

    this.store.setState({
      history,
      suggestions: createSearchSuggestions(
        this.store.getState().query,
        this.engine.getDocuments(),
        history,
        this.config,
      ),
    });
  }

  public async clearHistory(): Promise<void> {
    const history = await this.history.clear();

    this.store.setState({
      history,
      suggestions: createSearchSuggestions(
        this.store.getState().query,
        this.engine.getDocuments(),
        history,
        this.config,
      ),
    });
  }

  public destroy(): void {
    this.unsubscribeFromWorkspace?.();
    this.unsubscribeFromWorkspace = null;
    this.initialized = false;
  }

  public subscribe<EventName extends SearchEventName>(
    eventName: EventName,
    listener: SearchEventListener<EventName>,
  ): SearchEventUnsubscribe {
    return this.events.subscribe(eventName, listener);
  }

  private updateIndex(): void {
    const previousVersion = this.engine.getIndexVersion();

    this.engine.updateIndex({
      workspace: workspaceStore.getState(),
    });

    if (this.engine.getIndexVersion() === previousVersion) {
      return;
    }

    this.events.emit('indexUpdated', {
      documentCount: this.engine.getDocuments().length,
      version: this.engine.getIndexVersion(),
    });
    this.store.setState({
      indexedAt: createIsoTimestamp(),
      suggestions: createSearchSuggestions(
        this.store.getState().query,
        this.engine.getDocuments(),
        this.store.getState().history,
        this.config,
      ),
    });
  }
}

let defaultSearchService: SearchService | null = null;

export function configureSearchService(service: SearchService): void {
  defaultSearchService = service;
}

export function getSearchService(): SearchService {
  defaultSearchService ??= new DefaultSearchService({
    repository: new StorageSearchRepository(new ChromeStorageDriver()),
  });

  return defaultSearchService;
}

function toSearchError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown search error.');
}
