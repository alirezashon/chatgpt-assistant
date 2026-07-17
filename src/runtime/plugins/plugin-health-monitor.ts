import type { PluginRegistry } from './plugin-registry';
import type { PluginHealth, PluginModule } from './plugin-types';

/** Reads plugin health without allowing plugin errors to escape. */
export class PluginHealthMonitor {
  /** Checks health for loaded plugin modules. */
  public async check(
    registry: PluginRegistry,
    modules: ReadonlyMap<string, PluginModule>,
  ): Promise<Readonly<Record<string, PluginHealth>>> {
    const results: Record<string, PluginHealth> = {};

    for (const entry of registry.list()) {
      const module = modules.get(entry.manifest.id);

      if (entry.state === 'failed') {
        results[entry.manifest.id] = {
          message: entry.failureMessage ?? 'Plugin failed.',
          status: 'unhealthy',
        };
        continue;
      }

      if (module?.health === undefined) {
        results[entry.manifest.id] = { status: 'unknown' };
        continue;
      }

      try {
        results[entry.manifest.id] = await module.health();
      } catch (error) {
        results[entry.manifest.id] = {
          message: error instanceof Error ? error.message : 'Plugin health check failed.',
          status: 'unhealthy',
        };
      }
    }

    return results;
  }
}
