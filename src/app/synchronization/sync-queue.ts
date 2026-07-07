import type { SyncTask } from '@/app/synchronization/sync-types';

export class SyncQueue {
  private active = false;
  private readonly tasks: SyncTask[] = [];
  private readonly throttleMs: number;

  public constructor(throttleMs: number) {
    this.throttleMs = throttleMs;
  }

  public enqueue(task: Omit<SyncTask, 'createdAt' | 'id'>): void {
    this.tasks.push({
      ...task,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    });

    void this.flush();
  }

  public async flush(): Promise<void> {
    if (this.active) {
      return;
    }

    this.active = true;

    try {
      while (this.tasks.length > 0) {
        const task = this.tasks.shift();

        if (task === undefined) {
          continue;
        }

        await delay(this.throttleMs);
        await task.run();
      }
    } finally {
      this.active = false;
    }
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
