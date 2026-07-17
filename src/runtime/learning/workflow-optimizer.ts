import type { LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation } from './recommendation-factory';

/** Optimizes workflow structure from repeated outcomes and bottlenecks. */
export class WorkflowOptimizer {
  public constructor(private readonly store: LearningStore) {}

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store.getSignals().filter((signal) => signal.domain === 'workflow' && signal.subjectId === subjectId);
    const features = this.store.getFeatures().filter((feature) => feature.domain === 'workflow' && feature.subjectId === subjectId);
    const recommendations: LearningRecommendation[] = [];
    const repeated = signals.filter((signal) => signal.metadata['repeatCount'] !== undefined);
    const slowFeatures = features.filter((feature) => feature.name.endsWith('.latencyMs') && feature.value > 2_000);
    const failedFeatures = features.filter((feature) => feature.name === 'workflow.outcome' && feature.value < 0);

    if (repeated.length >= 2) {
      recommendations.push(
        createRecommendation({
          action: 'recommend-automation',
          confidence: average(repeated.map((signal) => signal.trust)),
          domain: 'workflow',
          features,
          proposedChange: { automationCandidate: true },
          requiresApproval: false,
          signals: repeated,
          subjectId,
          summary: 'Workflow was repeated often enough to recommend automation.',
        }),
      );
    }

    if (slowFeatures.length > 0) {
      recommendations.push(
        createRecommendation({
          action: 'parallelize-workflow',
          confidence: average(slowFeatures.map((feature) => feature.confidence)),
          domain: 'workflow',
          features: slowFeatures,
          proposedChange: { strategy: 'parallelize-slow-steps' },
          requiresApproval: true,
          signals,
          subjectId,
          summary: 'Workflow latency indicates bottlenecks that can be parallelized.',
        }),
      );
    }

    if (failedFeatures.length > 0) {
      recommendations.push(
        createRecommendation({
          action: 'simplify-workflow',
          confidence: average(failedFeatures.map((feature) => feature.confidence)),
          domain: 'workflow',
          features: failedFeatures,
          proposedChange: { removeUnusedOrFailingSteps: true },
          requiresApproval: true,
          signals,
          subjectId,
          summary: 'Workflow failure paths suggest simplification.',
        }),
      );
    }

    for (const recommendation of recommendations) {
      this.store.writeRecommendation(recommendation);
    }

    return recommendations;
  }
}
