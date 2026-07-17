import type {
  MetricPoint,
  ObservabilitySeverity,
  ObservabilitySpan,
  ObservabilityValue,
  ObservedSubsystem,
  TelemetryContext,
  TelemetryRecord,
  TelemetrySignalType,
} from './observability-types';
import type { TelemetryCollector } from './telemetry-collector';

/** Trace handle returned by the telemetry SDK. */
export interface TraceHandle {
  readonly span: ObservabilitySpan;
  readonly context: TelemetryContext;
}

/** Developer-facing telemetry SDK. */
export class TelemetrySDK {
  private activeSpanContext: TelemetryContext | undefined;

  public constructor(private readonly collector: TelemetryCollector) {}

  public startTrace(
    name: string,
    subsystem: ObservedSubsystem,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TraceHandle {
    const traceId = this.createId('trace');
    return this.startSpan(name, {
      correlationId: traceId,
      subsystem,
      traceId,
    }, attributes);
  }

  public startSpan(
    name: string,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TraceHandle {
    const spanId = this.createId('span');
    const span: ObservabilitySpan = {
      attributes,
      id: spanId,
      name,
      startedAt: Date.now(),
      status: 'running',
      subsystem: context.subsystem,
      traceId: context.traceId,
      ...(context.spanId === undefined ? {} : { parentSpanId: context.spanId }),
    };
    this.collector.collectSpan(span);

    const nextContext: TelemetryContext = {
      ...context,
      spanId,
      ...(context.spanId === undefined ? {} : { parentSpanId: context.spanId }),
    };
    this.activeSpanContext = nextContext;
    return { context: nextContext, span };
  }

  public endSpan(handle: TraceHandle, status: ObservabilitySpan['status'] = 'ok'): ObservabilitySpan {
    const ended: ObservabilitySpan = {
      ...handle.span,
      endedAt: Date.now(),
      status,
    };
    this.collector.collectSpan(ended);
    this.activeSpanContext = undefined;
    return ended;
  }

  public log(
    name: string,
    severity: ObservabilitySeverity,
    value: ObservabilityValue,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TelemetryRecord | undefined {
    return this.emit('log', name, severity, value, context, attributes);
  }

  public metric(
    name: string,
    value: number,
    context: TelemetryContext,
    tags: Readonly<Record<string, string>> = {},
  ): MetricPoint {
    const timestamp = Date.now();
    this.emit('metric', name, 'info', value, context, tags);
    return {
      name,
      tags: {
        ...tags,
        subsystem: context.subsystem,
      },
      timestamp,
      value,
    };
  }

  public event(
    name: string,
    value: ObservabilityValue,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TelemetryRecord | undefined {
    return this.emit('event', name, 'info', value, context, attributes);
  }

  public profile(
    name: string,
    value: ObservabilityValue,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TelemetryRecord | undefined {
    return this.emit('profile', name, 'info', value, context, attributes);
  }

  public health(
    name: string,
    value: ObservabilityValue,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TelemetryRecord | undefined {
    return this.emit('health', name, 'info', value, context, attributes);
  }

  public aiKpi(
    name: string,
    value: number,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TelemetryRecord | undefined {
    this.metric(name, value, context, { category: 'ai-kpi' });
    return this.emit('ai-kpi', name, 'info', value, context, attributes);
  }

  public businessKpi(
    name: string,
    value: number,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>> = {},
  ): TelemetryRecord | undefined {
    this.metric(name, value, context, { category: 'business-kpi' });
    return this.emit('business-kpi', name, 'info', value, context, attributes);
  }

  public context(subsystem: ObservedSubsystem, correlationId = this.createId('corr')): TelemetryContext {
    return {
      correlationId,
      subsystem,
      traceId: correlationId,
    };
  }

  public currentContext(): TelemetryContext | undefined {
    return this.activeSpanContext;
  }

  private emit(
    type: TelemetrySignalType,
    name: string,
    severity: ObservabilitySeverity,
    value: ObservabilityValue,
    context: TelemetryContext,
    attributes: Readonly<Record<string, ObservabilityValue>>,
  ): TelemetryRecord | undefined {
    const spanContext = this.activeSpanContext;
    const effectiveContext =
      context.spanId === undefined && spanContext?.traceId === context.traceId ? spanContext : context;
    return this.collector.collect({
      attributes,
      context: effectiveContext,
      id: this.createId(type),
      name,
      severity,
      timestamp: Date.now(),
      type,
      value,
    });
  }

  private createId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID()}`;
  }
}
