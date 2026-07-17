import { describe, expect, it } from 'vitest';

import { ObservabilityRuntime } from './observability-runtime';
import type { HealthCheck, TelemetryContext } from './observability-types';

describe('ObservabilityRuntime', () => {
  it('correlates traces, logs, metrics, AI KPIs, and redacts sensitive attributes', () => {
    const runtime = new ObservabilityRuntime();
    const trace = runtime.sdk.startTrace('agent-task', 'agent', { objective: 'build' });

    runtime.sdk.log('agent.started', 'info', 'started', trace.context, {
      apiKey: 'sk-secret',
      safe: 'visible',
    });
    runtime.sdk.metric('request.latency.ms', 120, trace.context);
    runtime.sdk.aiKpi('ai.cost.usd', 0.03, aiContext(trace.context));
    runtime.sdk.endSpan(trace);

    const records = runtime.query.records({ correlationId: trace.context.correlationId });
    const log = runtime.query.records({ name: 'agent.started' })[0];

    expect(records.map((record) => record.name)).toContain('request.latency.ms');
    expect(runtime.query.trace(trace.context.traceId)).toHaveLength(1);
    expect(log?.attributes['apiKey']).toBe('[redacted]');
    expect(runtime.query.metrics('ai.cost.usd')[0]?.value).toBe(0.03);
  });

  it('evaluates readiness, liveness, degraded mode, and dependency graph', async () => {
    const runtime = new ObservabilityRuntime();
    runtime.health.register({
      check: () => 'healthy',
      dependencies: ['api'],
      id: 'workflow-runtime',
      name: 'Workflow Runtime',
      subsystem: 'workflow',
    });
    runtime.health.register({
      check: () => 'degraded',
      id: 'ai-runtime',
      name: 'AI Runtime',
      subsystem: 'ai',
    });

    await runtime.health.run();

    expect(runtime.health.platformStatus()).toBe('degraded');
    expect(runtime.health.readiness()).toBe(false);
    expect(runtime.health.liveness()).toBe(true);
    expect(runtime.health.dependencyGraph()['workflow-runtime']).toContain('api');
    expect(runtime.health.degradedSubsystems()).toContain('ai');
  });

  it('auto-diagnoses queue congestion, retry storms, agent loops, and span regressions', () => {
    const runtime = new ObservabilityRuntime();
    const context = runtime.sdk.context('workflow', 'corr-diagnostics');
    const trace = runtime.sdk.startTrace('slow-workflow', 'workflow');

    runtime.sdk.metric('queue.depth', 150, context);
    runtime.sdk.metric('retry.count', 11, context);
    runtime.sdk.metric('agent.loop.count', 4, runtime.sdk.context('agent', 'corr-agent'));
    runtime.collector.collectSpan({
      attributes: {},
      endedAt: 10_001,
      id: 'span-slow',
      name: 'slow-query',
      startedAt: 1,
      status: 'ok',
      subsystem: 'workflow',
      traceId: trace.context.traceId,
    });

    const findings = runtime.diagnostics.analyze();

    expect(findings.map((finding) => finding.type)).toEqual(
      expect.arrayContaining(['agent-loop', 'performance-regression', 'queue-congestion', 'retry-storm']),
    );
  });

  it('detects anomalies, routes alerts, and applies non-destructive recovery policies', () => {
    const runtime = new ObservabilityRuntime();
    const context = runtime.sdk.context('ai', 'corr-ai');

    runtime.sdk.metric('request.latency.ms', 100, context);
    runtime.sdk.metric('request.latency.ms', 110, context);
    runtime.sdk.metric('request.latency.ms', 90, context);
    runtime.sdk.metric('request.latency.ms', 500, context);

    const result = runtime.evaluateAndRecover();

    expect(result.anomalies.some((anomaly) => anomaly.type === 'latency-spike')).toBe(true);
    expect(result.alerts.some((alert) => alert.channel === 'slack')).toBe(true);
    expect(result.recoveries.some((record) => record.action === 'provider-failover')).toBe(true);
  });

  it('blocks destructive self-healing until human approval is present', () => {
    const runtime = new ObservabilityRuntime();
    const downCheck: HealthCheck = {
      checkedAt: Date.now(),
      dependencies: [],
      id: 'distributed-worker',
      liveness: false,
      message: 'Worker is down',
      name: 'Distributed Worker',
      readiness: false,
      status: 'down',
      subsystem: 'distributed',
    };

    const blocked = runtime.selfHealing.recover({ signal: downCheck });
    const approved = runtime.selfHealing.recover({ approved: true, signal: downCheck });

    expect(blocked[0]?.status).toBe('blocked');
    expect(blocked[0]?.reason).toContain('Human approval');
    expect(approved[0]?.status).toBe('succeeded');
  });

  it('evaluates SLOs and produces capacity forecasts from metric history', () => {
    const runtime = new ObservabilityRuntime();
    const context = runtime.sdk.context('api', 'corr-slo');

    runtime.sdk.metric('request.latency.ms', 100, context);
    runtime.sdk.metric('request.latency.ms', 200, context);
    runtime.sdk.metric('request.latency.ms', 300, context);

    const result = runtime.slo.evaluate({
      comparator: 'lte',
      id: 'latency-slo',
      metric: 'request.latency.ms',
      name: 'Average request latency',
      objective: 250,
      subsystem: 'api',
    });

    expect(result.compliant).toBe(true);
    expect(runtime.slo.capacityForecast('request.latency.ms')).toBe(360);
    expect(runtime.slo.dashboardsList().map((dashboard) => dashboard.id)).toContain('ai-cost-quality');
  });

  it('supports chaos experiments and generates postmortems from incident history', () => {
    const runtime = new ObservabilityRuntime();
    const context = runtime.sdk.context('workflow', 'corr-incident');

    runtime.sdk.metric('queue.depth', 200, context);
    runtime.evaluateAndRecover();

    const chaosEvent = runtime.chaos.inject({
      blastRadius: 'subsystem',
      fault: 'queue-backlog',
      id: 'queue-backlog-game-day',
      name: 'Queue Backlog Game Day',
      subsystem: 'workflow',
    });
    const postmortem = runtime.chaos.createPostmortem('Queue backlog incident');

    expect(chaosEvent).toContain('queue-backlog');
    expect(postmortem.rootCause).toContain('Queue depth');
    expect(postmortem.correctiveActions).toHaveLength(3);
  });
});

function aiContext(context: TelemetryContext): TelemetryContext {
  return {
    correlationId: context.correlationId,
    subsystem: 'ai',
    traceId: context.traceId,
  };
}
