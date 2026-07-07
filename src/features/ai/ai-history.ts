import type { AIConfig } from '@/features/ai/ai-config';
import type { AIHistoryEntry, AIJob } from '@/features/ai/ai-types';
import { createAIId, createAITimestamp } from '@/features/ai/ai-utils';

export class AIHistory {
  private readonly config: AIConfig;
  private entries: readonly AIHistoryEntry[] = [];

  public constructor(config: AIConfig) {
    this.config = config;
  }

  public hydrate(entries: readonly AIHistoryEntry[]): void {
    this.entries = entries.slice(0, this.config.historyLimit);
  }

  public record(job: AIJob): readonly AIHistoryEntry[] {
    const entry: AIHistoryEntry = {
      createdAt: createAITimestamp(),
      id: createAIId('ai-history'),
      jobId: job.id,
      status: job.status,
      taskType: job.request.type,
      ...(job.result?.providerId === undefined ? {} : { providerId: job.result.providerId }),
    };

    this.entries = [entry, ...this.entries].slice(0, this.config.historyLimit);

    return this.entries;
  }

  public getEntries(): readonly AIHistoryEntry[] {
    return this.entries;
  }
}
