import { describe, expect, it } from 'vitest';

import { DEFAULT_AI_SETTINGS } from '@/features/ai/ai-config';
import { createGPTFirstProviderSetupChecklist } from '@/features/ai/gpt-provider-setup-checklist';

describe('GPT-first provider setup checklist', () => {
  it('starts pending for the local account-free default', () => {
    const checklist = createGPTFirstProviderSetupChecklist({
      accountConnected: false,
      settings: DEFAULT_AI_SETTINGS,
    });

    expect(checklist.ready).toBe(false);
    expect(checklist.completedCount).toBe(2);
    expect(checklist.steps.map((step) => [step.id, step.status])).toEqual([
      ['account-connected', 'pending'],
      ['openai-provider-selected', 'pending'],
      ['provider-key-ready', 'pending'],
      ['privacy-consent-accepted', 'pending'],
      ['background-jobs-enabled', 'complete'],
      ['cache-enabled', 'complete'],
    ]);
  });

  it('is ready when OpenAI setup requirements are met', () => {
    const checklist = createGPTFirstProviderSetupChecklist({
      accountConnected: true,
      settings: {
        ...DEFAULT_AI_SETTINGS,
        enabled: true,
        externalProcessingConsentAt: '2026-07-10T00:00:00.000Z',
        localOnly: false,
        providerId: 'openai-api',
        userOwnedKeysEnabled: true,
      },
    });

    expect(checklist).toMatchObject({
      completedCount: 6,
      ready: true,
      totalCount: 6,
    });
  });
});
