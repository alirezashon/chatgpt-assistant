import type { AIModelHealth, AIModelMetadata, AIProviderAdapter, AIProviderAvailability } from './ai-types';

/** Tracks model/provider health for routing and observability. */
export class AIModelHealthMonitor {
  private readonly health = new Map<string, AIModelHealth>();

  /** Checks and records health for a provider's models. */
  public async checkProvider(provider: AIProviderAdapter): Promise<readonly AIModelHealth[]> {
    const availability = await provider.availability();
    const models = await provider.models();
    const now = Date.now();
    const records = models.map((model) => this.record(model, provider.metadata.id, availability, model.latencyMs, availability === 'available'));
    return records.map((record) => ({ ...record, checkedAt: now }));
  }

  /** Records one model result. */
  public recordResult(model: AIModelMetadata, availability: AIProviderAvailability, latencyMs: number, success: boolean): AIModelHealth {
    return this.record(model, model.providerId, availability, latencyMs, success);
  }

  /** Reads one model health. */
  public get(modelId: string): AIModelHealth | undefined {
    return this.health.get(modelId);
  }

  /** Lists health records. */
  public list(): readonly AIModelHealth[] {
    return [...this.health.values()];
  }

  private record(
    model: AIModelMetadata,
    providerId: string,
    availability: AIProviderAvailability,
    latencyMs: number,
    success: boolean,
  ): AIModelHealth {
    const previous = this.health.get(model.id);
    const successRate = previous === undefined ? (success ? 1 : 0) : previous.successRate * 0.8 + (success ? 0.2 : 0);
    const next: AIModelHealth = {
      availability,
      checkedAt: Date.now(),
      latencyMs: previous === undefined ? latencyMs : Math.round(previous.latencyMs * 0.7 + latencyMs * 0.3),
      modelId: model.id,
      providerId,
      successRate,
    };
    this.health.set(model.id, next);
    return next;
  }
}
