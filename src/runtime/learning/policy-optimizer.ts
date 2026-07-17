import type { LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation } from './recommendation-factory';

/** Recommends policy improvements that always require administrator review. */
export class PolicyOptimizer {
  public constructor(private readonly store: LearningStore) {}

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store.getSignals().filter((signal) => signal.domain === 'policy' && signal.subjectId === subjectId);
    const features = this.store.getFeatures().filter((feature) => feature.domain === 'policy' && feature.subjectId === subjectId);
    const incidents = signals.filter(
      (signal) => signal.metadata['securityIncident'] === true || signal.metadata['approvalFriction'] === true,
    );
    const costTrend = features.filter((feature) => feature.name.endsWith('.costTrend') && feature.value > 1);

    if (incidents.length === 0 && costTrend.length === 0) {
      return [];
    }

    const recommendation = createRecommendation({
      action: 'update-policy',
      confidence: average([...incidents.map((signal) => signal.trust), ...costTrend.map((feature) => feature.confidence)]),
      domain: 'policy',
      features,
      proposedChange: {
        adminReviewRequired: true,
        tuneApprovalOrCostPolicy: true,
      },
      requiresApproval: true,
      signals,
      subjectId,
      summary: 'Observed behavior suggests policy tuning, but activation requires administrator review.',
    });
    this.store.writeRecommendation(recommendation);
    return [recommendation];
  }
}
