export interface ProviderConfig {
  readonly cacheTtlMs: number;
  readonly eventHistoryLimit: number;
  readonly maxCachedEntries: number;
  readonly telemetryLimit: number;
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  cacheTtlMs: 1000 * 60 * 30,
  eventHistoryLimit: 200,
  maxCachedEntries: 500,
  telemetryLimit: 250,
};
