import type { ProviderConfig } from '@/platform/providers/provider-config';
import { createProviderId, createProviderTimestamp } from '@/platform/providers/provider-utils';

export interface ProviderCacheEntry<Value> {
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly id: string;
  readonly key: string;
  readonly value: Value;
}

export class ProviderCache<Value> {
  private readonly config: ProviderConfig;
  private readonly entries = new Map<string, ProviderCacheEntry<Value>>();

  public constructor(config: ProviderConfig) {
    this.config = config;
  }

  public get(key: string): Value | null {
    const entry = this.entries.get(key);

    if (entry === undefined) {
      return null;
    }

    if (new Date(entry.expiresAt).getTime() <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  public set(key: string, value: Value): void {
    this.entries.set(key, {
      createdAt: createProviderTimestamp(),
      expiresAt: new Date(Date.now() + this.config.cacheTtlMs).toISOString(),
      id: createProviderId('provider-cache'),
      key,
      value,
    });
    this.trim();
  }

  public clear(): void {
    this.entries.clear();
  }

  private trim(): void {
    const entries = [...this.entries.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );

    for (const entry of entries.slice(this.config.maxCachedEntries)) {
      this.entries.delete(entry.key);
    }
  }
}
