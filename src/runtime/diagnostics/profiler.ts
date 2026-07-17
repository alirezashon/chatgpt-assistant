import type { MetricsCollector } from './metrics';

/** Measures scoped runtime duration and records it to metrics. */
export class PerformanceTimer {
  private readonly startedAt = performance.now();

  public constructor(
    private readonly name: string,
    private readonly metrics: MetricsCollector,
  ) {}

  /** Stops the timer and records one timing sample. */
  public stop(): number {
    const duration = performance.now() - this.startedAt;
    this.metrics.timing(this.name, duration);
    return duration;
  }
}

/** Creates timers for named runtime operations. */
export class Profiler {
  public constructor(private readonly metrics: MetricsCollector) {}

  /** Starts a named performance timer. */
  public start(name: string): PerformanceTimer {
    return new PerformanceTimer(name, this.metrics);
  }
}
