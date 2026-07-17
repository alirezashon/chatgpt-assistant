import type {
  Alert,
  Anomaly,
  DiagnosticFinding,
  HealthCheck,
  MetricPoint,
  ObservabilitySpan,
  Postmortem,
  RecoveryRecord,
  TelemetryRecord,
} from './observability-types';

/** In-memory telemetry store used by the extension runtime and tests. */
export class TelemetryStorage {
  private readonly alerts: Alert[] = [];
  private readonly anomalies: Anomaly[] = [];
  private readonly findings: DiagnosticFinding[] = [];
  private readonly healthChecks = new Map<string, HealthCheck>();
  private readonly metrics: MetricPoint[] = [];
  private readonly postmortems: Postmortem[] = [];
  private readonly recoveries: RecoveryRecord[] = [];
  private readonly records: TelemetryRecord[] = [];
  private readonly spans: ObservabilitySpan[] = [];

  public constructor(private readonly retentionMs = 7 * 24 * 60 * 60 * 1000) {}

  public writeRecord(record: TelemetryRecord): void {
    this.records.push(record);
    this.prune(record.timestamp);
  }

  public writeMetric(metric: MetricPoint): void {
    this.metrics.push(metric);
    this.prune(metric.timestamp);
  }

  public writeSpan(span: ObservabilitySpan): void {
    const existingIndex = this.spans.findIndex((candidate) => candidate.id === span.id);

    if (existingIndex >= 0) {
      this.spans[existingIndex] = span;
    } else {
      this.spans.push(span);
    }

    this.prune(span.startedAt);
  }

  public writeHealth(check: HealthCheck): void {
    this.healthChecks.set(check.id, check);
  }

  public writeFinding(finding: DiagnosticFinding): void {
    this.findings.push(finding);
    this.prune(finding.timestamp);
  }

  public writeAnomaly(anomaly: Anomaly): void {
    this.anomalies.push(anomaly);
    this.prune(anomaly.timestamp);
  }

  public writeRecovery(record: RecoveryRecord): void {
    this.recoveries.push(record);
    this.prune(record.timestamp);
  }

  public writeAlert(alert: Alert): void {
    this.alerts.push(alert);
    this.prune(alert.timestamp);
  }

  public writePostmortem(postmortem: Postmortem): void {
    this.postmortems.push(postmortem);
    this.prune(postmortem.createdAt);
  }

  public getRecords(): readonly TelemetryRecord[] {
    return this.records;
  }

  public getMetrics(): readonly MetricPoint[] {
    return this.metrics;
  }

  public getSpans(): readonly ObservabilitySpan[] {
    return this.spans;
  }

  public getHealthChecks(): readonly HealthCheck[] {
    return [...this.healthChecks.values()];
  }

  public getFindings(): readonly DiagnosticFinding[] {
    return this.findings;
  }

  public getAnomalies(): readonly Anomaly[] {
    return this.anomalies;
  }

  public getRecoveries(): readonly RecoveryRecord[] {
    return this.recoveries;
  }

  public getAlerts(): readonly Alert[] {
    return this.alerts;
  }

  public getPostmortems(): readonly Postmortem[] {
    return this.postmortems;
  }

  private prune(now: number): void {
    const oldestAllowed = now - this.retentionMs;
    this.pruneByTimestamp(this.records, oldestAllowed, (record) => record.timestamp);
    this.pruneByTimestamp(this.metrics, oldestAllowed, (metric) => metric.timestamp);
    this.pruneByTimestamp(this.spans, oldestAllowed, (span) => span.endedAt ?? span.startedAt);
    this.pruneByTimestamp(this.findings, oldestAllowed, (finding) => finding.timestamp);
    this.pruneByTimestamp(this.anomalies, oldestAllowed, (anomaly) => anomaly.timestamp);
    this.pruneByTimestamp(this.recoveries, oldestAllowed, (record) => record.timestamp);
    this.pruneByTimestamp(this.alerts, oldestAllowed, (alert) => alert.timestamp);
    this.pruneByTimestamp(this.postmortems, oldestAllowed, (postmortem) => postmortem.createdAt);
  }

  private pruneByTimestamp<T>(items: T[], oldestAllowed: number, getTimestamp: (item: T) => number): void {
    let removable = 0;

    for (const item of items) {
      if (getTimestamp(item) >= oldestAllowed) {
        break;
      }

      removable += 1;
    }

    if (removable > 0) {
      items.splice(0, removable);
    }
  }
}
