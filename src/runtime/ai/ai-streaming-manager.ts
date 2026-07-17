import { AIError } from './ai-errors';
import type { AIProviderAdapter, AIProviderRequest, AIStreamChunk } from './ai-types';

/** Normalizes provider streaming and fallback-to-complete behavior. */
export class AIStreamingManager {
  /** Streams chunks from a provider. Providers without streaming emit one complete chunk. */
  public async *stream(
    provider: AIProviderAdapter,
    request: AIProviderRequest,
  ): AsyncIterable<AIStreamChunk> {
    request.cancellationToken?.throwIfCancellationRequested();

    if (provider.stream === undefined) {
      const response = await provider.complete({ ...request, stream: false });
      yield {
        done: false,
        text: response.text,
      };
      yield {
        done: true,
        text: '',
      };
      return;
    }

    try {
      for await (const chunk of provider.stream(request)) {
        request.cancellationToken?.throwIfCancellationRequested();
        yield chunk;

        if (chunk.done) {
          return;
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new AIError('AI_STREAM_INTERRUPTED', 'AI stream interrupted.');
    }
  }
}
