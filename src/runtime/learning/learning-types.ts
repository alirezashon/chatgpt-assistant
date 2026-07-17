/** Stable Learning Runtime version. */
export const LEARNING_RUNTIME_VERSION = '1.0.0';

/** JSON-like learning value. */
export type LearningValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: LearningValue }
  | readonly LearningValue[];

/** Learning scope. */
export type LearningScope = 'global' | 'organization' | 'user';

/** Learning domain. */
export type LearningDomain =
  | 'agent'
  | 'automation'
  | 'knowledge'
  | 'memory'
  | 'model-routing'
  | 'personalization'
  | 'policy'
  | 'prompt'
  | 'tool-selection'
  | 'workflow';

/** Signal source. */
export type LearningSignalSource =
  | 'accepted-suggestion'
  | 'agent-outcome'
  | 'correction'
  | 'knowledge-quality'
  | 'latency'
  | 'memory-quality'
  | 'model-performance'
  | 'rejected-suggestion'
  | 'tool-performance'
  | 'user-feedback'
  | 'workflow-outcome';

/** Learning signal. */
export interface LearningSignal {
  readonly id: string;
  readonly domain: LearningDomain;
  readonly source: LearningSignalSource;
  readonly scope: LearningScope;
  readonly subjectId: string;
  readonly organizationId?: string;
  readonly userId?: string;
  readonly timestamp: number;
  readonly trust: number;
  readonly outcome: 'failure' | 'neutral' | 'success';
  readonly value: LearningValue;
  readonly metadata: Readonly<Record<string, LearningValue>>;
}

/** Validated signal with security flags. */
export interface ValidatedLearningSignal extends LearningSignal {
  readonly normalizedOutcomeScore: number;
  readonly poisoningFlags: readonly string[];
}

/** Extracted learning feature. */
export interface LearningFeature {
  readonly id: string;
  readonly signalId: string;
  readonly domain: LearningDomain;
  readonly scope: LearningScope;
  readonly subjectId: string;
  readonly name: string;
  readonly value: number;
  readonly confidence: number;
  readonly timestamp: number;
}

/** Evidence attached to a recommendation or deployment. */
export interface LearningEvidence {
  readonly signalIds: readonly string[];
  readonly featureIds: readonly string[];
  readonly summary: string;
  readonly sampleSize: number;
}

/** Recommendation action. */
export type LearningRecommendationAction =
  | 'adjust-approval-threshold'
  | 'archive-memory'
  | 'cache-workflow-step'
  | 'cleanup-knowledge'
  | 'consolidate-memory'
  | 'parallelize-workflow'
  | 'promote-prompt-version'
  | 'recommend-automation'
  | 'reindex-knowledge'
  | 'route-model'
  | 'select-tool'
  | 'set-preference'
  | 'simplify-workflow'
  | 'summarize-memory'
  | 'sync-knowledge'
  | 'update-policy';

/** Explainable recommendation. */
export interface LearningRecommendation {
  readonly id: string;
  readonly domain: LearningDomain;
  readonly subjectId: string;
  readonly action: LearningRecommendationAction;
  readonly confidence: number;
  readonly evidence: LearningEvidence;
  readonly reversible: boolean;
  readonly requiresApproval: boolean;
  readonly createdAt: number;
  readonly proposedChange: Readonly<Record<string, LearningValue>>;
  readonly status: 'accepted' | 'deployed' | 'pending' | 'rejected' | 'rolled-back';
}

/** Transparent preference profile. */
export interface PreferenceProfile {
  readonly id: string;
  readonly scope: LearningScope;
  readonly subjectId: string;
  readonly preferences: Readonly<Record<string, LearningValue>>;
  readonly evidence: Readonly<Record<string, LearningEvidence>>;
  readonly updatedAt: number;
}

/** Privacy controls for learning. */
export interface LearningPrivacySettings {
  readonly scope: LearningScope;
  readonly subjectId: string;
  readonly enabled: boolean;
  readonly allowedDomains: readonly LearningDomain[];
  readonly retentionMs: number;
  readonly onDeviceOnly: boolean;
  readonly exportable: boolean;
}

/** Experiment definition. */
export interface LearningExperiment {
  readonly id: string;
  readonly name: string;
  readonly domain: LearningDomain;
  readonly subjectId: string;
  readonly variants: readonly string[];
  readonly rolloutPercent: number;
  readonly strategy: 'ab-test' | 'canary' | 'gradual-rollout' | 'shadow';
  readonly status: 'active' | 'paused' | 'promoted' | 'rolled-back';
  readonly successMetric: string;
  readonly rollbackMetric: string;
  readonly createdAt: number;
}

/** Experiment observation. */
export interface ExperimentOutcome {
  readonly experimentId: string;
  readonly variant: string;
  readonly metric: string;
  readonly value: number;
  readonly timestamp: number;
}

/** Reversible deployment record. */
export interface LearningDeployment {
  readonly id: string;
  readonly recommendationId: string;
  readonly domain: LearningDomain;
  readonly subjectId: string;
  readonly version: number;
  readonly change: Readonly<Record<string, LearningValue>>;
  readonly confidence: number;
  readonly status: 'active' | 'blocked' | 'rolled-back';
  readonly rollbackToVersion?: number;
  readonly reason: string;
  readonly deployedAt: number;
}

/** Explanation for learned behavior. */
export interface LearningExplanation {
  readonly targetId: string;
  readonly whatChanged: string;
  readonly why: string;
  readonly evidence: LearningEvidence;
  readonly confidence: number;
  readonly learnedAt: number;
  readonly reversible: boolean;
  readonly rollbackPath: string;
}

/** Audit event. */
export interface LearningAuditEvent {
  readonly id: string;
  readonly type:
    | 'deployment'
    | 'experiment'
    | 'feature'
    | 'privacy'
    | 'recommendation'
    | 'rollback'
    | 'signal'
    | 'validation';
  readonly message: string;
  readonly timestamp: number;
  readonly attributes: Readonly<Record<string, LearningValue>>;
}
