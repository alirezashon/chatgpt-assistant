import type { DistributedTraceSpan, DistributedValue } from './distributed-types';

/** Distributed tracing recorder for event path, job execution, realtime, and scheduler spans. */
export class DistributedTraceRecorder {
  private readonly spans = new Map<string, DistributedTraceSpan>();

  /** Starts a span. */
  public start(input: {
    readonly attributes?: Readonly<Record<string, DistributedValue>>;
    readonly kind: DistributedTraceSpan['kind'];
    readonly name: string;
    readonly parentId?: string;
    readonly traceId: string;
  }): DistributedTraceSpan {
    const span: DistributedTraceSpan = {
      attributes: input.attributes ?? {},
      id: crypto.randomUUID(),
      kind: input.kind,
      name: input.name,
      ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
      startedAt: Date.now(),
      status: 'running',
      traceId: input.traceId,
    };
    this.spans.set(span.id, span);
    return span;
  }

  /** Ends a span. */
  public end(spanId: string, status: 'failed' | 'ok'): DistributedTraceSpan | undefined {
    const span = this.spans.get(spanId);

    if (span === undefined) {
      return undefined;
    }

    const next: DistributedTraceSpan = {
      ...span,
      endedAt: Date.now(),
      status,
    };
    this.spans.set(spanId, next);
    return next;
  }

  /** Lists spans. */
  public list(traceId?: string): readonly DistributedTraceSpan[] {
    return [...this.spans.values()].filter((span) => traceId === undefined || span.traceId === traceId);
  }
}
