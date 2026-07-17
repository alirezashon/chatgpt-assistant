import type { CancellationToken } from './cancellation';

/** Retry policy for transient operations. */
export interface RetryPolicy {
  /** Initial backoff in milliseconds. */
  readonly initialDelayMs: number;
  /** Maximum attempts including the first call. */
  readonly maxAttempts: number;
  /** Backoff multiplier applied after each failed attempt. */
  readonly multiplier: number;
}

/** Executes an operation with deterministic exponential backoff. */
export async function retry<Value>(
  callback: (attempt: number) => Promise<Value>,
  policy: RetryPolicy,
  token?: CancellationToken,
): Promise<Value> {
  let delayMs = policy.initialDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    token?.throwIfCancellationRequested();

    try {
      return await callback(attempt);
    } catch (error) {
      lastError = error;

      if (attempt === policy.maxAttempts) {
        break;
      }

      await sleep(delayMs, token);
      delayMs *= policy.multiplier;
    }
  }

  throw lastError;
}

/** Sleeps for a number of milliseconds while respecting cancellation. */
export async function sleep(delayMs: number, token?: CancellationToken): Promise<void> {
  token?.throwIfCancellationRequested();

  await new Promise<void>((resolve) => {
    const timeoutId = globalThis.setTimeout(resolve, delayMs);

    token?.onCancellationRequested(() => {
      globalThis.clearTimeout(timeoutId);
      resolve();
    });
  });

  token?.throwIfCancellationRequested();
}
