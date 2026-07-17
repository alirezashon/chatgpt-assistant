import type { LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation } from './recommendation-factory';

/** Prompt optimizer with evidence-based promotion and rollback requirements. */
export class PromptOptimizer {
  public constructor(private readonly store: LearningStore) {}

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store.getSignals().filter((signal) => signal.domain === 'prompt' && signal.subjectId === subjectId);
    const features = this.store.getFeatures().filter((feature) => feature.domain === 'prompt' && feature.subjectId === subjectId);
    const quality = features.filter((feature) => feature.name.endsWith('.qualityScore'));
    const successes = signals.filter((signal) => signal.outcome === 'success');

    if (quality.length < 2 || successes.length < 2) {
      return [];
    }

    const recommendation = createRecommendation({
      action: 'promote-prompt-version',
      confidence: average(quality.map((feature) => feature.value * feature.confidence)),
      domain: 'prompt',
      features: quality,
      proposedChange: {
        safePromotion: true,
        version: signals[signals.length - 1]?.metadata['promptVersion'] ?? 'candidate',
      },
      requiresApproval: true,
      signals,
      subjectId,
      summary: 'Prompt version has repeated quality evidence and successful outcomes.',
    });
    this.store.writeRecommendation(recommendation);
    return [recommendation];
  }
}
