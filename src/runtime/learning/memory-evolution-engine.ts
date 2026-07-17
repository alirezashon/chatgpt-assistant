import type { LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation } from './recommendation-factory';

/** Evolves memory with explicit recommendations and no silent deletion. */
export class MemoryEvolutionEngine {
  public constructor(private readonly store: LearningStore) {}

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store.getSignals().filter((signal) => signal.domain === 'memory' && signal.subjectId === subjectId);
    const features = this.store.getFeatures().filter((feature) => feature.domain === 'memory' && feature.subjectId === subjectId);
    const recommendations: LearningRecommendation[] = [];
    const repeated = features.filter((feature) => feature.name.endsWith('.similarityScore') && feature.value > 0.85);
    const oldTemporary = features.filter((feature) => feature.name.endsWith('.ageDays') && feature.value > 30);
    const important = signals.some((signal) => signal.metadata['important'] === true);

    if (repeated.length > 0) {
      recommendations.push(
        createRecommendation({
          action: 'consolidate-memory',
          confidence: average(repeated.map((feature) => feature.confidence)),
          domain: 'memory',
          features: repeated,
          proposedChange: { consolidation: true },
          requiresApproval: false,
          signals,
          subjectId,
          summary: 'Similar memory records can be consolidated.',
        }),
      );
    }

    if (oldTemporary.length > 0) {
      recommendations.push(
        createRecommendation({
          action: important ? 'summarize-memory' : 'archive-memory',
          confidence: average(oldTemporary.map((feature) => feature.confidence)),
          domain: 'memory',
          features: oldTemporary,
          proposedChange: { silentDeletion: false },
          requiresApproval: true,
          signals,
          subjectId,
          summary: 'Temporary memories have aged and should be reviewed for archival or summarization.',
        }),
      );
    }

    for (const recommendation of recommendations) {
      this.store.writeRecommendation(recommendation);
    }

    return recommendations;
  }
}
