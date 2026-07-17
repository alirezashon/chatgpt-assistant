import type { PluginSerializableValue } from './plugin-types';

/** Namespaced in-memory plugin storage boundary. */
export class PluginStorageManager {
  private readonly values = new Map<string, PluginSerializableValue>();

  /** Reads a plugin-namespaced value. */
  public get(pluginId: string, key: string): Promise<PluginSerializableValue> {
    return Promise.resolve(this.values.get(this.key(pluginId, key)) ?? null);
  }

  /** Writes a plugin-namespaced value. */
  public set(pluginId: string, key: string, value: PluginSerializableValue): Promise<void> {
    this.values.set(this.key(pluginId, key), value);
    return Promise.resolve();
  }

  /** Removes a plugin-namespaced value. */
  public remove(pluginId: string, key: string): Promise<void> {
    this.values.delete(this.key(pluginId, key));
    return Promise.resolve();
  }

  /** Removes every value for a plugin. */
  public clearPlugin(pluginId: string): void {
    const prefix = `${pluginId}:`;

    for (const key of this.values.keys()) {
      if (key.startsWith(prefix)) {
        this.values.delete(key);
      }
    }
  }

  private key(pluginId: string, key: string): string {
    return `${pluginId}:${key}`;
  }
}
