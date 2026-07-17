import type { PluginDependencyManager } from './plugin-dependency-manager';
import type { PluginManifest } from './plugin-types';

/** Resolves plugin load and activation order. */
export class PluginResolver {
  public constructor(private readonly dependencies: PluginDependencyManager) {}

  /** Returns plugin ids ordered so dependencies activate before dependents. */
  public activationOrder(manifests: readonly PluginManifest[]): readonly string[] {
    return this.dependencies.resolveActivationOrder(manifests);
  }
}
