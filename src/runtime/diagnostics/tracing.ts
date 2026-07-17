/** Trace span stored for debugging async flows. */
export interface TraceSpan {
  /** Span id. */
  readonly id: string;
  /** Parent span id. */
  readonly parentId?: string;
  /** Span name. */
  readonly name: string;
  /** Start timestamp. */
  readonly startedAt: number;
  /** End timestamp. */
  readonly endedAt?: number;
}

/** Minimal in-memory tracer for kernel diagnostics and future debug overlays. */
export class Tracer {
  private readonly spans = new Map<string, TraceSpan>();

  /** Starts a span and returns its id. */
  public start(name: string, parentId?: string): string {
    const id = crypto.randomUUID();
    this.spans.set(id, {
      id,
      name,
      startedAt: Date.now(),
      ...(parentId === undefined ? {} : { parentId }),
    });
    return id;
  }

  /** Ends a span if it exists. */
  public end(id: string): void {
    const span = this.spans.get(id);

    if (span === undefined) {
      return;
    }

    this.spans.set(id, {
      ...span,
      endedAt: Date.now(),
    });
  }

  /** Returns all spans for diagnostics. */
  public snapshot(): readonly TraceSpan[] {
    return [...this.spans.values()];
  }
}
