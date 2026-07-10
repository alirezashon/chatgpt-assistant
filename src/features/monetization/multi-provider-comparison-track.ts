import { createProductionProviderAdapters } from '@/platform/providers';

export interface MultiProviderComparisonTrack {
  readonly currentFocus: string;
  readonly phases: readonly MultiProviderComparisonPhase[];
}

export interface MultiProviderComparisonPhase {
  readonly label: string;
  readonly providerIds: readonly string[];
  readonly status: 'current' | 'later' | 'next';
}

export function createMultiProviderComparisonTrack(
  gptFlowStable: boolean,
): MultiProviderComparisonTrack {
  const availableProviderIds = createProductionProviderAdapters().map(
    (adapter) => adapter.identity.id,
  );

  return {
    currentFocus: 'Finish GPT-first summaries, exports, provider setup, and upgrade prompts.',
    phases: [
      {
        label: 'GPT-first workspace',
        providerIds: availableProviderIds.filter((providerId) => providerId === 'openai-api'),
        status: 'current',
      },
      {
        label: 'Comparison router',
        providerIds: availableProviderIds.filter((providerId) =>
          ['anthropic-api', 'gemini', 'openrouter'].includes(providerId),
        ),
        status: gptFlowStable ? 'next' : 'later',
      },
      {
        label: 'Local/private models',
        providerIds: availableProviderIds.filter((providerId) => providerId === 'local-llm'),
        status: 'later',
      },
    ],
  };
}
