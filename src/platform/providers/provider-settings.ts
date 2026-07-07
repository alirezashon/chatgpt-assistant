export interface ProviderSettings {
  readonly activeProviderId: string | null;
  readonly enabledProviderIds: readonly string[];
  readonly requireExplicitProviderConsent: boolean;
}

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  activeProviderId: null,
  enabledProviderIds: [],
  requireExplicitProviderConsent: true,
};
