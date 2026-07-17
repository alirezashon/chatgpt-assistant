import { RuntimeError } from './runtime-error';

/** FIFO async queue for producer-consumer runtime tasks. */
export class AsyncQueue<Value> {
  private readonly values: Value[] = [];
  private readonly waiters: ((value: Value) => void)[] = [];
  private closed = false;

  /** Adds a value or resolves the oldest waiting consumer. */
  public enqueue(value: Value): void {
    if (this.closed) {
      throw new RuntimeError('DISPOSED', 'Cannot enqueue into a closed queue.');
    }

    const waiter = this.waiters.shift();

    if (waiter === undefined) {
      this.values.push(value);
      return;
    }

    waiter(value);
  }

  /** Waits for and returns the next queued value. */
  public async dequeue(): Promise<Value> {
    const value = this.values.shift();

    if (value !== undefined) {
      return value;
    }

    if (this.closed) {
      throw new RuntimeError('DISPOSED', 'Cannot dequeue from a closed queue.');
    }

    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  /** Closes the queue. Pending waiters remain unresolved by design. */
  public close(): void {
    this.closed = true;
    this.values.length = 0;
    this.waiters.length = 0;
  }
}
