import { createDisposable, type Disposable } from './disposable';
import { RuntimeError } from './runtime-error';

/** Read-only cancellation signal for runtime operations. */
export interface CancellationToken {
  /** True after cancellation has been requested. */
  readonly isCancellationRequested: boolean;
  /** Throws a RuntimeError when cancellation has been requested. */
  throwIfCancellationRequested(): void;
  /** Subscribes to cancellation. */
  onCancellationRequested(listener: () => void): Disposable;
}

/** Mutable source used by operation owners to request cancellation. */
export class CancellationTokenSource implements Disposable {
  private readonly listeners = new Set<() => void>();
  private cancelled = false;

  /** Read-only token exposed to consumers. */
  public readonly token: CancellationToken;

  public constructor() {
    this.token = new SourceCancellationToken(this);
  }

  /** Requests cancellation and notifies all listeners once. */
  public cancel(): void {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;

    for (const listener of [...this.listeners]) {
      listener();
    }

    this.listeners.clear();
  }

  /** Disposes the source by cancelling pending work. */
  public dispose(): void {
    this.cancel();
  }

  private onCancellationRequested(listener: () => void): Disposable {
    if (this.cancelled) {
      listener();
      return createDisposable(() => undefined);
    }

    this.listeners.add(listener);

    return createDisposable(() => {
      this.listeners.delete(listener);
    });
  }

  public get isCancelled(): boolean {
    return this.cancelled;
  }

  public throwIfCancelled(): void {
    if (this.cancelled) {
      throw new RuntimeError('CANCELLED', 'Operation was cancelled.');
    }
  }

  public subscribe(listener: () => void): Disposable {
    return this.onCancellationRequested(listener);
  }
}

class SourceCancellationToken implements CancellationToken {
  public constructor(private readonly source: CancellationTokenSource) {}

  public get isCancellationRequested(): boolean {
    return this.source.isCancelled;
  }

  public throwIfCancellationRequested(): void {
    this.source.throwIfCancelled();
  }

  public onCancellationRequested(listener: () => void): Disposable {
    return this.source.subscribe(listener);
  }
}
