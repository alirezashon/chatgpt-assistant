import type { LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation } from './recommendation-factory';

/** Learns model routing recommendations from success, latency, cost, satisfaction, and fallback history. */
export class ModelRoutingLearner {
  public constructor(private readonly store: LearningStore) {}

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store
      .getSignals()
      .filter((signal) => signal.domain === 'model-routing' && signal.subjectId === subjectId);
    const features = this.store
      .getFeatures()
      .filter((feature) => feature.domain === 'model-routing' && feature.subjectId === subjectId);
    const successful = signals.filter((signal) => signal.outcome === 'success');
    const cost = average(features.filter((feature) => feature.name.endsWith('.cost')).map((feature) => feature.value));
    const latency = average(features.filter((feature) => feature.name.endsWith('.latencyMs')).map((feature) => feature.value));

    if (successful.length < 2) {
      return [];
    }

    const recommendation = createRecommendation({
      action: 'route-model',
      confidence: average(successful.map((signal) => signal.trust)),
      domain: 'model-routing',
      features,
      proposedChange: {
        estimatedCost: cost,
        estimatedLatencyMs: latency,
        preferredModel: successful[successful.length - 1]?.metadata['model'] ?? 'current-best',
      },
      requiresApproval: false,
      signals: successful,
      subjectId,
      summary: 'Model routing candidate has better outcome evidence across latency, cost, and success signals.',
    });
    this.store.writeRecommendation(recommendation);
    return [recommendation];
  }
}
