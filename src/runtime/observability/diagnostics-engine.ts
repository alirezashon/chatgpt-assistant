import type { DiagnosticFinding, ObservedSubsystem } from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Auto-diagnosis engine for platform failure modes. */
export class DiagnosticsEngine {
  public constructor(private readonly storage: TelemetryStorage) {}

  public analyze(): readonly DiagnosticFinding[] {
    const findings = [
      ...this.detectMetricThreshold('runtime.memory.bytes', 512 * 1024 * 1024, 'memory-leak', 'Memory usage is above runtime budget.'),
      ...this.detectMetricThreshold('queue.depth', 100, 'queue-congestion', 'Queue depth is above healthy operating range.'),
      ...this.detectMetricThreshold('query.latency.ms', 2_000, 'slow-query', 'Query latency exceeded the production threshold.'),
      ...this.detectMetricThreshold('workflow.idle.ms', 60_000, 'workflow-stall', 'Workflow has not progressed within its deadline.'),
      ...this.detectMetricThreshold('agent.loop.count', 3, 'agent-loop', 'Agent repeated the same step too many times.'),
      ...this.detectMetricThreshold('retry.count', 10, 'retry-storm', 'Retries are concentrated and may amplify failures.'),
      ...this.detectSpanRegression(),
    ];

    for (const finding of findings) {
      this.storage.writeFinding(finding);
    }

    return findings;
  }

  private detectMetricThreshold(
    metricName: string,
    threshold: number,
    type: DiagnosticFinding['type'],
    summary: string,
  ): readonly DiagnosticFinding[] {
    return this.storage
      .getMetrics()
      .filter((metric) => metric.name === metricName && metric.value > threshold)
      .map((metric) =>
        this.finding(metric.tags['subsystem'] ?? 'workflow', type, summary, [
          `${metric.name}=${metric.value.toString()} threshold=${threshold.toString()}`,
        ]),
      );
  }

  private detectSpanRegression(): readonly DiagnosticFinding[] {
    return this.storage
      .getSpans()
      .filter((span) => span.endedAt !== undefined && span.endedAt - span.startedAt > 5_000)
      .map((span) =>
        this.finding(span.subsystem, 'performance-regression', 'Trace span exceeded latency budget.', [
          `${span.name} durationMs=${((span.endedAt ?? span.startedAt) - span.startedAt).toString()}`,
        ]),
      );
  }

  private finding(
    subsystemValue: string,
    type: DiagnosticFinding['type'],
    summary: string,
    evidence: readonly string[],
  ): DiagnosticFinding {
    return {
      evidence,
      id: `finding_${crypto.randomUUID()}`,
      severity: type === 'memory-leak' || type === 'deadlock' ? 'critical' : 'warn',
      subsystem: this.subsystem(subsystemValue),
      summary,
      timestamp: Date.now(),
      type,
    };
  }

  private subsystem(value: string): ObservedSubsystem {
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
    return allowed.includes(value as ObservedSubsystem) ? (value as ObservedSubsystem) : 'workflow';
  }
}
