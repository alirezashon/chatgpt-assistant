import type {
  MetricPoint,
  ObservabilitySpan,
  ObservabilityValue,
  TelemetryRecord,
} from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Collector configuration. */
export interface TelemetryCollectorOptions {
  readonly redactedKeys?: readonly string[];
  readonly sampleRate?: number;
}

const DEFAULT_REDACTED_KEYS = ['apikey', 'authorization', 'cookie', 'password', 'secret', 'token'];

/** Normalizes, redacts, samples, and persists telemetry. */
export class TelemetryCollector {
  private readonly redactedKeys: ReadonlySet<string>;
  private readonly sampleRate: number;

  public constructor(
    private readonly storage: TelemetryStorage,
    options: TelemetryCollectorOptions = {},
  ) {
    this.redactedKeys = new Set(options.redactedKeys ?? DEFAULT_REDACTED_KEYS);
    this.sampleRate = options.sampleRate ?? 1;
  }

  public collect(record: TelemetryRecord): TelemetryRecord | undefined {
    if (!this.shouldSample(record)) {
      return undefined;
    }

    const sanitized: TelemetryRecord = {
      ...record,
      attributes: this.redactObject(record.attributes),
      value: this.redactValue(record.value),
    };
    this.storage.writeRecord(sanitized);

    if (sanitized.type === 'metric' && typeof sanitized.value === 'number') {
      this.storage.writeMetric({
        name: sanitized.name,
        tags: this.metricTags(sanitized),
        timestamp: sanitized.timestamp,
        value: sanitized.value,
      });
    }

    return sanitized;
  }

  public collectMetric(metric: MetricPoint): MetricPoint | undefined {
    if (this.sampleRate <= 0) {
      return undefined;
    }

    this.storage.writeMetric(metric);
    return metric;
  }

  public collectSpan(span: ObservabilitySpan): ObservabilitySpan {
    this.storage.writeSpan(span);
    return span;
  }

  private shouldSample(record: TelemetryRecord): boolean {
    if (record.severity === 'critical' || record.severity === 'error') {
      return true;
    }

    if (this.sampleRate >= 1) {
      return true;
    }

    if (this.sampleRate <= 0) {
      return false;
    }

    let hash = 0;

    for (const character of record.id) {
      hash += character.charCodeAt(0);
    }

    return (hash % 1000) / 1000 < this.sampleRate;
  }

  private redactObject(
    value: Readonly<Record<string, ObservabilityValue>>,
  ): Readonly<Record<string, ObservabilityValue>> {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        this.redactedKeys.has(key.toLowerCase()) ? '[redacted]' : this.redactValue(entry),
      ]),
    );
  }

  private redactValue(value: ObservabilityValue): ObservabilityValue {
    if (this.isArray(value)) {
      return value.map((entry) => this.redactValue(entry));
    }

    if (this.isRecord(value)) {
      return this.redactObject(value);
    }

    return value;
  }

  private isRecord(value: ObservabilityValue): value is Readonly<Record<string, ObservabilityValue>> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isArray(value: ObservabilityValue): value is readonly ObservabilityValue[] {
    return Array.isArray(value);
  }

  private metricTags(record: TelemetryRecord): Readonly<Record<string, string>> {
    return {
      ...Object.fromEntries(
        Object.entries(record.attributes)
          .filter(([, value]) => typeof value === 'string')
          .map(([key, value]) => [key, value as string]),
      ),
      correlationId: record.context.correlationId,
      subsystem: record.context.subsystem,
      traceId: record.context.traceId,
    };
  }
}
