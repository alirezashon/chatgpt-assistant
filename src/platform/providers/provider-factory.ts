import type { ProviderAdapter, ProviderModule } from '@/platform/providers/provider-adapter';
import type { ProviderEvents } from '@/platform/providers/provider-events';
import type { ProviderRegistry } from '@/platform/providers/provider-registry';

export class ProviderFactory {
  private readonly events: ProviderEvents;
  private readonly registry: ProviderRegistry;

  public constructor(registry: ProviderRegistry, events: ProviderEvents) {
    this.events = events;
    this.registry = registry;
  }

  public install(module: ProviderModule): void {
    module.register({
      registerAdapter: (adapter) => this.registerAdapter(adapter),
    });
  }

  public registerAdapter(adapter: ProviderAdapter): void {
    this.registry.registerAdapter(adapter);
    this.events.emit('providerRegistered', {
      identity: adapter.identity,
    });
  }
}
