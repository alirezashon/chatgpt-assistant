import type { SearchConfig } from '@/features/search/search-config';
import type { SearchRepository } from '@/features/search/search-repository';
import type { SearchHistoryItem } from '@/features/search/search-types';
import { createIsoTimestamp, normalizeSearchText } from '@/features/search/search-utils';

export class SearchHistory {
  private readonly config: SearchConfig;
  private readonly repository: SearchRepository;

  public constructor(repository: SearchRepository, config: SearchConfig) {
    this.config = config;
    this.repository = repository;
  }

  public async load(): Promise<readonly SearchHistoryItem[]> {
    return await this.repository.getHistory();
  }

  public async record(query: string): Promise<readonly SearchHistoryItem[]> {
    const normalizedQuery = normalizeSearchText(query);

    if (normalizedQuery.length === 0) {
      return await this.load();
    }

    const history = await this.repository.getHistory();
    const nextHistory = [
      {
        createdAt: createIsoTimestamp(),
        id: crypto.randomUUID(),
        pinned: false,
        query: normalizedQuery,
      },
      ...history.filter((item) => normalizeSearchText(item.query) !== normalizedQuery),
    ].slice(0, this.config.historyLimit);

    await this.repository.saveHistory(nextHistory);

    return nextHistory;
  }

  public async clear(): Promise<readonly SearchHistoryItem[]> {
    await this.repository.clearHistory();

    return [];
  }
}
