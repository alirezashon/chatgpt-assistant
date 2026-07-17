import { describe, expect, it } from 'vitest';

import { AICacheManager } from './ai-cache-manager';
import type { AIResponse } from './ai-types';

const response: AIResponse = {
  cached: false,
  costUsd: 0.001,
  evaluationScore: 0.9,
  inputTokens: 10,
  modelId: 'model',
  outputTokens: 4,
  providerId: 'provider',
  text: 'cached response',
};

describe('AICacheManager', () => {
  it('returns non-expired cached values without raw payload keys', () => {
    const cache = new AICacheManager();
    const key = cache.key(['raw secret text']);

    expect(key).not.toContain('secret');
    cache.set(key, response, 1_000, 10);

    expect(cache.get(key, 100)).toMatchObject({
      cached: true,
      text: response.text,
    });
    expect(cache.get(key, 2_000)).toBeUndefined();
  });
});
