import { CancellationTokenSource, type Disposable } from '@/runtime/utils';

import type { AITaskHandle } from './ai-types';

/** Tracks in-flight AI tasks and cancellation sources. */
export class AITaskManager implements Disposable {
  private readonly tasks = new Map<string, CancellationTokenSource>();

  /** Creates a task handle with a cancellation token source. */
  public create(id: string): {
    readonly handle: AITaskHandle;
    readonly source: CancellationTokenSource;
  } {
    const source = new CancellationTokenSource();
    this.tasks.set(id, source);

    return {
      handle: {
        cancel: () => {
          this.cancel(id);
        },
        id,
      },
      source,
    };
  }

  /** Cancels a task by id. */
  public cancel(id: string): void {
    const source = this.tasks.get(id);

    if (source === undefined) {
      return;
    }

    source.cancel();
    this.tasks.delete(id);
  }

  /** Marks a task complete. */
  public complete(id: string): void {
    this.tasks.delete(id);
  }

  /** Returns true when the task exists. */
  public has(id: string): boolean {
    return this.tasks.has(id);
  }

  /** Cancels all pending tasks. */
  public dispose(): void {
    for (const source of this.tasks.values()) {
      source.cancel();
    }

    this.tasks.clear();
  }
}
