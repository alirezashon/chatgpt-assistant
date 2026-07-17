import { describe, expect, it } from 'vitest';

import { AIModelRegistry } from './ai-model-registry';
import { AIModelRouter } from './ai-model-router';
import { AIProviderRegistry } from './ai-provider-registry';
import { TestAIProvider } from './testing';
import type { AIModelMetadata, AIRequest } from './ai-types';

const cheapModel: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  id: 'cheap',
  latencyMs: 300,
  maxOutputTokens: 1_000,
  name: 'Cheap',
  pricing: { currency: 'USD', inputPerMillion: 0.1, outputPerMillion: 0.2 },
  providerId: 'local',
  quality: 0.6,
};

const qualityModel: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 16_000,
  id: 'quality',
  latencyMs: 600,
  maxOutputTokens: 2_000,
  name: 'Quality',
  pricing: { currency: 'USD', inputPerMillion: 3, outputPerMillion: 6 },
  providerId: 'cloud',
  quality: 0.95,
};

const request: AIRequest = {
  context: [],
  id: 'request',
  intent: 'summarize',
  privacyMode: 'balanced',
  promptTemplateId: 'test',
  requiredCapabilities: ['text-generation'],
  stream: false,
  taskType: 'summarization',
  variables: {},
};

describe('AIModelRouter', () => {
  it('selects local providers for maximum privacy', async () => {
    const providers = new AIProviderRegistry();
    const models = new AIModelRegistry();
    const localProvider = new TestAIProvider({
      metadata: {
        authentication: 'none',
        capabilities: ['text-generation'],
        id: 'local',
        local: true,
        name: 'Local',
      },
      models: [cheapModel],
    });
    const cloudProvider = new TestAIProvider({
      metadata: {
        authentication: 'api-key',
        capabilities: ['text-generation'],
        id: 'cloud',
        local: false,
        name: 'Cloud',
      },
      models: [qualityModel],
    });

    providers.register(localProvider);
    providers.register(cloudProvider);
    models.registerMany([cheapModel, qualityModel]);

    const router = new AIModelRouter(providers, models);
    const route = await router.route({
      estimatedInputTokens: 100,
      request: {
        ...request,
        privacyMode: 'maximum-privacy',
      },
    });

    expect(route.model.id).toBe('cheap');
  });
});
