import type { LearningFeature, LearningRecommendation, LearningValue, PreferenceProfile } from './learning-types';
import type { LearningStore } from './learning-store';
import { average, createRecommendation, evidence } from './recommendation-factory';

/** Learns transparent user and organization preferences. */
export class PersonalizationEngine {
  public constructor(private readonly store: LearningStore) {}

  public refreshProfile(subjectId: string): PreferenceProfile {
    const signals = this.store
      .getSignals()
      .filter((signal) => signal.domain === 'personalization' && signal.subjectId === subjectId);
    const features = this.store
      .getFeatures()
      .filter((feature) => feature.domain === 'personalization' && feature.subjectId === subjectId);
    const preferences: Record<string, LearningValue> = {};
    const evidenceByPreference: Record<string, ReturnType<typeof evidence>> = {};

    for (const signal of signals) {
      for (const [key, value] of Object.entries(signal.metadata)) {
        if (key.startsWith('preference.')) {
          const preferenceKey = key.replace('preference.', '');
          preferences[preferenceKey] = value;
          evidenceByPreference[preferenceKey] = evidence(`Learned ${preferenceKey} from user behavior.`, [signal], features);
        }
      }
    }

    const profile: PreferenceProfile = {
      evidence: evidenceByPreference,
      id: `profile_${subjectId}`,
      preferences,
      scope: signals[0]?.scope ?? 'user',
      subjectId,
      updatedAt: Date.now(),
    };
    this.store.writeProfile(profile);
    return profile;
  }

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    const signals = this.store
      .getSignals()
      .filter((signal) => signal.domain === 'personalization' && signal.subjectId === subjectId);
    const features = this.store
      .getFeatures()
      .filter((feature) => feature.domain === 'personalization' && feature.subjectId === subjectId);

    if (signals.length < 2) {
      return [];
    }

    const confidence = average(features.map((feature) => feature.confidence));
    const recommendation = createRecommendation({
      action: 'set-preference',
      confidence,
      domain: 'personalization',
      features,
      proposedChange: this.refreshProfile(subjectId).preferences,
      requiresApproval: false,
      signals,
      subjectId,
      summary: 'Observed stable user preferences across repeated interactions.',
    });
    this.store.writeRecommendation(recommendation);
    return [recommendation];
  }

  public editPreference(subjectId: string, key: string, value: LearningValue): PreferenceProfile {
    const existing = this.store.getProfile(`profile_${subjectId}`);
    const profile: PreferenceProfile = {
      evidence: existing?.evidence ?? {},
      id: `profile_${subjectId}`,
      preferences: {
        ...(existing?.preferences ?? {}),
        [key]: value,
      },
      scope: existing?.scope ?? 'user',
      subjectId,
      updatedAt: Date.now(),
    };
    this.store.writeProfile(profile);
    return profile;
  }

  public exportProfile(subjectId: string): PreferenceProfile | undefined {
    return this.store.getProfile(`profile_${subjectId}`);
  }
}

/** Returns numeric features by name. */
export function featuresByName(features: readonly LearningFeature[], name: string): readonly LearningFeature[] {
  return features.filter((feature) => feature.name.endsWith(`.${name}`));
}
