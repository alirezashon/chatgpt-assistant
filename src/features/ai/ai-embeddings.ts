import type { AIEmbeddingVector } from '@/features/ai/ai-types';

export interface AIEmbeddingRequest {
  readonly content: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface AIEmbeddingProvider {
  readonly dimensions: number;
  readonly id: string;
  embed(request: AIEmbeddingRequest, signal: AbortSignal): Promise<AIEmbeddingVector>;
}

export class AIEmbeddings {
  private provider: AIEmbeddingProvider | null = null;

  public registerProvider(provider: AIEmbeddingProvider): void {
    this.provider = provider;
  }

  public hasProvider(): boolean {
    return this.provider !== null;
  }

  public async embed(request: AIEmbeddingRequest, signal: AbortSignal): Promise<AIEmbeddingVector> {
    if (this.provider === null) {
      throw new Error('No embedding provider registered.');
    }

    return await this.provider.embed(request, signal);
  }
}
