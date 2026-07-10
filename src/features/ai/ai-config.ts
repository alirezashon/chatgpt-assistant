import type { AIJobPriority, AISettings } from '@/features/ai/ai-types';

export interface AIConfig {
  readonly cacheTtlMs: number;
  readonly cacheVersion: string;
  readonly defaultMaxRetries: number;
  readonly defaultPriority: AIJobPriority;
  readonly historyLimit: number;
  readonly maxCacheEntries: number;
  readonly maxConcurrentJobs: number;
  readonly runtimeTarget: 'background-worker' | 'content-script';
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  cacheTtlMs: 1000 * 60 * 60 * 24 * 7,
  cacheVersion: 'ai-cache-v1',
  defaultMaxRetries: 2,
  defaultPriority: 'normal',
  historyLimit: 100,
  maxCacheEntries: 250,
  maxConcurrentJobs: 1,
  runtimeTarget: 'background-worker',
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  cacheEnabled: true,
  enabled: false,
  externalProcessingConsentAt: null,
  jobRuntimeTarget: DEFAULT_AI_CONFIG.runtimeTarget,
  localOnly: true,
  maxConcurrentJobs: DEFAULT_AI_CONFIG.maxConcurrentJobs,
  providerId: null,
  requireExplicitConsent: true,
  userOwnedKeysEnabled: false,
};
