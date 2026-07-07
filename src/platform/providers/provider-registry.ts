import type { ProviderAdapter } from '@/platform/providers/provider-adapter';
import { ProviderError } from '@/platform/providers/provider-errors';
import type { ProviderCapabilities, ProviderIdentity } from '@/platform/providers/provider-types';

export class ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();

  public registerAdapter(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.identity.id, adapter);
  }

  public getAdapter(providerId: string): ProviderAdapter {
    const adapter = this.adapters.get(providerId);

    if (adapter === undefined) {
      throw new ProviderError('PROVIDER_NOT_FOUND', `Provider not found: ${providerId}`);
    }

    return adapter;
  }

  public listAdapters(): readonly ProviderAdapter[] {
    return [...this.adapters.values()];
  }

  public listIdentities(): readonly ProviderIdentity[] {
    return this.listAdapters().map((adapter) => adapter.identity);
  }

  public getCapabilities(providerId: string): ProviderCapabilities {
    return this.getAdapter(providerId).capabilities;
  }
}
