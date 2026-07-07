import type { ProviderConfig } from '@/platform/providers/provider-config';
import { createProviderId, createProviderTimestamp } from '@/platform/providers/provider-utils';

export interface ProviderTelemetryEvent {
  readonly createdAt: string;
  readonly id: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
  readonly name: string;
  readonly providerId?: string;
}

export class ProviderTelemetry {
  private readonly config: ProviderConfig;
  private events: readonly ProviderTelemetryEvent[] = [];

  public constructor(config: ProviderConfig) {
    this.config = config;
  }

  public record(event: Omit<ProviderTelemetryEvent, 'createdAt' | 'id'>): void {
    this.events = [
      {
        ...event,
        createdAt: createProviderTimestamp(),
        id: createProviderId('provider-telemetry'),
      },
      ...this.events,
    ].slice(0, this.config.telemetryLimit);
  }

  public getEvents(): readonly ProviderTelemetryEvent[] {
    return this.events;
  }
}
