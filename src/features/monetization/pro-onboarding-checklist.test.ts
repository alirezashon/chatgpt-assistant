import { describe, expect, it } from 'vitest';

import { DEFAULT_AI_SETTINGS } from '@/features/ai';
import { createProOnboardingChecklist } from '@/features/monetization/pro-onboarding-checklist';

describe('Pro onboarding checklist', () => {
  it('tracks the setup steps needed before Pro is useful', () => {
    const checklist = createProOnboardingChecklist({
      accountConnected: true,
      aiSettings: {
        ...DEFAULT_AI_SETTINGS,
        externalProcessingConsentAt: '2026-07-10T00:00:00.000Z',
        providerId: 'openai-api',
        userOwnedKeysEnabled: true,
      },
      backupReady: false,
    });

    expect(checklist.ready).toBe(false);
    expect(checklist.completedCount).toBe(3);
    expect(checklist.steps.at(-1)).toMatchObject({
      id: 'backup-setup',
      status: 'pending',
    });
  });
});
