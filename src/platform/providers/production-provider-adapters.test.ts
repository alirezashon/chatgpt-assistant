import { describe, expect, it } from 'vitest';

import {
  createProductionProviderAdapters,
  registerProductionProviderAdapters,
} from '@/platform/providers/production-provider-adapters';
import { ProviderRegistry } from '@/platform/providers/provider-registry';

describe('production provider adapters', () => {
  it('registers production provider identities and fails closed until configured', async () => {
    const registry = new ProviderRegistry();

    registerProductionProviderAdapters(registry);

    expect(registry.listIdentities().map((identity) => identity.id)).toEqual([
      'openai-api',
      'anthropic-api',
      'gemini',
      'openrouter',
      'local-llm',
    ]);
    await expect(
      registry.getAdapter('openai-api').listConversations({
        permissions: [],
        workspaceId: 'workspace-1',
      }),
    ).rejects.toThrow('OpenAI API adapter is registered but not configured yet.');
  });

  it('declares capabilities for supported adapters', () => {
    const adapters = createProductionProviderAdapters();

    expect(adapters[0]?.capabilities.supportedCapabilities).toContain('streaming');
    expect(adapters[0]?.capabilities.authStrategies).toContain('api-key');
  });
});
