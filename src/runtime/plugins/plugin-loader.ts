import type { PluginModule, PluginPackage } from './plugin-types';

/** Loads plugin modules from validated plugin packages. */
export class PluginLoader {
  /** Creates a plugin module through the package factory. */
  public async load(pluginPackage: PluginPackage): Promise<PluginModule> {
    return pluginPackage.moduleFactory();
  }
}
