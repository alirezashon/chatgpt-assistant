import { AIError, AIErrorManager } from './ai-errors';
import { AICacheManager } from './ai-cache-manager';
import { AICostManager } from './ai-cost-manager';
import { AIFallbackManager } from './ai-fallback-manager';
import { AIHistoryManager, type AIHistoryEntry } from './ai-history-manager';
import { AIModelRegistry } from './ai-model-registry';
import { AIModelRouter } from './ai-model-router';
import { AIProviderRegistry } from './ai-provider-registry';
import { AIPromptManager } from './ai-prompt-manager';
import { AIRequestPipeline } from './ai-request-pipeline';
import { AIResponsePipeline } from './ai-response-pipeline';
import { AISecurityManager } from './ai-security-manager';
import { AIStreamingManager } from './ai-streaming-manager';
import { AITokenManager } from './ai-token-manager';
import type {
  AIModelRouteDecision,
  AIProviderAdapter,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AIPromptTemplate,
} from './ai-types';

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/** Headless AI gateway used by features, commands, and future workflow modules. */
export class AIRuntime {
  private readonly providers: AIProviderRegistry;
  private readonly models: AIModelRegistry;
  private readonly prompts: AIPromptManager;
  private readonly tokens: AITokenManager;
  private readonly costs: AICostManager;
  private readonly cache: AICacheManager;
  private readonly fallback: AIFallbackManager;
  private readonly history: AIHistoryManager;
  private readonly security: AISecurityManager;
  private readonly errors: AIErrorManager;
  private readonly router: AIModelRouter;
  private readonly requestPipeline: AIRequestPipeline;
  private readonly responsePipeline: AIResponsePipeline;
  private readonly streaming: AIStreamingManager;
  private readonly routeGuard: AIRouteGuard | undefined;

  public constructor(input: AIRuntimeDependencies = {}) {
    this.providers = input.providers ?? new AIProviderRegistry();
    this.models = input.models ?? new AIModelRegistry();
    this.prompts = input.prompts ?? new AIPromptManager();
    this.tokens = input.tokens ?? new AITokenManager();
    this.costs = input.costs ?? new AICostManager();
    this.cache = input.cache ?? new AICacheManager();
    this.fallback = input.fallback ?? new AIFallbackManager();
    this.history = input.history ?? new AIHistoryManager();
    this.security = input.security ?? new AISecurityManager();
    this.errors = input.errors ?? new AIErrorManager();
    this.router = input.router ?? new AIModelRouter(this.providers, this.models, this.costs);
    this.requestPipeline =
      input.requestPipeline ??
      new AIRequestPipeline(this.prompts, undefined, this.tokens, this.costs, this.cache);
    this.responsePipeline = input.responsePipeline ?? new AIResponsePipeline(this.costs);
    this.streaming = input.streaming ?? new AIStreamingManager();
    this.routeGuard = input.routeGuard;
  }

  /** Registers a provider and indexes its advertised models. */
  public async registerProvider(provider: AIProviderAdapter): Promise<void> {
    this.providers.register(provider);
    this.models.registerMany(await provider.models());
  }

  /** Registers a versioned prompt template. */
  public registerPrompt(template: AIPromptTemplate): void {
    this.prompts.register(template);
  }

  /** Completes a non-streaming AI request with routing, cache, fallback, and accounting. */
  public async complete(request: AIRequest): Promise<AIResponse> {
    request.cancellationToken?.throwIfCancellationRequested();

    const route = await this.route(request);

    return this.completeWithFallback(request, route);
  }

  /** Streams an AI request through the selected provider. */
  public async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const route = await this.route({ ...request, stream: true });
    this.security.assertRequestAllowed(request, route);
    this.routeGuard?.(request, route);

    const prepared = this.requestPipeline.prepare({ ...request, stream: true }, route);

