import { AICostManager } from './ai-cost-manager';
import { AIEvaluationManager } from './ai-evaluation-manager';
import type { AIModelMetadata, AIProviderResponse, AIRequest, AIResponse } from './ai-types';

/** Normalizes provider responses, records usage, and attaches quality metadata. */
export class AIResponsePipeline {
  public constructor(
    private readonly costs = new AICostManager(),
    private readonly evaluator = new AIEvaluationManager(),
  ) {}

  /** Converts a provider response into a runtime response. */
  public complete(
    request: AIRequest,
    providerResponse: AIProviderResponse,
    model: AIModelMetadata,
  ): AIResponse {
    const costUsd = this.costs.estimate(
      model,
      providerResponse.inputTokens,
      providerResponse.outputTokens,
    ).costUsd;
    const response: AIResponse = {
      ...providerResponse,
      cached: false,
      costUsd,
      evaluationScore: 0,
    };
    const evaluationScore = this.evaluator.evaluate(request, response);

    this.costs.record(costUsd);

    return {
      ...response,
      evaluationScore,
    };
  }
}
