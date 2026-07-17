import { createDisposable, type Disposable } from './disposable';

/** Async mutual exclusion lock. */
export class Mutex {
  private readonly waiters: (() => void)[] = [];
  private locked = false;

  /** Acquires the lock and returns a disposable release handle. */
  public async acquire(): Promise<Disposable> {
    if (!this.locked) {
      this.locked = true;
      return this.createRelease();
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });

    this.locked = true;
    return this.createRelease();
  }

  /** Runs a function while holding the lock. */
  public async runExclusive<Value>(callback: () => Promise<Value> | Value): Promise<Value> {
    const release = await this.acquire();

    try {
      return await callback();
    } finally {
      await release.dispose();
    }
  }

  private createRelease(): Disposable {
    return createDisposable(() => {
      const next = this.waiters.shift();

      if (next === undefined) {
        this.locked = false;
        return;
      }

      next();
    });
  }
}
