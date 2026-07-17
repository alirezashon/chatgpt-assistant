import { AIError } from './ai-errors';
import { AICostManager } from './ai-cost-manager';
import type { AIModelRegistry } from './ai-model-registry';
import type { AIProviderRegistry } from './ai-provider-registry';
import type {
  AIModelMetadata,
  AIModelRouteDecision,
  AIModelRouteRequest,
  AIModelRoutingPolicy,
  AIProviderAdapter,
  AIProviderAvailability,
} from './ai-types';

const DEFAULT_POLICY: AIModelRoutingPolicy = {
  costWeight: 0.25,
  latencyWeight: 0.25,
  qualityWeight: 0.5,
  strategy: 'balanced',
};

/** Selects the best available provider/model for a runtime request. */
export class AIModelRouter {
  public constructor(
    private readonly providers: AIProviderRegistry,
    private readonly models: AIModelRegistry,
    private readonly costs = new AICostManager(),
    private readonly policy: AIModelRoutingPolicy = DEFAULT_POLICY,
  ) {}

  /** Returns an available route for the request or throws a structured AIError. */
  public async route(input: AIModelRouteRequest): Promise<AIModelRouteDecision> {
    const candidates = await this.getCandidates(input);

    if (candidates.length === 0) {
      throw new AIError('AI_NO_PROVIDER', 'No available AI provider can satisfy the request.');
    }

    const scored = candidates
      .map((candidate) => this.scoreCandidate(candidate, input))
      .sort(
        (left, right) => right.score - left.score || left.model.id.localeCompare(right.model.id),
      );

    const selected = scored[0];

    if (selected === undefined) {
      throw new AIError('AI_NO_PROVIDER', 'No AI route could be selected.');
    }

    return selected;
  }

  private async getCandidates(input: AIModelRouteRequest): Promise<readonly RouteCandidate[]> {
    const requested = input.request;
    const allProviders = this.providers.all();
    const availabilityByProvider = new Map<string, AIProviderAvailability>();

    for (const provider of allProviders) {
      availabilityByProvider.set(provider.metadata.id, await provider.availability());
    }

    const capableModels = this.getCapableModels(input);
    const preferred =
      requested.preferredModelId === undefined
        ? undefined
        : this.models.get(requested.preferredModelId);
    const orderedModels =
      preferred === undefined
        ? capableModels
        : [preferred, ...capableModels.filter((model) => model.id !== preferred.id)];

    return orderedModels.flatMap((model) => {
      const provider = this.providers.get(model.providerId);

      if (provider === undefined) {
        return [];
      }

      const availability = availabilityByProvider.get(provider.metadata.id);

      if (availability !== 'available' && availability !== 'degraded') {
        return [];
      }

      if (requested.privacyMode === 'maximum-privacy' && !provider.metadata.local) {
        return [];
      }

      return [
        {
          model,
          provider,
          preferred: model.id === requested.preferredModelId,
        },
      ];
    });
  }

  private getCapableModels(input: AIModelRouteRequest): readonly AIModelMetadata[] {
    return this.models.findByCapabilities(input.request.requiredCapabilities);
  }

  private scoreCandidate(
    candidate: RouteCandidate,
    input: AIModelRouteRequest,
  ): AIModelRouteDecision {
    const outputTokens = this.getOutputTokenBudget(candidate.model, input);
    const estimate = this.costs.estimate(candidate.model, input.estimatedInputTokens, outputTokens);
    const maxCost = Math.max(
      ...this.models.findByCapabilities(input.request.requiredCapabilities).map((model) => {
        const modelEstimate = this.costs.estimate(model, input.estimatedInputTokens, outputTokens);
        return modelEstimate.costUsd;
      }),
      estimate.costUsd,
    );
    const maxLatency = Math.max(
      ...this.models
        .findByCapabilities(input.request.requiredCapabilities)
        .map((model) => model.latencyMs),
      1,
    );
    const costScore = 1 - estimate.costUsd / Math.max(maxCost, Number.EPSILON);
    const latencyScore = 1 - candidate.model.latencyMs / maxLatency;
    const qualityScore = candidate.model.quality;
    const policy = this.getEffectivePolicy();
    const preferredBonus = candidate.preferred ? 0.05 : 0;
    const score = clamp01(
      costScore * policy.costWeight +
        latencyScore * policy.latencyWeight +
        qualityScore * policy.qualityWeight +
        preferredBonus,
    );

    return {
      estimatedCostUsd: estimate.costUsd,
      model: candidate.model,
      provider: candidate.provider,
      reason: candidate.preferred ? 'preferred-model' : policy.strategy,
      score,
    };
  }

  private getEffectivePolicy(): AIModelRoutingPolicy {
    if (this.policy.strategy === 'highest-quality') {
      return {
        costWeight: 0.05,
        latencyWeight: 0.1,
        qualityWeight: 0.85,
        strategy: this.policy.strategy,
      };
    }

    if (this.policy.strategy === 'lowest-cost') {
      return {
        costWeight: 0.8,
        latencyWeight: 0.1,
        qualityWeight: 0.1,
        strategy: this.policy.strategy,
      };
    }

    if (this.policy.strategy === 'lowest-latency') {
      return {
        costWeight: 0.1,
        latencyWeight: 0.8,
        qualityWeight: 0.1,
        strategy: this.policy.strategy,
      };
    }

    return this.policy;
  }

  private getOutputTokenBudget(model: AIModelMetadata, input: AIModelRouteRequest): number {
    return Math.min(input.request.maxOutputTokens ?? model.maxOutputTokens, model.maxOutputTokens);
  }
}

interface RouteCandidate {
  readonly model: AIModelMetadata;
  readonly provider: AIProviderAdapter;
  readonly preferred: boolean;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
