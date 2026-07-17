import { describe, expect, it } from 'vitest';

import { AIStreamingManager } from './ai-streaming-manager';
import { TestAIProvider } from './testing';
import type { AIModelMetadata } from './ai-types';

const model: AIModelMetadata = {
  capabilities: ['text-generation', 'streaming'],
  contextWindowTokens: 8_000,
  id: 'stream-model',
  latencyMs: 100,
  maxOutputTokens: 1_000,
  name: 'Stream Model',
  pricing: { currency: 'USD', inputPerMillion: 1, outputPerMillion: 1 },
  providerId: 'stream-provider',
  quality: 0.8,
};

describe('AIStreamingManager', () => {
  it('normalizes provider stream chunks', async () => {
    const provider = new TestAIProvider({
      metadata: {
        authentication: 'none',
        capabilities: ['text-generation', 'streaming'],
        id: 'stream-provider',
        local: true,
        name: 'Stream Provider',
      },
      models: [model],
      streamChunks: [
        { done: false, text: 'a' },
        { done: false, text: 'b' },
        { done: true, text: '' },
      ],
    });
    const manager = new AIStreamingManager();
    const chunks = [];

    for await (const chunk of manager.stream(provider, {
      id: 'request',
      maxOutputTokens: 100,
      messages: [{ content: 'hello', role: 'user' }],
      model,
      stream: true,
    })) {
      chunks.push(chunk.text);
    }

    expect(chunks.join('')).toBe('ab');
  });
});
