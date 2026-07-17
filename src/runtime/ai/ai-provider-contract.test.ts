import { describe, expect, it } from 'vitest';

import { TestAIProvider } from './testing';
import type { AIModelMetadata, AIProviderMetadata } from './ai-types';

const providerMetadata: AIProviderMetadata = {
  authentication: 'none',
  capabilities: ['text-generation'],
  id: 'test',
  local: true,
  name: 'Test Provider',
};

const model: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  id: 'test-small',
  latencyMs: 100,
  maxOutputTokens: 1_000,
  name: 'Test Small',
  pricing: {
    currency: 'USD',
    inputPerMillion: 1,
    outputPerMillion: 2,
  },
  providerId: 'test',
  quality: 0.7,
};

describe('AIProviderAdapter contract', () => {
  it('advertises metadata, models, and deterministic completions', async () => {
    const provider = new TestAIProvider({
      metadata: providerMetadata,
      models: [model],
      responseText: 'hello world',
    });

    expect(provider.availability()).toBe('available');
    expect(provider.models()).toEqual([model]);
    await expect(
      provider.complete({
        id: 'request',
        maxOutputTokens: 100,
        messages: [{ content: 'hello', role: 'user' }],
        model,
        stream: false,
      }),
    ).resolves.toMatchObject({
      modelId: model.id,
      providerId: providerMetadata.id,
      text: 'hello world',
    });
  });
});
