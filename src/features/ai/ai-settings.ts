import { DEFAULT_AI_SETTINGS } from '@/features/ai/ai-config';
import type { AISettings } from '@/features/ai/ai-types';

export function normalizeAISettings(settings: Partial<AISettings>): AISettings {
  return {
    ...DEFAULT_AI_SETTINGS,
    ...settings,
    maxConcurrentJobs: Math.max(
      1,
      settings.maxConcurrentJobs ?? DEFAULT_AI_SETTINGS.maxConcurrentJobs,
    ),
  };
}
