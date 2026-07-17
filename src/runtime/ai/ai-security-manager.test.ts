import { describe, expect, it } from 'vitest';

import { AIError } from './ai-errors';
import { AISecurityManager } from './ai-security-manager';
import { TestAIProvider } from './testing';
import type { AIModelMetadata, AIRequest } from './ai-types';

const model: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  id: 'remote-model',
  latencyMs: 100,
  maxOutputTokens: 1_000,
  name: 'Remote Model',
  pricing: { currency: 'USD', inputPerMillion: 1, outputPerMillion: 1 },
  providerId: 'remote-provider',
  quality: 0.9,
};

const request: AIRequest = {
  context: [
    {
      content: 'Restricted document',
      id: 'document',
      priority: 10,
      sensitivity: 'restricted',
    },
  ],
  id: 'security-request',
  intent: 'summarize',
  privacyMode: 'balanced',
  promptTemplateId: 'summary',
  requiredCapabilities: ['text-generation'],
  stream: false,
  taskType: 'summarization',
  variables: {},
};

describe('AISecurityManager', () => {
  it('blocks restricted context from remote providers', () => {
    const provider = new TestAIProvider({
      metadata: {
        authentication: 'api-key',
        capabilities: ['text-generation'],
        id: 'remote-provider',
        local: false,
        name: 'Remote Provider',
      },
      models: [model],
    });
    const security = new AISecurityManager();

    expect(() => {
      security.assertRequestAllowed(request, {
        estimatedCostUsd: 0,
        model,
        provider,
        reason: 'test',
        score: 1,
      });
    }).toThrow(AIError);
  });
});
