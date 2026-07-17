import { describe, expect, it } from 'vitest';

import { LearningRuntime } from './learning-runtime';
import type { LearningDomain, LearningSignal } from './learning-types';

describe('LearningRuntime', () => {
  it('requires opt-in learning and rejects poisoned feedback', () => {
    const runtime = new LearningRuntime();
    const disabled = runtime.collect(signal({ domain: 'workflow', subjectId: 'user-1' }));

    runtime.privacy.configure({
      allowedDomains: ['workflow'],
      enabled: true,
      exportable: true,
      onDeviceOnly: true,
      retentionMs: 60_000,
      scope: 'user',
      subjectId: 'user-1',
    });
    const poisoned = runtime.collect(
      signal({
        domain: 'workflow',
        metadata: { sourceIntegrity: 'failed', synthetic: true },
        subjectId: 'user-1',
      }),
    );
    const accepted = runtime.collect(signal({ domain: 'workflow', metadata: { latencyMs: 2_500 }, subjectId: 'user-1' }));

    expect(disabled.accepted).toBe(false);
    expect(poisoned.accepted).toBe(false);
    expect(accepted.accepted).toBe(true);
    expect(runtime.store.getSignals()).toHaveLength(1);
  });

  it('learns transparent preferences that can be edited, exported, and deleted', () => {
    const runtime = runtimeFor('user-pref', ['personalization']);

    runtime.collect(
      signal({
        domain: 'personalization',
        metadata: { 'preference.model': 'fast', 'preference.writingStyle': 'concise' },
        subjectId: 'user-pref',
      }),
    );
    runtime.collect(
      signal({
        domain: 'personalization',
        metadata: { 'preference.approvalThreshold': 0.8, 'preference.writingStyle': 'concise' },
        subjectId: 'user-pref',
      }),
    );

    const recommendations = runtime.personalization.recommend('user-pref');
    const edited = runtime.personalization.editPreference('user-pref', 'model', 'quality');
    const exported = runtime.personalization.exportProfile('user-pref');
    const counts = runtime.privacy.exportSubject('user-pref');
    runtime.privacy.deleteSubject('user-pref');

    expect(recommendations[0]?.action).toBe('set-preference');
    expect(edited.preferences['model']).toBe('quality');
    expect(exported?.preferences['writingStyle']).toBe('concise');
    expect(counts['signals']).toBe(2);
    expect(runtime.store.getSignals()).toHaveLength(0);
  });

  it('produces evidence-backed recommendations across core learning domains', () => {
    const subjectId = 'org-1';
    const runtime = runtimeFor(subjectId, [
      'knowledge',
      'memory',
      'model-routing',
      'policy',
      'prompt',
      'tool-selection',
      'workflow',
    ]);

    runtime.collect(signal({ domain: 'workflow', metadata: { latencyMs: 3_000, repeatCount: 4 }, subjectId }));
    runtime.collect(signal({ domain: 'workflow', metadata: { latencyMs: 4_000, repeatCount: 5 }, subjectId }));
    runtime.collect(signal({ domain: 'prompt', metadata: { promptVersion: 'v2', qualityScore: 0.9 }, subjectId }));
    runtime.collect(signal({ domain: 'prompt', metadata: { promptVersion: 'v2', qualityScore: 0.92 }, subjectId }));
    runtime.collect(signal({ domain: 'model-routing', metadata: { cost: 0.02, latencyMs: 300, model: 'fast' }, subjectId }));
    runtime.collect(signal({ domain: 'model-routing', metadata: { cost: 0.03, latencyMs: 280, model: 'fast' }, subjectId }));
    runtime.collect(signal({ domain: 'tool-selection', metadata: { tool: 'browser', latencyMs: 100 }, subjectId }));
    runtime.collect(signal({ domain: 'tool-selection', metadata: { tool: 'browser', latencyMs: 90 }, subjectId }));
    runtime.collect(signal({ domain: 'knowledge', metadata: { ageDays: 120, connectorBroken: true }, subjectId }));
    runtime.collect(signal({ domain: 'memory', metadata: { ageDays: 45, important: true, similarityScore: 0.9 }, subjectId }));
    runtime.collect(signal({ domain: 'policy', metadata: { costTrend: 1.4, securityIncident: true }, subjectId }));

    const recommendations = runtime.recommend(subjectId);
    const actions = recommendations.map((recommendation) => recommendation.action);

    expect(actions).toEqual(
      expect.arrayContaining([
        'parallelize-workflow',
        'promote-prompt-version',
        'route-model',
        'select-tool',
        'sync-knowledge',
        'consolidate-memory',
        'update-policy',
      ]),
    );
    expect(recommendations.every((recommendation) => recommendation.evidence.sampleSize > 0)).toBe(true);
    expect(recommendations.find((recommendation) => recommendation.action === 'update-policy')?.requiresApproval).toBe(true);
  });

  it('deploys learned behavior only through approval gates and supports explanation and rollback', () => {
    const runtime = runtimeFor('user-deploy', ['workflow']);
    runtime.collect(signal({ domain: 'workflow', metadata: { latencyMs: 5_000, repeatCount: 3 }, subjectId: 'user-deploy' }));
    runtime.collect(signal({ domain: 'workflow', metadata: { latencyMs: 4_500, repeatCount: 4 }, subjectId: 'user-deploy' }));
    const recommendation = runtime.workflows
      .recommend('user-deploy')
      .find((candidate) => candidate.action === 'parallelize-workflow');

    expect(recommendation).toBeDefined();

    const blocked = runtime.deployments.deploy(recommendation?.id ?? '');
    const active = runtime.deployments.deploy(recommendation?.id ?? '', true);
    const explanation = runtime.explainability.explainDeployment(active.id);
    const rolledBack = runtime.deployments.rollback(active.id);

    expect(blocked.status).toBe('blocked');
    expect(active.status).toBe('active');
    expect(explanation.why).toContain('latency');
    expect(rolledBack.status).toBe('rolled-back');
  });

  it('runs experiments with rollout buckets and automatic rollback on regression', () => {
    const runtime = new LearningRuntime();
    const experiment = runtime.experiments.register({
      domain: 'prompt',
      name: 'Prompt v2 shadow evaluation',
      rollbackMetric: 'quality-regression',
      rolloutPercent: 50,
      strategy: 'shadow',
      subjectId: 'org-exp',
      successMetric: 'quality-lift',
      variants: ['control', 'candidate'],
    });

    runtime.experiments.record({
      experimentId: experiment.id,
      metric: 'quality-regression',
      timestamp: Date.now(),
      value: -1,
      variant: 'candidate',
    });

    const evaluated = runtime.experiments.evaluate(experiment.id);

    expect(typeof runtime.experiments.flagEnabled(experiment.id, 'user-123')).toBe('boolean');
    expect(evaluated.status).toBe('rolled-back');
  });
});

function runtimeFor(subjectId: string, domains: readonly LearningDomain[]): LearningRuntime {
  const runtime = new LearningRuntime();
  runtime.privacy.configure({
    allowedDomains: domains,
    enabled: true,
    exportable: true,
    onDeviceOnly: true,
    retentionMs: 24 * 60 * 60 * 1000,
    scope: 'user',
    subjectId,
  });
  return runtime;
}

function signal(input: {
  readonly domain: LearningDomain;
  readonly metadata?: LearningSignal['metadata'];
  readonly outcome?: LearningSignal['outcome'];
  readonly source?: LearningSignal['source'];
  readonly subjectId: string;
  readonly trust?: number;
}): LearningSignal {
  return {
    domain: input.domain,
    id: `signal_${crypto.randomUUID()}`,
    metadata: input.metadata ?? {},
    outcome: input.outcome ?? 'success',
    scope: 'user',
    source: input.source ?? 'user-feedback',
    subjectId: input.subjectId,
    timestamp: Date.now(),
    trust: input.trust ?? 0.9,
    value: { observed: true },
  };
}
