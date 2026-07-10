import { describe, expect, it } from 'vitest';

import { AIProviderKeyVault } from '@/features/ai/ai-provider-key-management';

describe('AI provider key vault', () => {
  it('stores only session metadata for display', () => {
    const vault = new AIProviderKeyVault();
    const metadata = vault.setKey('openai', 'sk-test-1234567890', new Date('2026-07-10T00:00:00Z'));

    expect(metadata).toMatchObject({
      createdAt: '2026-07-10T00:00:00.000Z',
      lastFour: '7890',
      providerKind: 'openai',
    });
    expect(vault.listMetadata()[0]).not.toHaveProperty('value');
    expect(vault.getKey('openai')).toBe('sk-test-1234567890');
  });
});
