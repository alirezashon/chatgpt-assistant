import type { EventBus } from '@/runtime/events';
import { DisposableStore, type Disposable } from '@/runtime/utils';

import type { PluginContributionStore } from './plugin-contribution-store';
import type { PluginPermissionManager } from './plugin-permission-manager';
import type { PluginStorageManager } from './plugin-storage-manager';
import type {
  PluginAIRequest,
  PluginAIResponse,
  PluginLoggingApi,
  PluginManifest,
  PluginRuntimeEvents,
  PluginSdk,
} from './plugin-types';
import { PLUGIN_SDK_VERSION, PluginRuntimeError } from './plugin-types';

/** Host AI gateway exposed to plugins through capability checks. */
export interface PluginAIRequestGateway {
  /** Requests AI on behalf of a plugin. */
  request(pluginId: string, input: PluginAIRequest): Promise<PluginAIResponse>;
}

/** Host notification sink exposed through the SDK. */
export interface PluginNotificationSink {
  /** Shows a plugin notification. */
  show(pluginId: string, message: string): Promise<void>;
}

/** Host telemetry sink exposed through the SDK. */
export interface PluginTelemetrySink {
  /** Records plugin telemetry. */
  record(pluginId: string, event: string, properties?: Readonly<Record<string, unknown>>): void;
}

/** Host plugin logger. */
export interface PluginHostLogger {
  /** Writes an info log. */
  info(pluginId: string, message: string, metadata?: Readonly<Record<string, unknown>>): void;
  /** Writes an error log. */
  error(pluginId: string, message: string, metadata?: Readonly<Record<string, unknown>>): void;
}

/** Sandbox dependencies used to construct SDK membranes. */
export interface PluginSandboxDependencies {
  /** Runtime event bus. */
  readonly events: EventBus<PluginRuntimeEvents>;
  /** Permission manager. */
  readonly permissions: PluginPermissionManager;
  /** Namespaced plugin storage. */
  readonly storage: PluginStorageManager;
  /** Contribution store. */
  readonly contributions: PluginContributionStore;
  /** Optional AI gateway. */
  readonly ai?: PluginAIRequestGateway;
  /** Optional notification sink. */
  readonly notifications?: PluginNotificationSink;
  /** Optional telemetry sink. */
  readonly telemetry?: PluginTelemetrySink;
  /** Optional host logger. */
  readonly logger?: PluginHostLogger;
}

/** Created sandbox handle for one plugin instance. */
export interface PluginSandboxHandle extends Disposable {
  /** Versioned SDK object passed to plugin code. */
  readonly sdk: PluginSdk;
}

/** Builds capability-scoped SDK objects for plugin modules. */
export class PluginSandbox {
  public constructor(private readonly dependencies: PluginSandboxDependencies) {}

  /** Creates an SDK membrane for one plugin manifest. */
  public create(manifest: PluginManifest): PluginSandboxHandle {
    const disposables = new DisposableStore();
    let eventSubscriptions = 0;

    const assertCapability = (
      capability: Parameters<PluginPermissionManager['assert']>[1],
    ): void => {
      this.dependencies.permissions.assert(manifest.id, capability);
    };

    const sdk: PluginSdk = {
      ai: {
        request: async (input) => {
          assertCapability('ai.request');

          if (this.dependencies.ai === undefined) {
            throw new PluginRuntimeError(
              'PLUGIN_STATE_ERROR',
              'Plugin AI gateway is not configured.',
            );
          }

          return this.dependencies.ai.request(manifest.id, input);
        },
      },
      commands: {
        register: (commandId, handler) => {
          assertCapability('command.register');
          const disposable = this.dependencies.contributions.registerCommand(
            manifest.id,
            commandId,
            handler,
          );
          disposables.add(disposable);
          return disposable;
        },
      },
      configuration: {
        get: async (key) => {
          assertCapability('config.read');
          return this.dependencies.storage.get(manifest.id, `config:${key}`);
        },
        set: async (key, value) => {
          assertCapability('config.write');
          await this.dependencies.storage.set(manifest.id, `config:${key}`, value);
        },
      },
      context: {
        register: (providerId, provider) => {
          assertCapability('context.read');
          const disposable = this.dependencies.contributions.registerContext(
            manifest.id,
            providerId,
            provider,
          );
          disposables.add(disposable);
          return disposable;
        },
      },
      events: {
        publish: async (name, payload) => {
          assertCapability('events.publish');
          await this.dependencies.events.emit('plugin.event', {
            name,
            payload,
            pluginId: manifest.id,
          });
        },
        subscribe: (name, listener) => {
          assertCapability('events.subscribe');
          eventSubscriptions += 1;

          if (eventSubscriptions > manifest.securityPolicy.resourceLimits.maxEventSubscriptions) {
            throw new PluginRuntimeError(
              'PLUGIN_STATE_ERROR',
              `Plugin exceeded event subscription limit: ${manifest.id}`,
            );
          }

          const subscription = this.dependencies.events.on('plugin.event', async (event) => {
            if (event.payload.name === name) {
              await listener(event.payload.payload);
            }
          });
          const disposable = {
            dispose: () => {
              eventSubscriptions -= 1;
              void subscription.dispose();
            },
          };
          disposables.add(disposable);
          return disposable;
        },
      },
      logging: this.createLogger(manifest),
      manifest,
      notifications: {
        show: async (message) => {
          assertCapability('notifications.show');

          if (this.dependencies.notifications === undefined) {
            return;
          }

          await this.dependencies.notifications.show(manifest.id, message);
        },
      },
      storage: {
        get: async (key) => {
          assertCapability('storage.read');
          return this.dependencies.storage.get(manifest.id, key);
        },
        remove: async (key) => {
          assertCapability('storage.write');
          await this.dependencies.storage.remove(manifest.id, key);
        },
        set: async (key, value) => {
          assertCapability('storage.write');
          await this.dependencies.storage.set(manifest.id, key, value);
        },
      },
      telemetry: {
        record: (event, properties) => {
          assertCapability('telemetry.write');
          this.dependencies.telemetry?.record(manifest.id, event, properties);
        },
      },
      ui: {
        registerSurface: (surfaceId, handler) => {
          assertCapability('ui.register');
          const disposable = this.dependencies.contributions.registerUISurface(
            manifest.id,
            surfaceId,
            handler,
          );
          disposables.add(disposable);
          return disposable;
        },
      },
      version: PLUGIN_SDK_VERSION,
    };

    return {
      sdk,
      dispose: () => disposables.dispose(),
    };
  }

  private createLogger(manifest: PluginManifest): PluginLoggingApi {
    return {
      error: (message, metadata) => {
        this.dependencies.logger?.error(manifest.id, message, metadata);
      },
      info: (message, metadata) => {
        this.dependencies.logger?.info(manifest.id, message, metadata);
      },
    };
  }
}
