/** Creates a debounced function. */
export function debounce<Arguments extends readonly unknown[]>(
  callback: (...args: Arguments) => void,
  delayMs: number,
): (...args: Arguments) => void {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;

  return (...args) => {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }

    timeoutId = globalThis.setTimeout(() => {
      callback(...args);
    }, delayMs);
  };
}

/** Creates a throttled function. */
export function throttle<Arguments extends readonly unknown[]>(
  callback: (...args: Arguments) => void,
  delayMs: number,
): (...args: Arguments) => void {
  let lastRunAt = 0;

  return (...args) => {
    const now = Date.now();

    if (now - lastRunAt < delayMs) {
      return;
    }

    lastRunAt = now;
    callback(...args);
  };
}
