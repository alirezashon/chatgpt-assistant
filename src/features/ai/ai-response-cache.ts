import type { AIConfig } from '@/features/ai/ai-config';
import type { AICacheEntry, AITaskResult, AITaskType } from '@/features/ai/ai-types';
import { createAIId, createAITimestamp } from '@/features/ai/ai-utils';

export class AIResponseCache {
  private readonly config: AIConfig;
  private readonly entries = new Map<string, AICacheEntry>();

  public constructor(config: AIConfig) {
    this.config = config;
  }

  public hydrate(entries: readonly AICacheEntry[]): void {
    this.entries.clear();

    for (const entry of entries) {
      if (!this.isExpired(entry)) {
        this.entries.set(entry.key, entry);
      }
    }
  }

  public get(key: string): AITaskResult | null {
    const entry = this.entries.get(key);

    if (entry === undefined) {
      return null;
    }

    if (entry.version !== this.config.cacheVersion || this.isExpired(entry)) {
      this.entries.delete(key);
      return null;
    }

    return entry.result;
  }

  public set(key: string, taskType: AITaskType, result: AITaskResult): void {
    const createdAt = createAITimestamp();
    const expiresAt = new Date(Date.now() + this.config.cacheTtlMs).toISOString();

    this.entries.set(key, {
      createdAt,
      expiresAt,
      id: createAIId('ai-cache'),
      key,
      result,
      taskType,
      version: this.config.cacheVersion,
    });
    this.trim();
  }

  public clear(): void {
    this.entries.clear();
  }

  public invalidate(predicate: (entry: AICacheEntry) => boolean): void {
    for (const entry of this.entries.values()) {
      if (predicate(entry)) {
        this.entries.delete(entry.key);
      }
    }
  }

  public serialize(): readonly AICacheEntry[] {
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

  private isExpired(entry: AICacheEntry): boolean {
    return new Date(entry.expiresAt).getTime() <= Date.now();
  }
}
