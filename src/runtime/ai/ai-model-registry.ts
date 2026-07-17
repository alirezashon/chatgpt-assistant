import type { AIModelCapability, AIModelId, AIModelMetadata, AIProviderId } from './ai-types';

/** Registry of provider model metadata. */
export class AIModelRegistry {
  private readonly models = new Map<AIModelId, AIModelMetadata>();

  /** Registers or replaces model metadata. */
  public register(model: AIModelMetadata): void {
    this.models.set(model.id, model);
  }

  /** Registers many models. */
  public registerMany(models: readonly AIModelMetadata[]): void {
    for (const model of models) {
      this.register(model);
    }
  }

  /** Returns model by id. */
  public get(id: AIModelId): AIModelMetadata | undefined {
    return this.models.get(id);
  }

  /** Returns models for provider. */
  public forProvider(providerId: AIProviderId): readonly AIModelMetadata[] {
    return [...this.models.values()].filter((model) => model.providerId === providerId);
  }

  /** Finds models supporting every required capability. */
  public findByCapabilities(
    capabilities: readonly AIModelCapability[],
  ): readonly AIModelMetadata[] {
    return [...this.models.values()].filter((model) =>
      capabilities.every((capability) => model.capabilities.includes(capability)),
    );
  }
}
