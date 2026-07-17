import { describe, expect, it } from 'vitest';

import { AIRuntime } from './ai-runtime';
import { TestAIProvider } from './testing';
import type { AIModelMetadata, AIRequest } from './ai-types';

const model: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  id: 'runtime-model',
  latencyMs: 100,
  maxOutputTokens: 1_000,
  name: 'Runtime Model',
  pricing: { currency: 'USD', inputPerMillion: 1, outputPerMillion: 2 },
  providerId: 'runtime-provider',
  quality: 0.8,
};

const request: AIRequest = {
  cacheTtlMs: 1_000,
  context: [
    {
      content: 'Context about invoices.',
      id: 'selection',
      priority: 10,
      sensitivity: 'public',
    },
  ],
  id: 'runtime-request',
  intent: 'summarize invoices',
  privacyMode: 'balanced',
  promptTemplateId: 'summary',
  requiredCapabilities: ['text-generation'],
  stream: false,
  taskType: 'summarization',
  variables: {
    input: 'Summarize this',
  },
};

describe('AIRuntime', () => {
  it('routes, completes, evaluates, and caches requests', async () => {
    const runtime = new AIRuntime();
    const provider = new TestAIProvider({
      metadata: {
        authentication: 'none',
        capabilities: ['text-generation'],
        id: 'runtime-provider',
        local: true,
        name: 'Runtime Provider',
      },
      models: [model],
      responseText: 'summarize invoices complete',
    });

    runtime.registerPrompt({
      id: 'summary',
      system: 'You summarize.',
      user: '{{input}}',
      version: 1,
    });
    await runtime.registerProvider(provider);

    const first = await runtime.complete(request);
    const second = await runtime.complete(request);

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(first.evaluationScore).toBeGreaterThan(0.65);
    expect(runtime.totalCostUsd()).toBeGreaterThan(0);
  });
});
