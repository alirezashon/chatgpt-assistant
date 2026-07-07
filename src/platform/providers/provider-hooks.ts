import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { getProviderEngine, type ProviderEngine } from '@/platform/providers/provider-engine';
import {
  providerPlatformStore,
  type ProviderPlatformState,
} from '@/platform/providers/provider-state';

export interface ProviderActions {
  readonly connect: (providerId: string, workspaceId: string) => Promise<void>;
  readonly disconnect: (providerId: string) => Promise<void>;
  readonly setActiveProvider: (providerId: string | null) => void;
}

export interface UseProvidersResult extends ProviderPlatformState {
  readonly actions: ProviderActions;
}

export function useProviderState(): ProviderPlatformState {
  return useSyncExternalStore(
    (listener) => providerPlatformStore.subscribe(listener),
    () => providerPlatformStore.getState(),
    () => providerPlatformStore.getState(),
  );
}

export function useProviderActions(engine: ProviderEngine = getProviderEngine()): ProviderActions {
  const connect = useCallback(
    async (providerId: string, workspaceId: string) => {
      await engine.connect(providerId, {
        permissions: [],
        workspaceId,
      });
    },
    [engine],
  );

  const disconnect = useCallback(
    async (providerId: string) => {
      await engine.disconnect(providerId);
    },
    [engine],
  );

  const setActiveProvider = useCallback((providerId: string | null) => {
    providerPlatformStore.setState({
      activeProviderId: providerId,
    });
  }, []);

  return useMemo(
    () => ({
      connect,
      disconnect,
      setActiveProvider,
    }),
    [connect, disconnect, setActiveProvider],
  );
}

export function useProviders(engine: ProviderEngine = getProviderEngine()): UseProvidersResult {
  const state = useProviderState();
  const actions = useProviderActions(engine);

  return {
    ...state,
    actions,
  };
}
