import { createDisposable, type Disposable } from './disposable';
import { guard } from './guard';

/** Async counting semaphore for bounded concurrency. */
export class Semaphore {
  private readonly waiters: (() => void)[] = [];
  private available: number;

  public constructor(permits: number) {
    guard(
      Number.isInteger(permits) && permits > 0,
      'Semaphore permits must be a positive integer.',
    );
    this.available = permits;
  }

  /** Acquires one permit and returns a disposable release handle. */
  public async acquire(): Promise<Disposable> {
    if (this.available > 0) {
      this.available -= 1;
      return this.createRelease();
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });

    return this.createRelease();
  }

  private createRelease(): Disposable {
    return createDisposable(() => {
      const next = this.waiters.shift();

      if (next === undefined) {
        this.available += 1;
        return;
      }

      next();
    });
  }
}
