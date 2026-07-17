import type { LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation } from './recommendation-factory';

/** Detects outdated, duplicate, unused, missing, and broken knowledge signals. */
export class KnowledgeQualityEngine {
  public constructor(private readonly store: LearningStore) {}

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store.getSignals().filter((signal) => signal.domain === 'knowledge' && signal.subjectId === subjectId);
    const features = this.store.getFeatures().filter((feature) => feature.domain === 'knowledge' && feature.subjectId === subjectId);
    const recommendations: LearningRecommendation[] = [];
    const stale = features.filter((feature) => feature.name.endsWith('.ageDays') && feature.value > 90);
    const duplicates = features.filter((feature) => feature.name.endsWith('.duplicateScore') && feature.value > 0.8);
    const missing = signals.filter((signal) => signal.metadata['missingInformation'] === true);
    const broken = signals.filter((signal) => signal.metadata['connectorBroken'] === true);

    if (stale.length > 0 || broken.length > 0) {
      recommendations.push(
        createRecommendation({
          action: broken.length > 0 ? 'sync-knowledge' : 'reindex-knowledge',
          confidence: average([...stale.map((feature) => feature.confidence), ...broken.map((signal) => signal.trust)]),
          domain: 'knowledge',
          features: stale,
          proposedChange: { refreshRequired: true },
          requiresApproval: false,
          signals,
          subjectId,
          summary: 'Knowledge source appears stale or connector health is degraded.',
        }),
      );
    }

    if (duplicates.length > 0 || missing.length > 0) {
      recommendations.push(
        createRecommendation({
          action: 'cleanup-knowledge',
          confidence: average([...duplicates.map((feature) => feature.confidence), ...missing.map((signal) => signal.trust)]),
          domain: 'knowledge',
          features: duplicates,
          proposedChange: { cleanupDuplicates: duplicates.length > 0, reportGaps: missing.length > 0 },
          requiresApproval: true,
          signals,
          subjectId,
          summary: 'Knowledge quality signals show duplicate content or missing information.',
        }),
      );
    }

    for (const recommendation of recommendations) {
      this.store.writeRecommendation(recommendation);
    }

    return recommendations;
  }
}
