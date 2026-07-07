import { STORAGE_KEYS } from '@/constants/storage';
import { DEFAULT_AI_SETTINGS } from '@/features/ai/ai-config';
import type { AICacheEntry, AIHistoryEntry, AISettings } from '@/features/ai/ai-types';
import { isKnownAITaskType } from '@/features/ai/ai-utils';
import type { StorageDriver } from '@/storage';

export interface AIRepository {
  clearCache(): Promise<void>;
  getCache(): Promise<readonly AICacheEntry[]>;
  getHistory(): Promise<readonly AIHistoryEntry[]>;
  getSettings(): Promise<AISettings>;
  saveCache(entries: readonly AICacheEntry[]): Promise<void>;
  saveHistory(history: readonly AIHistoryEntry[]): Promise<void>;
  saveSettings(settings: AISettings): Promise<void>;
}

export class StorageAIRepository implements AIRepository {
  private readonly storage: StorageDriver;

  public constructor(storage: StorageDriver) {
    this.storage = storage;
  }

  public async getSettings(): Promise<AISettings> {
    const settings = await this.storage.get(STORAGE_KEYS.aiSettings);

    if (!isAISettings(settings)) {
      return DEFAULT_AI_SETTINGS;
    }

    return settings;
  }

  public async saveSettings(settings: AISettings): Promise<void> {
    await this.storage.set(STORAGE_KEYS.aiSettings, settings);
  }

  public async getHistory(): Promise<readonly AIHistoryEntry[]> {
    const history = await this.storage.get(STORAGE_KEYS.aiHistory);

    if (!Array.isArray(history)) {
      return [];
    }

    return history.filter(isAIHistoryEntry);
  }

  public async saveHistory(history: readonly AIHistoryEntry[]): Promise<void> {
    await this.storage.set(STORAGE_KEYS.aiHistory, history);
  }

  public async getCache(): Promise<readonly AICacheEntry[]> {
    const entries = await this.storage.get(STORAGE_KEYS.aiCache);

    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.filter(isAICacheEntry);
  }

  public async saveCache(entries: readonly AICacheEntry[]): Promise<void> {
    await this.storage.set(STORAGE_KEYS.aiCache, entries);
  }

  public async clearCache(): Promise<void> {
    await this.storage.remove(STORAGE_KEYS.aiCache);
  }
}

function isAISettings(value: unknown): value is AISettings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['cacheEnabled'] === 'boolean' &&
    typeof candidate['enabled'] === 'boolean' &&
    typeof candidate['localOnly'] === 'boolean' &&
    typeof candidate['maxConcurrentJobs'] === 'number' &&
    (typeof candidate['providerId'] === 'string' || candidate['providerId'] === null) &&
    typeof candidate['requireExplicitConsent'] === 'boolean'
  );
}

function isAIHistoryEntry(value: unknown): value is AIHistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['jobId'] === 'string' &&
    typeof candidate['status'] === 'string' &&
    isKnownAITaskType(String(candidate['taskType']))
  );
}

function isAICacheEntry(value: unknown): value is AICacheEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['expiresAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['key'] === 'string' &&
    typeof candidate['result'] === 'object' &&
    typeof candidate['taskType'] === 'string' &&
    typeof candidate['version'] === 'string'
  );
}
