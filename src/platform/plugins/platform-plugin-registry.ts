import type { PlatformPlugin } from '@/platform/plugins/platform-plugin-types';

export class PlatformPluginRegistry {
  private readonly capabilities = new Set<string>();
  private readonly plugins = new Map<string, PlatformPlugin>();

  public install(plugin: PlatformPlugin): void {
    plugin.install({
      registerCapability: (capabilityId) => {
        this.capabilities.add(capabilityId);
      },
    });
    this.plugins.set(plugin.id, plugin);
  }

  public listCapabilities(): readonly string[] {
    return [...this.capabilities.values()];
  }

  public listPlugins(): readonly PlatformPlugin[] {
    return [...this.plugins.values()];
  }
}
