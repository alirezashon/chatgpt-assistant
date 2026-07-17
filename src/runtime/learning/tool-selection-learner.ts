import type { LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation } from './recommendation-factory';

/** Learns best tool choices by task type, reliability, latency, acceptance, and permissions. */
export class ToolSelectionLearner {
  public constructor(private readonly store: LearningStore) {}

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store
      .getSignals()
      .filter((signal) => signal.domain === 'tool-selection' && signal.subjectId === subjectId);
    const features = this.store
      .getFeatures()
      .filter((feature) => feature.domain === 'tool-selection' && feature.subjectId === subjectId);
    const accepted = signals.filter((signal) => signal.source === 'accepted-suggestion' || signal.outcome === 'success');

    if (accepted.length < 2) {
      return [];
    }

    const recommendation = createRecommendation({
      action: 'select-tool',
      confidence: average(accepted.map((signal) => signal.trust)),
      domain: 'tool-selection',
      features,
      proposedChange: {
        confidenceScore: average(features.map((feature) => feature.confidence)),
        tool: accepted[accepted.length - 1]?.metadata['tool'] ?? 'best-known-tool',
      },
      requiresApproval: false,
      signals: accepted,
      subjectId,
      summary: 'Tool has repeated successful or accepted outcomes for this task pattern.',
    });
    this.store.writeRecommendation(recommendation);
    return [recommendation];
  }
}
