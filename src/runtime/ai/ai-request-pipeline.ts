import { AIError } from './ai-errors';
import { AICacheManager } from './ai-cache-manager';
import { AIContextBuilder } from './ai-context-builder';
import { AICostManager } from './ai-cost-manager';
import { AITokenManager } from './ai-token-manager';
import type { AIModelRouteDecision, AIPreparedRequest, AIRequest } from './ai-types';
import type { AIPromptManager } from './ai-prompt-manager';

/** Builds provider requests from runtime requests after routing. */
export class AIRequestPipeline {
  public constructor(
    private readonly prompts: AIPromptManager,
    private readonly contextBuilder = new AIContextBuilder(),
    private readonly tokens = new AITokenManager(),
    private readonly costs = new AICostManager(),
    private readonly cache = new AICacheManager(),
  ) {}

  /** Prepares a provider request and validates cost budget. */
  public prepare(request: AIRequest, route: AIModelRouteDecision): AIPreparedRequest {
    const baseMessages = this.prompts.build(request.promptTemplateId, request.variables);
    const maxOutputTokens = Math.min(
      request.maxOutputTokens ?? route.model.maxOutputTokens,
      route.model.maxOutputTokens,
    );
    const promptTokens = this.tokens.estimateMessages(baseMessages);
    const contextBudget = Math.max(
      0,
      route.model.contextWindowTokens - promptTokens - maxOutputTokens,
    );
    const messages = this.contextBuilder.build({
      context: request.context,
      maxContextTokens: contextBudget,
      messages: baseMessages,
    });
    const estimatedInputTokens = this.tokens.estimateMessages(messages);
    const estimate = this.costs.estimate(route.model, estimatedInputTokens, maxOutputTokens);

    if (estimatedInputTokens + maxOutputTokens > route.model.contextWindowTokens) {
      throw new AIError(
        'AI_CONTEXT_TOO_LARGE',
        'Prompt and selected context exceed the model context window.',
      );
    }

    if (request.maxCostUsd !== undefined && estimate.costUsd > request.maxCostUsd) {
      throw new AIError('AI_BUDGET_EXCEEDED', 'AI request exceeds configured cost budget.');
    }

    const cacheKey = this.getCacheKey(request, route);

    return {
      ...(cacheKey === undefined ? {} : { cacheKey }),
      estimatedCostUsd: estimate.costUsd,
      estimatedInputTokens,
      estimatedOutputTokens: maxOutputTokens,
      providerRequest: {
        ...(request.cancellationToken === undefined
          ? {}
          : { cancellationToken: request.cancellationToken }),
        id: request.id,
        maxOutputTokens,
        messages,
        model: route.model,
        stream: request.stream,
      },
      request,
    };
  }

  private getCacheKey(request: AIRequest, route: AIModelRouteDecision): string | undefined {
    if (request.cacheTtlMs === 0 || request.privacyMode === 'maximum-privacy' || request.stream) {
      return undefined;
    }

    return this.cache.key([
      request.taskType,
      request.intent,
      request.promptTemplateId,
      JSON.stringify(request.variables),
      route.model.id,
      request.context
        .map((chunk) => `${chunk.id}:${chunk.content}:${chunk.sensitivity}`)
        .join('\n'),
    ]);
  }
}
