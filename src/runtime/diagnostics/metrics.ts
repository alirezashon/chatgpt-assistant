/** Runtime counter and timing metrics. */
export interface RuntimeMetricsSnapshot {
  /** Named counters. */
  readonly counters: Readonly<Record<string, number>>;
  /** Named timing samples in milliseconds. */
  readonly timings: Readonly<Record<string, readonly number[]>>;
}

/** In-memory metrics collector. */
export class MetricsCollector {
  private readonly counters = new Map<string, number>();
  private readonly timings = new Map<string, number[]>();

  /** Increments a named counter. */
  public increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  /** Records a timing sample in milliseconds. */
  public timing(name: string, durationMs: number): void {
    const values = this.timings.get(name) ?? [];
    values.push(durationMs);
    this.timings.set(name, values);
  }

  /** Returns a copy of the metrics snapshot. */
  public snapshot(): RuntimeMetricsSnapshot {
    return {
      counters: Object.fromEntries(this.counters),
      timings: Object.fromEntries(
        [...this.timings.entries()].map(([key, values]) => [key, [...values]]),
      ),
    };
  }
}
