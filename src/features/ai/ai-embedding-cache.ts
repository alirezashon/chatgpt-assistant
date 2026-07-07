import type { AIConfig } from '@/features/ai/ai-config';
import type { AIEmbeddingCacheEntry, AIEmbeddingVector } from '@/features/ai/ai-types';
import { createAIId, createAITimestamp } from '@/features/ai/ai-utils';

export class AIEmbeddingCache {
  private readonly config: AIConfig;
  private readonly entries = new Map<string, AIEmbeddingCacheEntry>();

  public constructor(config: AIConfig) {
    this.config = config;
  }

  public get(key: string): AIEmbeddingVector | null {
    const entry = this.entries.get(key);

    if (entry === undefined) {
      return null;
    }

    if (entry.version !== this.config.cacheVersion || this.isExpired(entry)) {
      this.entries.delete(key);
      return null;
    }

    return entry.vector;
  }

  public set(key: string, vector: AIEmbeddingVector): void {
    this.entries.set(key, {
      createdAt: createAITimestamp(),
      expiresAt: new Date(Date.now() + this.config.cacheTtlMs).toISOString(),
      id: createAIId('ai-embedding-cache'),
      key,
      vector,
      version: this.config.cacheVersion,
    });
    this.trim();
  }

  public clear(): void {
    this.entries.clear();
  }

  public serialize(): readonly AIEmbeddingCacheEntry[] {
    return [...this.entries.values()];
  }

  private trim(): void {
    const entries = [...this.entries.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );

    for (const entry of entries.slice(this.config.maxCacheEntries)) {
      this.entries.delete(entry.key);
    }
  }

  private isExpired(entry: AIEmbeddingCacheEntry): boolean {
    return new Date(entry.expiresAt).getTime() <= Date.now();
  }
}
