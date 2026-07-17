import { describe, expect, it } from 'vitest';

import { AICostManager } from './ai-cost-manager';
import type { AIModelMetadata } from './ai-types';

const model: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  id: 'priced-model',
  latencyMs: 100,
  maxOutputTokens: 1_000,
  name: 'Priced Model',
  pricing: { currency: 'USD', inputPerMillion: 2, outputPerMillion: 4 },
  providerId: 'priced-provider',
  quality: 0.8,
};

describe('AICostManager', () => {
  it('estimates and records token-based provider cost', () => {
    const manager = new AICostManager();
    const estimate = manager.estimate(model, 500_000, 250_000);

    expect(estimate.costUsd).toBe(2);
    manager.record(estimate.costUsd);
    expect(manager.total()).toBe(2);
  });
});
