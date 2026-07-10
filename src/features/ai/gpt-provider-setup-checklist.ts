import type { AISettings } from '@/features/ai/ai-types';

export type GPTProviderSetupStepId =
  | 'account-connected'
  | 'background-jobs-enabled'
  | 'cache-enabled'
  | 'openai-provider-selected'
  | 'privacy-consent-accepted'
  | 'provider-key-ready';

export type GPTProviderSetupStatus = 'complete' | 'pending';

export interface GPTProviderSetupStep {
  readonly description: string;
  readonly id: GPTProviderSetupStepId;
  readonly label: string;
  readonly status: GPTProviderSetupStatus;
}

export interface GPTProviderSetupChecklist {
  readonly completedCount: number;
  readonly ready: boolean;
  readonly steps: readonly GPTProviderSetupStep[];
  readonly totalCount: number;
}

export interface GPTProviderSetupInput {
  readonly accountConnected: boolean;
  readonly settings: AISettings;
}

export function createGPTFirstProviderSetupChecklist(
  input: GPTProviderSetupInput,
): GPTProviderSetupChecklist {
  const steps: readonly GPTProviderSetupStep[] = [
    createStep({
      complete: input.accountConnected,
      description: 'Connect an account only when paid GPT-powered features are needed.',
      id: 'account-connected',
      label: 'Account connected',
    }),
    createStep({
      complete:
        input.settings.providerId === 'openai' || input.settings.providerId === 'openai-api',
      description: 'Keep the first paid AI path focused on GPT before adding other providers.',
      id: 'openai-provider-selected',
      label: 'GPT provider selected',
    }),
    createStep({
      complete: input.settings.userOwnedKeysEnabled && input.settings.providerId !== null,
      description: 'Use a user-owned provider key first so model cost is not bundled too early.',
      id: 'provider-key-ready',
      label: 'Provider key ready',
    }),
    createStep({
      complete: input.settings.externalProcessingConsentAt !== null,
      description: 'Require explicit consent before any conversation content leaves local storage.',
      id: 'privacy-consent-accepted',
      label: 'AI privacy consent accepted',
    }),
    createStep({
      complete: input.settings.jobRuntimeTarget === 'background-worker',
      description: 'Run longer GPT jobs outside the content-script lifecycle.',
      id: 'background-jobs-enabled',
      label: 'Background jobs enabled',
    }),
    createStep({
      complete: input.settings.cacheEnabled,
      description: 'Cache repeat GPT outputs locally to reduce repeated model calls.',
      id: 'cache-enabled',
      label: 'Local AI cache enabled',
    }),
  ];
  const completedCount = steps.filter((step) => step.status === 'complete').length;

  return {
    completedCount,
    ready: completedCount === steps.length,
    steps,
    totalCount: steps.length,
  };
}

function createStep(input: {
  readonly complete: boolean;
  readonly description: string;
  readonly id: GPTProviderSetupStepId;
  readonly label: string;
}): GPTProviderSetupStep {
  return {
    description: input.description,
    id: input.id,
    label: input.label,
    status: input.complete ? 'complete' : 'pending',
  };
}
