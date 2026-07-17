import { createDisposable, type Disposable } from '@/runtime/utils';

import type {
  PluginCommandHandler,
  PluginContextProvider,
  PluginUISurfaceHandler,
} from './plugin-types';

/** Runtime command handler registered by a plugin. */
export interface PluginRegisteredCommand {
  /** Plugin id. */
  readonly pluginId: string;
  /** Command id. */
  readonly commandId: string;
  /** Handler. */
  readonly handler: PluginCommandHandler;
}

/** Runtime context provider registered by a plugin. */
export interface PluginRegisteredContextProvider {
  /** Plugin id. */
  readonly pluginId: string;
  /** Provider id. */
  readonly providerId: string;
  /** Provider. */
  readonly provider: PluginContextProvider;
}

/** Runtime UI surface handler registered by a plugin. */
export interface PluginRegisteredUISurface {
  /** Plugin id. */
  readonly pluginId: string;
  /** Surface id. */
  readonly surfaceId: string;
  /** Handler. */
  readonly handler: PluginUISurfaceHandler;
}

/** Stores runtime plugin contributions behind SDK APIs. */
export class PluginContributionStore {
  private readonly commands = new Map<string, PluginRegisteredCommand>();
  private readonly contexts = new Map<string, PluginRegisteredContextProvider>();
  private readonly uiSurfaces = new Map<string, PluginRegisteredUISurface>();

  /** Registers a command contribution. */
  public registerCommand(
    pluginId: string,
    commandId: string,
    handler: PluginCommandHandler,
  ): Disposable {
    const key = this.key(pluginId, commandId);
    this.commands.set(key, { commandId, handler, pluginId });
    return createDisposable(() => {
      this.commands.delete(key);
    });
  }

  /** Registers a context provider contribution. */
  public registerContext(
    pluginId: string,
    providerId: string,
    provider: PluginContextProvider,
  ): Disposable {
    const key = this.key(pluginId, providerId);
    this.contexts.set(key, { pluginId, provider, providerId });
    return createDisposable(() => {
      this.contexts.delete(key);
    });
  }

  /** Registers a UI surface contribution. */
  public registerUISurface(
    pluginId: string,
    surfaceId: string,
    handler: PluginUISurfaceHandler,
  ): Disposable {
    const key = this.key(pluginId, surfaceId);
    this.uiSurfaces.set(key, { handler, pluginId, surfaceId });
    return createDisposable(() => {
      this.uiSurfaces.delete(key);
    });
  }

  /** Returns plugin command registrations. */
  public listCommands(): readonly PluginRegisteredCommand[] {
    return [...this.commands.values()];
  }

  /** Returns plugin context provider registrations. */
  public listContextProviders(): readonly PluginRegisteredContextProvider[] {
    return [...this.contexts.values()];
  }

  /** Returns plugin UI surface registrations. */
  public listUISurfaces(): readonly PluginRegisteredUISurface[] {
    return [...this.uiSurfaces.values()];
  }

  /** Removes all contributions for a plugin. */
  public removePlugin(pluginId: string): void {
    for (const map of [this.commands, this.contexts, this.uiSurfaces]) {
      for (const key of map.keys()) {
        if (key.startsWith(`${pluginId}:`)) {
          map.delete(key);
        }
      }
    }
  }

  private key(pluginId: string, id: string): string {
    return `${pluginId}:${id}`;
  }
}
