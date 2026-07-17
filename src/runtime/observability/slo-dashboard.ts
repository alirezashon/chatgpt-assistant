import type { ObservabilityDashboard, SLODefinition, SLOResult } from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** SLO evaluation and dashboard catalog. */
export class SLODashboardService {
  private readonly dashboards: ObservabilityDashboard[] = [
    {
      id: 'platform-health',
      title: 'Platform Health',
      widgets: [
        { metric: 'request.latency.ms', title: 'Request Latency' },
        { metric: 'runtime.cpu.percent', title: 'CPU Saturation' },
        { metric: 'queue.depth', title: 'Queue Depth' },
      ],
    },
    {
      id: 'ai-cost-quality',
      title: 'AI Cost and Quality',
      widgets: [
        { metric: 'ai.cost.usd', subsystem: 'ai', title: 'AI Cost' },
        { metric: 'ai.token.count', subsystem: 'ai', title: 'Token Usage' },
        { metric: 'ai.hallucination.score', subsystem: 'ai', title: 'Hallucination Risk' },
      ],
    },
  ];

  public constructor(private readonly storage: TelemetryStorage) {}

  public dashboardsList(): readonly ObservabilityDashboard[] {
    return this.dashboards;
  }

  public evaluate(slo: SLODefinition): SLOResult {
    const samples = this.storage.getMetrics().filter((metric) => metric.name === slo.metric);
    const observed =
      samples.length === 0 ? 0 : samples.reduce((total, metric) => total + metric.value, 0) / samples.length;
    const compliant = slo.comparator === 'gte' ? observed >= slo.objective : observed <= slo.objective;

    return {
      compliant,
      objective: slo.objective,
      observed,
      sloId: slo.id,
    };
  }

  public capacityForecast(metricName: string, horizonMultiplier = 1.2): number {
    const samples = this.storage.getMetrics().filter((metric) => metric.name === metricName);

    if (samples.length === 0) {
      return 0;
    }

    const peak = Math.max(...samples.map((metric) => metric.value));
    return peak * horizonMultiplier;
  }
}
