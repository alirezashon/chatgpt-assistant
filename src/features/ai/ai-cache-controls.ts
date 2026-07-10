import type { AIRepository } from '@/features/ai/ai-repository';

export interface AICacheInspection {
  readonly entryCount: number;
  readonly newestEntryAt: string | null;
  readonly oldestEntryAt: string | null;
  readonly taskTypes: readonly string[];
}

export async function inspectLocalAICache(repository: AIRepository): Promise<AICacheInspection> {
  const entries = await repository.getCache();
  const createdAtValues = entries.map((entry) => entry.createdAt).sort();

  return {
    entryCount: entries.length,
    newestEntryAt: createdAtValues.at(-1) ?? null,
    oldestEntryAt: createdAtValues[0] ?? null,
    taskTypes: [...new Set(entries.map((entry) => entry.taskType))].sort(),
  };
}

export async function clearLocalAICache(repository: AIRepository): Promise<AICacheInspection> {
  await repository.clearCache();

  return inspectLocalAICache(repository);
}
