export function debounce<Arguments extends readonly unknown[]>(
  callback: (...args: Arguments) => void,
  delayMs: number,
): (...args: Arguments) => void {
  let timerId: number | undefined;

  return (...args: Arguments) => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }

    timerId = window.setTimeout(() => {
      callback(...args);
    }, delayMs);
  };
}

export function throttle<Arguments extends readonly unknown[]>(
  callback: (...args: Arguments) => void,
  delayMs: number,
): (...args: Arguments) => void {
  let lastRunAt = 0;

  return (...args: Arguments) => {
    const now = Date.now();

    if (now - lastRunAt < delayMs) {
      return;
    }

    lastRunAt = now;
    callback(...args);
  };
}
