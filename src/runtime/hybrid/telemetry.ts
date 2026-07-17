import type { HybridTelemetryEvent, RuntimeTarget } from './hybrid-types';

/** Hybrid runtime observability: selection logs, migrations, latency, energy, diagnostics, crash reports. */
export class HybridTelemetry {
  private readonly events: HybridTelemetryEvent[] = [];

  /** Records event. */
  public record(input: {
    readonly message: string;
    readonly metrics?: Readonly<Record<string, number>>;
    readonly requestId?: string;
    readonly target?: RuntimeTarget;
    readonly type: HybridTelemetryEvent['type'];
  }): HybridTelemetryEvent {
    const event: HybridTelemetryEvent = {
      id: crypto.randomUUID(),
      message: input.message,
      metrics: input.metrics ?? {},
      timestamp: Date.now(),
      type: input.type,
      ...(input.requestId === undefined ? {} : { requestId: input.requestId }),
      ...(input.target === undefined ? {} : { target: input.target }),
    };
    this.events.push(event);
    return event;
  }

  /** Lists events. */
  public list(requestId?: string): readonly HybridTelemetryEvent[] {
    return this.events.filter((event) => requestId === undefined || event.requestId === requestId);
  }
}
