import type { ExecutionRequest, HybridValue, OfflineQueueItem } from './hybrid-types';

/** Offline queue for offline workflows, memory, search, knowledge cache, and agent execution. */
export class OfflineEngine {
  private readonly queue: OfflineQueueItem[] = [];

  /** Enqueues request for later synchronization. */
  public enqueue(request: ExecutionRequest): OfflineQueueItem {
    const item: OfflineQueueItem = {
      attempts: 0,
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      request,
    };
    this.queue.push(item);
    return item;
  }

  /** Drains queued items through executor. */
  public async drain(execute: (request: ExecutionRequest) => Promise<HybridValue>): Promise<readonly HybridValue[]> {
    const results: HybridValue[] = [];

    while (this.queue.length > 0) {
      const item = this.queue.shift();

      if (item !== undefined) {
        results.push(await execute(item.request));
      }
    }

    return results;
  }

  /** Lists queue. */
  public list(): readonly OfflineQueueItem[] {
    return this.queue;
  }
}
