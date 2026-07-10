import { describe, expect, it } from 'vitest';

import { createMultiProviderComparisonTrack } from '@/features/monetization/multi-provider-comparison-track';

describe('multi-provider comparison track', () => {
  it('keeps provider comparison later until the GPT-first flow is stable', () => {
    expect(createMultiProviderComparisonTrack(false).phases).toEqual([
      {
        label: 'GPT-first workspace',
        providerIds: ['openai-api'],
        status: 'current',
      },
      {
        label: 'Comparison router',
        providerIds: ['anthropic-api', 'gemini', 'openrouter'],
        status: 'later',
      },
      {
        label: 'Local/private models',
        providerIds: ['local-llm'],
        status: 'later',
      },
    ]);
  });
});
