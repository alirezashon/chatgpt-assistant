import { DEFAULT_AI_SETTINGS } from '@/features/ai/ai-config';
import type { AISettings } from '@/features/ai/ai-types';

export function normalizeAISettings(settings: Partial<AISettings>): AISettings {
  const enabled = settings.enabled === true;
  const requireExplicitConsent =
    settings.requireExplicitConsent ?? DEFAULT_AI_SETTINGS.requireExplicitConsent;
  const externalProcessingConsentAt =
    typeof settings.externalProcessingConsentAt === 'string'
      ? settings.externalProcessingConsentAt
      : DEFAULT_AI_SETTINGS.externalProcessingConsentAt;

  return {
    ...DEFAULT_AI_SETTINGS,
    ...settings,
    enabled: enabled && (!requireExplicitConsent || externalProcessingConsentAt !== null),
    externalProcessingConsentAt,
    jobRuntimeTarget:
      settings.jobRuntimeTarget === 'content-script'
        ? 'content-script'
        : DEFAULT_AI_SETTINGS.jobRuntimeTarget,
    localOnly:
      settings.providerId === null ? true : (settings.localOnly ?? DEFAULT_AI_SETTINGS.localOnly),
    maxConcurrentJobs: Math.max(
      1,
      settings.maxConcurrentJobs ?? DEFAULT_AI_SETTINGS.maxConcurrentJobs,
    ),
    requireExplicitConsent,
    userOwnedKeysEnabled:
      settings.providerId === null
        ? false
        : (settings.userOwnedKeysEnabled ?? DEFAULT_AI_SETTINGS.userOwnedKeysEnabled),
  };
}

export function createAIEnablementSettings(
  settings: AISettings,
  consentAcceptedAt: string,
): AISettings {
  return normalizeAISettings({
    ...settings,
    enabled: true,
    externalProcessingConsentAt: consentAcceptedAt,
    localOnly: false,
  });
}

export function createAIDisabledSettings(settings: AISettings): AISettings {
  return normalizeAISettings({
    ...settings,
    enabled: false,
    externalProcessingConsentAt: null,
    localOnly: true,
    providerId: null,
    userOwnedKeysEnabled: false,
  });
}
