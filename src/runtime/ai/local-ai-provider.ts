import type {
  AIModelMetadata,
  AIProviderAdapter,
  AIProviderAvailability,
  AIProviderMetadata,
  AIProviderRequest,
  AIProviderResponse,
  AIStreamChunk,
} from './ai-types';

/** Deterministic local provider adapter for offline/private model integration. */
export class LocalAIProviderAdapter implements AIProviderAdapter {
  public readonly metadata: AIProviderMetadata = {
    authentication: 'none',
    capabilities: ['local', 'text-generation', 'embeddings', 'json-output'],
    id: 'local',
    local: true,
    name: 'Local AI Runtime',
  };

  private readonly modelList: readonly AIModelMetadata[];

  public constructor(models: readonly AIModelMetadata[] = [defaultLocalModel]) {
    this.modelList = models;
  }

  public availability(): AIProviderAvailability {
    return 'available';
  }

  public models(): readonly AIModelMetadata[] {
    return this.modelList;
  }

  public complete(request: AIProviderRequest): Promise<AIProviderResponse> {
    const lastUser = [...request.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    const text = `Local response: ${lastUser.slice(0, 120)}`;

    return Promise.resolve({
      inputTokens: request.messages.reduce((sum, message) => sum + Math.ceil(message.content.length / 4), 0),
      modelId: request.model.id,
      outputTokens: Math.ceil(text.length / 4),
      providerId: this.metadata.id,
      text,
    });
  }

  public async *stream(request: AIProviderRequest): AsyncIterable<AIStreamChunk> {
    const response = await this.complete(request);
    yield { done: false, text: response.text };
    yield { done: true, text: '' };
  }

  public embed(input: string): Promise<readonly number[]> {
    const vector = new Array<number>(32).fill(0);

    for (const token of input.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean)) {
      const index = hash(token) % vector.length;
      vector[index] = (vector[index] ?? 0) + 1;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return Promise.resolve(vector.map((value) => value / magnitude));
  }

  public dispose(): void {
    return undefined;
  }
}

const defaultLocalModel: AIModelMetadata = {
  availabilityScore: 1,
  capabilities: ['local', 'text-generation', 'embeddings', 'json-output'],
  contextWindowTokens: 4_096,
  dataResidency: 'local-device',
  enterpriseApproved: true,
  id: 'local-small',
  latencyMs: 150,
  maxOutputTokens: 512,
  name: 'Local Small',
  pricing: {
    currency: 'USD',
    inputPerMillion: 0,
    outputPerMillion: 0,
  },
  providerId: 'local',
  quality: 0.55,
  securityLevel: 1,
};

function hash(value: string): number {
  let result = 2_166_136_261;

  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16_777_619);
  }

  return result >>> 0;
}
