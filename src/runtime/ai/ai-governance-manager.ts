import type { AIModelMetadata, AIPrivacyMode, AIProviderAdapter } from './ai-types';
import { AIError } from './ai-errors';

/** Enterprise model governance policy. */
export interface AIGovernancePolicy {
  /** Allowed provider ids. Empty means all providers allowed unless forbidden. */
  readonly allowedProviders: readonly string[];
  /** Forbidden provider ids. */
  readonly forbiddenProviders: readonly string[];
  /** Allowed model ids. Empty means all models allowed unless forbidden. */
  readonly allowedModels: readonly string[];
  /** Forbidden model ids. */
  readonly forbiddenModels: readonly string[];
  /** Require local/private model. */
  readonly requireLocal: boolean;
  /** Maximum cost per request. */
  readonly maxCostUsd?: number;
  /** Allowed data residency regions. */
  readonly dataResidency?: readonly string[];
}

/** Enforces enterprise provider/model governance. */
export class AIGovernanceManager {
  private policy: AIGovernancePolicy = {
    allowedModels: [],
    allowedProviders: [],
    forbiddenModels: [],
    forbiddenProviders: [],
    requireLocal: false,
  };

  /** Replaces policy. */
  public setPolicy(policy: AIGovernancePolicy): void {
    this.policy = policy;
  }

  /** Returns policy. */
  public getPolicy(): AIGovernancePolicy {
    return this.policy;
  }

  /** Asserts model route is governed. */
  public assertAllowed(input: {
    readonly estimatedCostUsd: number;
    readonly model: AIModelMetadata;
    readonly privacyMode: AIPrivacyMode;
    readonly provider: AIProviderAdapter;
  }): void {
    const providerId = input.provider.metadata.id;
    const modelId = input.model.id;

    if (this.policy.forbiddenProviders.includes(providerId)) {
      throw new AIError('AI_SECURITY_BLOCKED', `Provider is forbidden by governance: ${providerId}`);
    }

    if (this.policy.allowedProviders.length > 0 && !this.policy.allowedProviders.includes(providerId)) {
      throw new AIError('AI_SECURITY_BLOCKED', `Provider is not approved: ${providerId}`);
    }

    if (this.policy.forbiddenModels.includes(modelId)) {
      throw new AIError('AI_SECURITY_BLOCKED', `Model is forbidden by governance: ${modelId}`);
    }

    if (this.policy.allowedModels.length > 0 && !this.policy.allowedModels.includes(modelId)) {
      throw new AIError('AI_SECURITY_BLOCKED', `Model is not approved: ${modelId}`);
    }

    if ((this.policy.requireLocal || input.privacyMode === 'maximum-privacy') && !input.provider.metadata.local) {
      throw new AIError('AI_SECURITY_BLOCKED', 'Policy requires local model execution.');
    }

    if (this.policy.maxCostUsd !== undefined && input.estimatedCostUsd > this.policy.maxCostUsd) {
      throw new AIError('AI_BUDGET_EXCEEDED', 'Request exceeds governance cost limit.');
    }

    if (
      this.policy.dataResidency !== undefined &&
      input.model.dataResidency !== undefined &&
      !this.policy.dataResidency.includes(input.model.dataResidency)
    ) {
      throw new AIError('AI_SECURITY_BLOCKED', `Model data residency is not allowed: ${input.model.dataResidency}`);
    }
  }
}
