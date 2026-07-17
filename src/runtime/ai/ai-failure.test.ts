import { describe, expect, it } from 'vitest';

import { AIRuntime } from './ai-runtime';
import { TestAIProvider } from './testing';
import type { AIModelMetadata, AIRequest } from './ai-types';

const failedModel: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  id: 'failed-model',
  latencyMs: 100,
  maxOutputTokens: 1_000,
  name: 'Failed Model',
  pricing: { currency: 'USD', inputPerMillion: 1, outputPerMillion: 1 },
  providerId: 'failed-provider',
  quality: 0.9,
};

const fallbackModel: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  id: 'fallback-model',
  latencyMs: 200,
  maxOutputTokens: 1_000,
  name: 'Fallback Model',
  pricing: { currency: 'USD', inputPerMillion: 1, outputPerMillion: 1 },
  providerId: 'fallback-provider',
  quality: 0.8,
};

const request: AIRequest = {
  cacheTtlMs: 0,
  context: [],
  id: 'fallback-request',
  intent: 'rewrite',
  privacyMode: 'balanced',
  promptTemplateId: 'rewrite',
  requiredCapabilities: ['text-generation'],
  stream: false,
  taskType: 'rewrite',
  variables: {
    input: 'Hello',
  },
};

describe('AI failure handling', () => {
  it('falls back when the selected provider fails', async () => {
    const runtime = new AIRuntime();

    runtime.registerPrompt({
      id: 'rewrite',
      system: 'Rewrite.',
      user: '{{input}}',
      version: 1,
    });
    await runtime.registerProvider(
      new TestAIProvider({
        error: new Error('provider failed'),
        metadata: {
          authentication: 'none',
          capabilities: ['text-generation'],
          id: 'failed-provider',
          local: true,
          name: 'Failed Provider',
        },
        models: [failedModel],
      }),
    );
    await runtime.registerProvider(
      new TestAIProvider({
        metadata: {
          authentication: 'none',
          capabilities: ['text-generation'],
          id: 'fallback-provider',
          local: true,
          name: 'Fallback Provider',
        },
        models: [fallbackModel],
        responseText: 'fallback response',
      }),
    );

    await expect(runtime.complete(request)).resolves.toMatchObject({
      modelId: 'fallback-model',
      text: 'fallback response',
    });
  });
});
