import { RuntimeError } from '@/runtime/utils';

import type { AIProviderAdapter, AIProviderId } from './ai-types';

/** Dynamic registry of AI provider adapters. */
export class AIProviderRegistry {
  private readonly providers = new Map<AIProviderId, AIProviderAdapter>();

  /** Registers a provider adapter. */
  public register(provider: AIProviderAdapter): void {
    if (this.providers.has(provider.metadata.id)) {
      throw new RuntimeError(
        'REGISTRATION_CONFLICT',
        `AI provider already registered: ${provider.metadata.id}`,
      );
    }

    this.providers.set(provider.metadata.id, provider);
  }

  /** Returns a provider by id. */
  public get(id: AIProviderId): AIProviderAdapter | undefined {
    return this.providers.get(id);
  }

  /** Returns all registered providers. */
  public all(): readonly AIProviderAdapter[] {
    return [...this.providers.values()];
  }
}
