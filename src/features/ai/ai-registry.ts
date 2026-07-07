import type { AIProvider, AITaskType } from '@/features/ai/ai-types';

export class AIRegistry {
  private readonly providers = new Map<string, AIProvider>();

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(providerId: string | null, taskType: AITaskType): AIProvider | null {
    if (providerId !== null) {
      const provider = this.providers.get(providerId);

      return provider?.capabilities.taskTypes.includes(taskType) === true ? provider : null;
    }

    return (
      [...this.providers.values()].find((provider) =>
        provider.capabilities.taskTypes.includes(taskType),
      ) ?? null
    );
  }

  public listProviders(): readonly AIProvider[] {
    return [...this.providers.values()];
  }
}
