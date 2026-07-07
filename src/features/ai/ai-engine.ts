import type { AIConfig } from '@/features/ai/ai-config';
import { FixedWindowChunkingStrategy } from '@/features/ai/ai-chunking';
import { AIEmbeddingCache } from '@/features/ai/ai-embedding-cache';
import { AIEmbeddings } from '@/features/ai/ai-embeddings';
import { AIRegistry } from '@/features/ai/ai-registry';
import { AIResponseCache } from '@/features/ai/ai-response-cache';
import { AISemanticIndex } from '@/features/ai/ai-semantic-index';
import type { AITaskRequest, AITaskResult, AISettings } from '@/features/ai/ai-types';
import { createAIId, createAITimestamp } from '@/features/ai/ai-utils';

export class AIEngine {
  public readonly cache: AIResponseCache;
  public readonly chunking: FixedWindowChunkingStrategy;
  public readonly embeddingCache: AIEmbeddingCache;
  public readonly embeddings: AIEmbeddings;
  public readonly registry: AIRegistry;
  public readonly semanticIndex: AISemanticIndex;

  private readonly config: AIConfig;

  public constructor(config: AIConfig) {
    this.cache = new AIResponseCache(config);
    this.chunking = new FixedWindowChunkingStrategy();
    this.config = config;
    this.embeddingCache = new AIEmbeddingCache(config);
    this.embeddings = new AIEmbeddings();
    this.registry = new AIRegistry();
    this.semanticIndex = new AISemanticIndex();
  }

  public async executeTask(
    request: AITaskRequest,
    settings: AISettings,
    signal: AbortSignal,
  ): Promise<AITaskResult> {
    if (!settings.enabled) {
      throw new Error('AI is disabled.');
    }

    const cacheKey = request.cacheKey;

    if (settings.cacheEnabled && cacheKey !== undefined) {
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult !== null) {
        return cachedResult;
      }
    }

    const provider = this.registry.getProvider(settings.providerId, request.type);

    if (provider === null) {
      throw new Error('No AI provider registered for this task.');
    }

    const response = await provider.executeTask(request, signal);
    const result: AITaskResult = {
      content: response.content,
      createdAt: createAITimestamp(),
      id: createAIId('ai-result'),
      metadata: {
        ...response.metadata,
        cacheVersion: this.config.cacheVersion,
        model: response.model ?? null,
        usage: response.usage ?? null,
      },
      providerId: response.providerId,
      taskId: request.id,
      type: request.type,
    };

    if (settings.cacheEnabled && cacheKey !== undefined) {
      this.cache.set(cacheKey, request.type, result);
    }

    return result;
  }
}
