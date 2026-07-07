import { SearchCache } from '@/features/search/search-cache';
import type { SearchConfig } from '@/features/search/search-config';
import { SearchIndex } from '@/features/search/search-index';
import { SearchIndexer } from '@/features/search/search-indexer';
import { rankSearchDocuments } from '@/features/search/search-ranking';
import { groupSearchResults } from '@/features/search/search-selectors';
import type {
  SearchProvider,
  SearchProviderContext,
  SearchQuery,
  SearchResponse,
} from '@/features/search/search-types';
import { normalizeSearchText } from '@/features/search/search-utils';

export class SearchEngine {
  private readonly cache: SearchCache;
  private readonly config: SearchConfig;
  private readonly index: SearchIndex;
  private readonly indexer: SearchIndexer;
  private readonly providers = new Map<string, SearchProvider>();

  public constructor(config: SearchConfig) {
    this.cache = new SearchCache(config.cacheSize);
    this.config = config;
    this.index = new SearchIndex();
    this.indexer = new SearchIndexer();
  }

  public registerProvider(provider: SearchProvider): void {
    this.providers.set(provider.id, provider);
    this.cache.clear();
  }

  public updateIndex(context: SearchProviderContext): void {
    const documents = this.indexer.collectDocuments([...this.providers.values()], context);
    const previousVersion = this.index.getVersion();

    this.index.replaceDocuments(documents);

    if (this.index.getVersion() !== previousVersion) {
      this.cache.clear();
    }
  }

  public search(query: SearchQuery): SearchResponse {
    const normalizedQuery = normalizeSearchText(query.text);
    const cacheKey = `${String(this.index.getVersion())}:${normalizedQuery}:${String(query.limit ?? this.config.defaultLimit)}`;
    const cachedResponse = this.cache.get(cacheKey);

    if (cachedResponse !== null) {
      return cachedResponse;
    }

    const rankedResults = rankSearchDocuments(this.index.getAllDocuments(), normalizedQuery).slice(
      0,
      query.limit ?? this.config.defaultLimit,
    );
    const response = groupSearchResults(rankedResults, normalizedQuery);

    this.cache.set(cacheKey, response);

    return response;
  }

  public getDocuments() {
    return this.index.getAllDocuments();
  }

  public getIndexVersion(): number {
    return this.index.getVersion();
  }
}
