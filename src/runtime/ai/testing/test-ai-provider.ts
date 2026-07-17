import type {
  AIModelMetadata,
  AIProviderAdapter,
  AIProviderAvailability,
  AIProviderMetadata,
  AIProviderRequest,
  AIProviderResponse,
  AIStreamChunk,
} from '../ai-types';

/** Options for deterministic AI provider tests. */
export interface TestAIProviderOptions {
  /** Provider metadata. */
  readonly metadata: AIProviderMetadata;
  /** Provider models. */
  readonly models: readonly AIModelMetadata[];
  /** Provider availability. */
  readonly availability?: AIProviderAvailability;
  /** Text returned by complete calls. */
  readonly responseText?: string;
  /** Optional error thrown by complete calls. */
  readonly error?: Error;
  /** Optional stream chunks. */
  readonly streamChunks?: readonly AIStreamChunk[];
}

/** Deterministic provider adapter used by AI runtime tests. */
export class TestAIProvider implements AIProviderAdapter {
  public readonly metadata: AIProviderMetadata;
  private readonly modelList: readonly AIModelMetadata[];
  private readonly status: AIProviderAvailability;
  private readonly responseText: string;
  private readonly error: Error | undefined;
  private readonly chunks: readonly AIStreamChunk[] | undefined;

  public constructor(options: TestAIProviderOptions) {
    this.metadata = options.metadata;
    this.modelList = options.models;
    this.status = options.availability ?? 'available';
    this.responseText = options.responseText ?? 'test response';
    this.error = options.error;
    this.chunks = options.streamChunks;
  }

  /** Returns configured availability. */
  public availability(): AIProviderAvailability {
    return this.status;
  }

  /** Returns configured models. */
  public models(): readonly AIModelMetadata[] {
    return this.modelList;
  }

  /** Completes with deterministic usage metadata. */
  public complete(request: AIProviderRequest): Promise<AIProviderResponse> {
    if (this.error !== undefined) {
      return Promise.reject(this.error);
    }

    return Promise.resolve({
      inputTokens: request.messages.reduce(
        (sum, message) => sum + Math.ceil(message.content.length / 4),
        0,
      ),
      modelId: request.model.id,
      outputTokens: Math.ceil(this.responseText.length / 4),
      providerId: this.metadata.id,
      text: this.responseText,
    });
  }

  /** Streams configured chunks or a deterministic response. */
  public async *stream(): AsyncIterable<AIStreamChunk> {
    await Promise.resolve();

    const chunks = this.chunks ?? [
      {
        done: false,
        text: this.responseText,
      },
      {
        done: true,
        text: '',
      },
    ];

    for (const chunk of chunks) {
      yield chunk;
    }
  }

  /** Disposes test provider resources. */
  public dispose(): void {
    return undefined;
  }
}
