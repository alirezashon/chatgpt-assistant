import type { AISettings } from '@/features/ai';

export type ProOnboardingStepId = 'account' | 'backup-setup' | 'privacy-consent' | 'provider-key';

export interface ProOnboardingStep {
  readonly description: string;
  readonly id: ProOnboardingStepId;
  readonly label: string;
  readonly status: 'complete' | 'pending';
}

export interface ProOnboardingChecklist {
  readonly completedCount: number;
  readonly ready: boolean;
  readonly steps: readonly ProOnboardingStep[];
  readonly totalCount: number;
}

export interface ProOnboardingInput {
  readonly accountConnected: boolean;
  readonly aiSettings: AISettings;
  readonly backupReady: boolean;
}

export function createProOnboardingChecklist(input: ProOnboardingInput): ProOnboardingChecklist {
  const steps: readonly ProOnboardingStep[] = [
    createStep({
      complete: input.accountConnected,
      description: 'Sign in only when Pro features, billing, or cloud backup are needed.',
      id: 'account',
      label: 'Connect account',
    }),
    createStep({
      complete: input.aiSettings.providerId !== null && input.aiSettings.userOwnedKeysEnabled,
      description: 'Add a user-owned GPT provider key before paid AI automation is enabled.',
      id: 'provider-key',
      label: 'Add provider key',
    }),
    createStep({
      complete: input.aiSettings.externalProcessingConsentAt !== null,
      description: 'Accept privacy consent before any external AI processing.',
      id: 'privacy-consent',
      label: 'Accept AI privacy consent',
    }),
    createStep({
      complete: input.backupReady,
      description: 'Keep enough local workspace data to create a useful backup or restore point.',
      id: 'backup-setup',
      label: 'Prepare backup setup',
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
  readonly id: ProOnboardingStepId;
  readonly label: string;
}): ProOnboardingStep {
  return {
    description: input.description,
    id: input.id,
    label: input.label,
    status: input.complete ? 'complete' : 'pending',
  };
}
