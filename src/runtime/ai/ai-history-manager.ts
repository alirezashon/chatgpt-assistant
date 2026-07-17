import type { AIRequest, AIResponse } from './ai-types';

/** Metadata-only AI history entry. Raw prompts and page content are intentionally excluded. */
export interface AIHistoryEntry {
  /** Request id. */
  readonly requestId: string;
  /** Task type. */
  readonly taskType: string;
  /** Provider id. */
  readonly providerId: string;
  /** Model id. */
  readonly modelId: string;
  /** Completion cost. */
  readonly costUsd: number;
  /** Whether the response came from cache. */
  readonly cached: boolean;
  /** Whether execution succeeded. */
  readonly success: boolean;
  /** Timestamp when entry was recorded. */
  readonly timestamp: number;
}

/** Records bounded, metadata-only AI execution history for diagnostics and quotas. */
export class AIHistoryManager {
  private readonly entries: AIHistoryEntry[] = [];

  public constructor(private readonly limit = 250) {}

  /** Records a successful response. */
  public recordSuccess(request: AIRequest, response: AIResponse, now = Date.now()): void {
    this.record({
      cached: response.cached,
      costUsd: response.costUsd,
      modelId: response.modelId,
      providerId: response.providerId,
      requestId: request.id,
      success: true,
      taskType: request.taskType,
      timestamp: now,
    });
  }

  /** Records a failed response without storing prompt or page text. */
  public recordFailure(request: AIRequest, now = Date.now()): void {
    this.record({
      cached: false,
      costUsd: 0,
      modelId: '',
      providerId: '',
      requestId: request.id,
      success: false,
      taskType: request.taskType,
      timestamp: now,
    });
  }

  /** Returns newest entries first. */
  public list(): readonly AIHistoryEntry[] {
    return [...this.entries].reverse();
  }

  private record(entry: AIHistoryEntry): void {
    this.entries.push(entry);

    while (this.entries.length > this.limit) {
      this.entries.shift();
    }
  }
}
