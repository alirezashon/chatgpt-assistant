import type {
  LearningAuditEvent,
  LearningFeature,
  LearningSignal,
  LearningValue,
  ValidatedLearningSignal,
} from './learning-types';
import type { LearningPrivacyManager } from './privacy-manager';
import type { LearningStore } from './learning-store';

/** Pipeline result for collected learning signals. */
export interface LearningPipelineResult {
  readonly accepted: boolean;
  readonly features: readonly LearningFeature[];
  readonly signal?: ValidatedLearningSignal;
  readonly reason: string;
}

/** Collects, validates, normalizes, extracts features, and stores learning signals. */
export class LearningPipeline {
  public constructor(
    private readonly store: LearningStore,
    private readonly privacy: LearningPrivacyManager,
  ) {}

  public collect(signal: LearningSignal): LearningPipelineResult {
    if (!this.privacy.enabled(signal.scope, signal.subjectId, signal.domain)) {
      this.audit('validation', 'learning.disabled', { domain: signal.domain, subjectId: signal.subjectId });
      return { accepted: false, features: [], reason: 'Learning is disabled for this scope or domain.' };
    }

    const minimized = this.privacy.minimize(signal);
    const poisoningFlags = this.poisoningFlags(minimized);

    if (minimized.trust < 0.2) {
      this.audit('validation', 'signal.rejected.low-trust', { signalId: minimized.id, trust: minimized.trust });
      return { accepted: false, features: [], reason: 'Signal trust is below learning threshold.' };
    }

    if (poisoningFlags.includes('synthetic-abuse')) {
      this.audit('validation', 'signal.rejected.poisoning', { signalId: minimized.id });
      return { accepted: false, features: [], reason: 'Signal failed poisoning checks.' };
    }

    const validated: ValidatedLearningSignal = {
      ...minimized,
      normalizedOutcomeScore: this.outcomeScore(minimized.outcome),
      poisoningFlags,
    };
    const features = this.extractFeatures(validated);
    this.store.writeSignal(validated);

    for (const feature of features) {
      this.store.writeFeature(feature);
    }

    this.audit('signal', 'signal.accepted', { featureCount: features.length, signalId: signal.id });
    return {
      accepted: true,
      features,
      reason: 'Signal accepted.',
      signal: validated,
    };
  }

  private extractFeatures(signal: ValidatedLearningSignal): readonly LearningFeature[] {
    const base = {
      domain: signal.domain,
      scope: signal.scope,
      signalId: signal.id,
      subjectId: signal.subjectId,
      timestamp: signal.timestamp,
    };
    const features: LearningFeature[] = [
      {
        ...base,
        confidence: signal.trust,
        id: `feature_${crypto.randomUUID()}`,
        name: `${signal.domain}.outcome`,
        value: signal.normalizedOutcomeScore,
      },
    ];

    for (const [key, value] of Object.entries(signal.metadata)) {
      const numeric = this.numericValue(value);

      if (numeric !== undefined) {
        features.push({
          ...base,
          confidence: signal.trust,
          id: `feature_${crypto.randomUUID()}`,
          name: `${signal.domain}.${key}`,
          value: numeric,
        });
      }
    }

    return features;
  }

  private poisoningFlags(signal: LearningSignal): readonly string[] {
    const flags: string[] = [];

    if (signal.trust < 0.5) {
      flags.push('low-trust');
    }

    if (signal.metadata['synthetic'] === true || signal.metadata['sourceIntegrity'] === 'failed') {
      flags.push('synthetic-abuse');
    }

    const burstCountValue = signal.metadata['burstCount'];
    const burstCount = burstCountValue === undefined ? undefined : this.numericValue(burstCountValue);

    if (signal.source === 'user-feedback' && burstCount !== undefined && burstCount > 20) {
      flags.push('feedback-burst');
    }

    return flags;
  }

  private outcomeScore(outcome: LearningSignal['outcome']): number {
    if (outcome === 'success') {
      return 1;
    }

    if (outcome === 'failure') {
      return -1;
    }

    return 0;
  }

  private numericValue(value: LearningValue): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private audit(type: LearningAuditEvent['type'], message: string, attributes: Readonly<Record<string, LearningValue>>): void {
    this.store.writeAudit({
      attributes,
      id: `audit_${crypto.randomUUID()}`,
      message,
      timestamp: Date.now(),
      type,
    });
  }
}
