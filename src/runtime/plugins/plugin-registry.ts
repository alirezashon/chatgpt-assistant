import type { PluginManifest, PluginPackage, PluginState } from './plugin-types';
import { PluginRuntimeError } from './plugin-types';

/** Registry entry for an installed plugin package. */
export interface PluginRegistryEntry {
  /** Manifest. */
  readonly manifest: PluginManifest;
  /** Current lifecycle state. */
  readonly state: PluginState;
  /** Last failure message. */
  readonly failureMessage?: string;
}

interface MutablePluginRegistryEntry {
  readonly pluginPackage: PluginPackage;
  state: PluginState;
  failureMessage?: string;
}

/** Stores installed plugin package metadata and lifecycle state. */
export class PluginRegistry {
  private readonly entries = new Map<string, MutablePluginRegistryEntry>();

  /** Installs a package into the registry. */
  public install(pluginPackage: PluginPackage): void {
    const pluginId = pluginPackage.manifest.id;

    if (this.entries.has(pluginId)) {
      throw new PluginRuntimeError('PLUGIN_STATE_ERROR', `Plugin already installed: ${pluginId}`);
    }

    this.entries.set(pluginId, {
      pluginPackage,
      state: 'installed',
    });
  }

  /** Replaces an installed package after validation. */
  public update(pluginPackage: PluginPackage): void {
    const current = this.requireEntry(pluginPackage.manifest.id);

    this.entries.set(pluginPackage.manifest.id, {
      pluginPackage,
      state: current.state,
    });
  }

  /** Removes an installed package from the registry. */
  public remove(pluginId: string): void {
    this.entries.delete(pluginId);
  }

  /** Returns an installed package. */
  public getPackage(pluginId: string): PluginPackage | undefined {
    return this.entries.get(pluginId)?.pluginPackage;
  }

  /** Returns an installed manifest. */
  public getManifest(pluginId: string): PluginManifest | undefined {
    return this.entries.get(pluginId)?.pluginPackage.manifest;
  }

  /** Returns every installed manifest. */
  public manifests(): readonly PluginManifest[] {
    return [...this.entries.values()].map((entry) => entry.pluginPackage.manifest);
  }

  /** Returns a safe registry snapshot. */
  public list(): readonly PluginRegistryEntry[] {
    return [...this.entries.values()].map((entry) => ({
      ...(entry.failureMessage === undefined ? {} : { failureMessage: entry.failureMessage }),
      manifest: entry.pluginPackage.manifest,
      state: entry.state,
    }));
  }

  /** Returns lifecycle state. */
  public getState(pluginId: string): PluginState | undefined {
    return this.entries.get(pluginId)?.state;
  }

  /** Sets lifecycle state. */
  public setState(pluginId: string, state: PluginState): void {
    this.requireEntry(pluginId).state = state;
  }

  /** Marks a plugin failed without removing it. */
  public markFailed(pluginId: string, message: string): void {
    const entry = this.requireEntry(pluginId);
    entry.state = 'failed';
    entry.failureMessage = message;
  }

  private requireEntry(pluginId: string): MutablePluginRegistryEntry {
    const entry = this.entries.get(pluginId);

    if (entry === undefined) {
      throw new PluginRuntimeError('PLUGIN_NOT_FOUND', `Plugin not installed: ${pluginId}`);
    }

    return entry;
  }
}