    for await (const chunk of this.streaming.stream(route.provider, prepared.providerRequest)) {
      yield chunk;
    }
  }

  /** Returns the current aggregate cost recorded by this runtime. */
  public totalCostUsd(): number {
    return this.costs.total();
  }

  /** Returns metadata-only request history, newest first. */
  public historyEntries(): readonly AIHistoryEntry[] {
    return this.history.list();
  }

  private async route(request: AIRequest): Promise<AIModelRouteDecision> {
    const messages = this.prompts.build(request.promptTemplateId, request.variables);
    const estimatedInputTokens =
      this.tokens.estimateMessages(messages) +
      request.context.reduce(
        (sum, chunk) => sum + (chunk.estimatedTokens ?? this.tokens.estimate(chunk.content)),
        0,
      );

    return this.router.route({
      estimatedInputTokens,
      request,
    });
  }

  private async completeWithFallback(
    request: AIRequest,
    route: AIModelRouteDecision,
  ): Promise<AIResponse> {
    try {
      return await this.execute(request, route);
    } catch (error) {
      if (error instanceof AIError && error.aiCode === 'AI_BUDGET_EXCEEDED') {
        throw error;
      }

      return this.tryFallbacks(request, route, this.errors.normalize(error));
    }
  }

  private async execute(request: AIRequest, route: AIModelRouteDecision): Promise<AIResponse> {
    this.security.assertRequestAllowed(request, route);
    this.routeGuard?.(request, route);

    const prepared = this.requestPipeline.prepare({ ...request, stream: false }, route);
    const cached = prepared.cacheKey === undefined ? undefined : this.cache.get(prepared.cacheKey);

    if (cached !== undefined) {
      this.history.recordSuccess(request, cached);
      return cached;
    }

    const providerResponse = await route.provider.complete(prepared.providerRequest);
    const response = this.responsePipeline.complete(request, providerResponse, route.model);
    const ttlMs = request.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

    if (prepared.cacheKey !== undefined && ttlMs > 0) {
      this.cache.set(prepared.cacheKey, response, ttlMs);
    }

    this.history.recordSuccess(request, response);

    return response;
  }

  private async tryFallbacks(
    request: AIRequest,
    failedRoute: AIModelRouteDecision,
    originalError: Error,
  ): Promise<AIResponse> {
    const fallbacks = this.fallback.getFallbacks(
      failedRoute.model,
      this.models.findByCapabilities(request.requiredCapabilities),
    );

    for (const model of fallbacks) {
      const provider = this.providers.get(model.providerId);

      if (provider === undefined) {
        continue;
      }

      if (request.privacyMode === 'maximum-privacy' && !provider.metadata.local) {
        continue;
      }

      const availability = await provider.availability();

      if (availability !== 'available' && availability !== 'degraded') {
        continue;
      }

      try {
        return await this.execute(request, {
          estimatedCostUsd: 0,
          model,
          provider,
          reason: 'fallback',
          score: 0,
        });
      } catch (error) {
        if (error instanceof AIError && error.aiCode === 'AI_BUDGET_EXCEEDED') {
          throw error;
        }
      }
    }

    this.history.recordFailure(request);
    throw originalError;
  }
}

/** Optional dependency overrides for tests and host runtimes. */
export interface AIRuntimeDependencies {
  /** Provider registry override. */
  readonly providers?: AIProviderRegistry;
  /** Model registry override. */
  readonly models?: AIModelRegistry;
  /** Prompt manager override. */
  readonly prompts?: AIPromptManager;
  /** Token manager override. */
  readonly tokens?: AITokenManager;
  /** Cost manager override. */
  readonly costs?: AICostManager;
  /** Cache manager override. */
  readonly cache?: AICacheManager;
  /** Fallback manager override. */
  readonly fallback?: AIFallbackManager;
  /** History manager override. */
  readonly history?: AIHistoryManager;
  /** Security manager override. */
  readonly security?: AISecurityManager;
  /** Error manager override. */
  readonly errors?: AIErrorManager;
  /** Model router override. */
  readonly router?: AIModelRouter;
  /** Request pipeline override. */
  readonly requestPipeline?: AIRequestPipeline;
  /** Response pipeline override. */
  readonly responsePipeline?: AIResponsePipeline;
  /** Streaming manager override. */
  readonly streaming?: AIStreamingManager;
  /** Optional route governance hook. */
  readonly routeGuard?: AIRouteGuard;
}

/** Optional hook for enterprise governance over selected routes. */
export type AIRouteGuard = (request: AIRequest, route: AIModelRouteDecision) => void;
