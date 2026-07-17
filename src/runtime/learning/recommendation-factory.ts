import type {
  LearningDomain,
  LearningEvidence,
  LearningFeature,
  LearningRecommendation,
  LearningRecommendationAction,
  LearningValue,
  ValidatedLearningSignal,
} from './learning-types';

/** Creates evidence-backed learning recommendations. */
export function createRecommendation(input: {
  readonly action: LearningRecommendationAction;
  readonly confidence: number;
  readonly domain: LearningDomain;
  readonly features: readonly LearningFeature[];
  readonly proposedChange: Readonly<Record<string, LearningValue>>;
  readonly requiresApproval: boolean;
  readonly reversible?: boolean;
  readonly signals: readonly ValidatedLearningSignal[];
  readonly subjectId: string;
  readonly summary: string;
}): LearningRecommendation {
  return {
    action: input.action,
    confidence: clamp(input.confidence),
    createdAt: Date.now(),
    domain: input.domain,
    evidence: evidence(input.summary, input.signals, input.features),
    id: `recommendation_${crypto.randomUUID()}`,
    proposedChange: input.proposedChange,
    requiresApproval: input.requiresApproval,
    reversible: input.reversible ?? true,
    status: 'pending',
    subjectId: input.subjectId,
  };
}

/** Builds evidence metadata. */
export function evidence(
  summary: string,
  signals: readonly ValidatedLearningSignal[],
  features: readonly LearningFeature[],
): LearningEvidence {
  return {
    featureIds: features.map((feature) => feature.id),
    sampleSize: signals.length,
    signalIds: signals.map((signal) => signal.id),
    summary,
  };
}

/** Average helper. */
export function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
