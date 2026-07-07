import type { SearchResponse } from '@/features/search/search-types';

export class SearchCache {
  private readonly cache = new Map<string, SearchResponse>();
  private readonly maxSize: number;

  public constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  public get(key: string): SearchResponse | null {
    const value = this.cache.get(key);

    if (value === undefined) {
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  public set(key: string, value: SearchResponse): void {
    this.cache.set(key, value);

    if (this.cache.size <= this.maxSize) {
      return;
    }

    const oldestKey = this.cache.keys().next().value;

    if (typeof oldestKey === 'string') {
      this.cache.delete(oldestKey);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}
