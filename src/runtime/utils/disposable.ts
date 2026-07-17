/** A cleanup handle returned by subscriptions, scopes, and runtime resources. */
export interface Disposable {
  /** Releases the owned resource. Calling more than once must be safe. */
  dispose(): void | Promise<void>;
}

/** Function-shaped cleanup callback. */
export type DisposableCallback = () => void | Promise<void>;

/** Creates an idempotent disposable from a callback. */
export function createDisposable(callback: DisposableCallback): Disposable {
  let disposed = false;

  return {
    dispose: () => {
      if (disposed) {
        return undefined;
      }

      disposed = true;
      return callback();
    },
  };
}

/** Owns many disposables and disposes them in reverse registration order. */
export class DisposableStore implements Disposable {
  private readonly disposables: Disposable[] = [];
  private disposed = false;

  /** Adds a disposable to the store and returns it for chaining. */
  public add<Value extends Disposable>(disposable: Value): Value {
    if (this.disposed) {
      void disposable.dispose();
      return disposable;
    }

    this.disposables.push(disposable);
    return disposable;
  }

  /** Releases all owned disposables in reverse order. */
  public async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    for (const disposable of [...this.disposables].reverse()) {
      await disposable.dispose();
    }

    this.disposables.length = 0;
  }
}
