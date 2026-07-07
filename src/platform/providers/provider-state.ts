import type { ProviderIdentity, ProviderSession } from '@/platform/providers/provider-types';
import {
  DEFAULT_PROVIDER_SETTINGS,
  type ProviderSettings,
} from '@/platform/providers/provider-settings';
import { createStore } from '@/state';

export interface ProviderPlatformState {
  readonly activeProviderId: string | null;
  readonly error: Error | null;
  readonly providers: readonly ProviderIdentity[];
  readonly sessions: readonly ProviderSession[];
  readonly settings: ProviderSettings;
  readonly status: 'idle' | 'ready' | 'syncing';
}

export const initialProviderPlatformState: ProviderPlatformState = {
  activeProviderId: null,
  error: null,
  providers: [],
  sessions: [],
  settings: DEFAULT_PROVIDER_SETTINGS,
  status: 'idle',
};

export const providerPlatformStore = createStore<ProviderPlatformState>(
  initialProviderPlatformState,
);
