import type { PluginRegistry } from './plugin-registry';
import type { PluginManifest } from './plugin-types';
import { PluginRuntimeError } from './plugin-types';
import { satisfiesMinimumVersion } from './plugin-version';

/** Validates plugin dependencies against installed plugin manifests. */
export class PluginDependencyManager {
  public constructor(private readonly registry: PluginRegistry) {}

  /** Throws when a dependency is missing or too old. */
  public validateDependencies(manifest: PluginManifest): void {
    for (const dependency of manifest.dependencies ?? []) {
      const installed = this.registry.getManifest(dependency.id);

      if (installed === undefined) {
        throw new PluginRuntimeError(
          'PLUGIN_DEPENDENCY_MISSING',
          `Plugin ${manifest.id} requires missing dependency ${dependency.id}`,
        );
      }

      if (!satisfiesMinimumVersion(installed.version, dependency.minimumVersion)) {
        throw new PluginRuntimeError(
          'PLUGIN_DEPENDENCY_MISSING',
          `Plugin ${manifest.id} requires ${dependency.id} ${dependency.minimumVersion}`,
        );
      }
    }
  }

  /** Returns activation order for installed plugins based on declared dependencies. */
  public resolveActivationOrder(manifests: readonly PluginManifest[]): readonly string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const ordered: string[] = [];
    const byId = new Map(manifests.map((manifest) => [manifest.id, manifest]));

    const visit = (manifest: PluginManifest): void => {
      if (visited.has(manifest.id)) {
        return;
      }

      if (visiting.has(manifest.id)) {
        throw new PluginRuntimeError(
          'PLUGIN_DEPENDENCY_MISSING',
          `Circular plugin dependency detected: ${manifest.id}`,
        );
      }

      visiting.add(manifest.id);

      for (const dependency of manifest.dependencies ?? []) {
        const dependencyManifest = byId.get(dependency.id);

        if (dependencyManifest !== undefined) {
          visit(dependencyManifest);
        }
      }

      visiting.delete(manifest.id);
      visited.add(manifest.id);
      ordered.push(manifest.id);
    };

    for (const manifest of manifests) {
      visit(manifest);
    }

    return ordered;
  }
}
