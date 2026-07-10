import { describe, expect, it } from 'vitest';

import { clearLocalAICache, inspectLocalAICache } from '@/features/ai/ai-cache-controls';
import type { AIRepository } from '@/features/ai/ai-repository';
import type { AICacheEntry } from '@/features/ai/ai-types';

describe('AI cache controls', () => {
  it('inspects and clears local AI cache entries', async () => {
    const repository = createRepository([
      createCacheEntry('cache-1', 'conversation-summarization', '2026-07-09T00:00:00.000Z'),
      createCacheEntry('cache-2', 'tag-recommendation', '2026-07-10T00:00:00.000Z'),
    ]);

    await expect(inspectLocalAICache(repository)).resolves.toMatchObject({
      entryCount: 2,
      newestEntryAt: '2026-07-10T00:00:00.000Z',
      oldestEntryAt: '2026-07-09T00:00:00.000Z',
      taskTypes: ['conversation-summarization', 'tag-recommendation'],
    });
    await expect(clearLocalAICache(repository)).resolves.toMatchObject({
      entryCount: 0,
    });
  });
});

function createRepository(initialEntries: readonly AICacheEntry[]): AIRepository {
  let entries = [...initialEntries];

  return {
    clearCache: () => {
      entries = [];
      return Promise.resolve();
    },
    getCache: () => Promise.resolve(entries),
    getHistory: () => Promise.resolve([]),
    getSettings: () => Promise.reject(new Error('Not needed.')),
    saveCache: (nextEntries) => {
      entries = [...nextEntries];
      return Promise.resolve();
    },
    saveHistory: () => Promise.resolve(),
    saveSettings: () => Promise.resolve(),
  };
}

function createCacheEntry(
  id: string,
  taskType: AICacheEntry['taskType'],
  createdAt: string,
): AICacheEntry {
  return {
    createdAt,
    expiresAt: '2026-07-20T00:00:00.000Z',
    id,
    key: id,
    result: {
      content: 'Result',
      createdAt,
      id: `${id}-result`,
      metadata: {},
      taskId: `${id}-task`,
      type: taskType,
    },
    taskType,
    version: 'ai-cache-v1',
  };
}
