import { describe, expect, it } from 'vitest';

import { DEFAULT_AI_SETTINGS } from '@/features/ai/ai-config';
import {
  createAIDisabledSettings,
  createAIEnablementSettings,
  normalizeAISettings,
} from '@/features/ai/ai-settings';

describe('AI settings', () => {
  it('keeps AI disabled until explicit external processing consent exists', () => {
    expect(
      normalizeAISettings({
        enabled: true,
        providerId: 'openai-api',
      }).enabled,
    ).toBe(false);
  });

  it('enables external AI only through consented settings', () => {
    const enabled = createAIEnablementSettings(
      {
        ...DEFAULT_AI_SETTINGS,
        providerId: 'openai-api',
      },
      '2026-07-10T00:00:00.000Z',
    );

    expect(enabled).toMatchObject({
      enabled: true,
      externalProcessingConsentAt: '2026-07-10T00:00:00.000Z',
      localOnly: false,
    });
  });

  it('clears provider state when AI is disabled', () => {
    expect(
      createAIDisabledSettings({
        ...DEFAULT_AI_SETTINGS,
        enabled: true,
        externalProcessingConsentAt: '2026-07-10T00:00:00.000Z',
        providerId: 'openai-api',
        userOwnedKeysEnabled: true,
      }),
    ).toMatchObject({
      enabled: false,
      externalProcessingConsentAt: null,
      localOnly: true,
      providerId: null,
      userOwnedKeysEnabled: false,
    });
  });
});
