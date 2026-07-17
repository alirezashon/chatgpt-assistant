import type { Anomaly, ObservedSubsystem } from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Threshold or baseline anomaly detection rule. */
export interface AnomalyRule {
  readonly metric: string;
  readonly type: Anomaly['type'];
  readonly severity: Anomaly['severity'];
  readonly minimumSamples?: number;
  readonly multiplier?: number;
  readonly threshold?: number;
}

/** Detects latency, cost, traffic, security, plugin, AI, and resource anomalies. */
export class AnomalyDetector {
  private readonly rules: AnomalyRule[] = [
    { metric: 'request.latency.ms', multiplier: 3, severity: 'warn', type: 'latency-spike' },
    { metric: 'ai.cost.usd', multiplier: 2, severity: 'warn', type: 'cost-spike' },
    { metric: 'request.count', multiplier: 4, severity: 'warn', type: 'traffic-spike' },
    { metric: 'security.violation.count', threshold: 0, severity: 'critical', type: 'security' },
    { metric: 'plugin.error.count', multiplier: 3, severity: 'warn', type: 'plugin-abuse' },
    { metric: 'ai.hallucination.score', threshold: 0.5, severity: 'warn', type: 'ai-behavior' },
    { metric: 'runtime.cpu.percent', threshold: 90, severity: 'critical', type: 'resource-exhaustion' },
  ];

  public constructor(private readonly storage: TelemetryStorage) {}

  public register(rule: AnomalyRule): void {
    this.rules.push(rule);
  }

  public detect(): readonly Anomaly[] {
    const anomalies = this.rules.flatMap((rule) => this.detectForRule(rule));

    for (const anomaly of anomalies) {
      this.storage.writeAnomaly(anomaly);
    }

    return anomalies;
  }

  private detectForRule(rule: AnomalyRule): readonly Anomaly[] {
    const samples = this.storage.getMetrics().filter((metric) => metric.name === rule.metric);
    const minimumSamples = rule.minimumSamples ?? 3;

    if (samples.length === 0) {
      return [];
    }

    const latest = samples[samples.length - 1];

    if (latest === undefined) {
      return [];
    }

    const baselineSamples = samples.slice(0, -1);
    const expected =
      baselineSamples.length >= minimumSamples
        ? baselineSamples.reduce((total, metric) => total + metric.value, 0) / baselineSamples.length
        : rule.threshold;

    if (expected === undefined) {
      return [];
    }

    const threshold = rule.threshold ?? expected * (rule.multiplier ?? 2);

    if (latest.value <= threshold) {
      return [];
    }

    const subsystem = this.subsystem(latest.tags['subsystem']);
    return [
      {
        expected,
        id: `anomaly_${crypto.randomUUID()}`,
        metric: rule.metric,
        observed: latest.value,
        severity: rule.severity,
        ...(subsystem === undefined ? {} : { subsystem }),
        timestamp: latest.timestamp,
        type: rule.type,
      },
    ];
  }

  private subsystem(value: string | undefined): ObservedSubsystem | undefined {
    const allowed: readonly ObservedSubsystem[] = [
      'agent',
      'ai',
      'api',
      'browser',
      'distributed',
      'enterprise',
      'hybrid',
      'knowledge',
      'marketplace',
      'memory',
      'plugin',
      'security',
      'workflow',
    ];
    return allowed.includes(value as ObservedSubsystem) ? (value as ObservedSubsystem) : undefined;
  }
}
