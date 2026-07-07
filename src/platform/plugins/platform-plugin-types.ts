export type PlatformPluginKind =
  'action' | 'ai-provider' | 'automation' | 'exporter' | 'search-provider' | 'theme';

export interface PlatformPlugin {
  readonly id: string;
  readonly kind: PlatformPluginKind;
  readonly name: string;
  readonly version: string;
  install(context: PlatformPluginContext): void;
}

export interface PlatformPluginContext {
  readonly registerCapability: (capabilityId: string) => void;
}
