import type {
  Alert,
  Anomaly,
  DiagnosticFinding,
  HealthCheck,
  MetricPoint,
  ObservabilitySpan,
  ObservedSubsystem,
  TelemetryRecord,
  TelemetrySignalType,
} from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Telemetry query filters. */
export interface TelemetryQuery {
  readonly correlationId?: string;
  readonly from?: number;
  readonly name?: string;
  readonly subsystem?: ObservedSubsystem;
  readonly text?: string;
  readonly to?: number;
  readonly type?: TelemetrySignalType;
}

/** Query engine for logs, metrics, traces, health, and incident data. */
export class TelemetryQueryEngine {
  public constructor(private readonly storage: TelemetryStorage) {}

  public records(query: TelemetryQuery = {}): readonly TelemetryRecord[] {
    return this.storage.getRecords().filter((record) => this.matchesRecord(record, query));
  }

  public metrics(name?: string): readonly MetricPoint[] {
    const metrics = this.storage.getMetrics();
    return name === undefined ? metrics : metrics.filter((metric) => metric.name === name);
  }

  public trace(traceId: string): readonly ObservabilitySpan[] {
    return this.storage
      .getSpans()
      .filter((span) => span.traceId === traceId)
      .sort((left, right) => left.startedAt - right.startedAt);
  }

  public health(subsystem?: ObservedSubsystem): readonly HealthCheck[] {
    const checks = this.storage.getHealthChecks();
    return subsystem === undefined ? checks : checks.filter((check) => check.subsystem === subsystem);
  }

  public findings(): readonly DiagnosticFinding[] {
    return this.storage.getFindings();
  }

  public anomalies(): readonly Anomaly[] {
    return this.storage.getAnomalies();
  }

  public alerts(): readonly Alert[] {
    return this.storage.getAlerts();
  }

  public search(text: string): readonly TelemetryRecord[] {
    const needle = text.toLowerCase();
    return this.storage.getRecords().filter((record) => this.recordText(record).includes(needle));
  }

  private matchesRecord(record: TelemetryRecord, query: TelemetryQuery): boolean {
    if (query.correlationId !== undefined && record.context.correlationId !== query.correlationId) {
      return false;
    }

    if (query.from !== undefined && record.timestamp < query.from) {
      return false;
    }

    if (query.name !== undefined && record.name !== query.name) {
      return false;
    }

    if (query.subsystem !== undefined && record.context.subsystem !== query.subsystem) {
      return false;
    }

    if (query.to !== undefined && record.timestamp > query.to) {
      return false;
    }

    if (query.type !== undefined && record.type !== query.type) {
      return false;
    }

    return query.text === undefined || this.recordText(record).includes(query.text.toLowerCase());
  }

  private recordText(record: TelemetryRecord): string {
    return `${record.name} ${record.severity} ${record.context.subsystem} ${JSON.stringify(record.value)} ${JSON.stringify(
      record.attributes,
    )}`.toLowerCase();
  }
}
