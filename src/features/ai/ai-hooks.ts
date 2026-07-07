import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { getAIService, type AIService, type AISubmitTaskInput } from '@/features/ai/ai-service';
import { aiStore } from '@/features/ai/ai-store';
import type { AISettings, AIState } from '@/features/ai/ai-types';
import type { EntityId } from '@/shared/types';

export interface AIActions {
  readonly cancelJob: (jobId: EntityId) => boolean;
  readonly clearCache: () => Promise<void>;
  readonly submitTask: (input: AISubmitTaskInput) => Promise<void>;
  readonly updateSettings: (settings: Partial<AISettings>) => Promise<void>;
}

export interface UseAIResult extends AIState {
  readonly actions: AIActions;
}

export function useAIState(): AIState {
  return useSyncExternalStore(
    (listener) => aiStore.subscribe(listener),
    () => aiStore.getState(),
    () => aiStore.getState(),
  );
}

export function useAIActions(service: AIService = getAIService()): AIActions {
  const cancelJob = useCallback(
    (jobId: EntityId) => {
      return service.cancelJob(jobId);
    },
    [service],
  );

  const clearCache = useCallback(async () => {
    await service.clearCache();
  }, [service]);

  const submitTask = useCallback(
    async (input: AISubmitTaskInput) => {
      await service.submitTask(input);
    },
    [service],
  );

  const updateSettings = useCallback(
    async (settings: Partial<AISettings>) => {
      await service.updateSettings(settings);
    },
    [service],
  );

  return useMemo(
    () => ({
      cancelJob,
      clearCache,
      submitTask,
      updateSettings,
    }),
    [cancelJob, clearCache, submitTask, updateSettings],
  );
}

export function useAI(service: AIService = getAIService()): UseAIResult {
  const state = useAIState();
  const actions = useAIActions(service);

  useEffect(() => {
    void service.initialize();
  }, [service]);

  return {
    ...state,
    actions,
  };
}
