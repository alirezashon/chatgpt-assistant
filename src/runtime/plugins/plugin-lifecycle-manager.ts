import type { EventBus } from '@/runtime/events';
import { err, ok, type RuntimeResult } from '@/runtime/utils';

import type { PluginContributionStore } from './plugin-contribution-store';
import type { PluginDependencyManager } from './plugin-dependency-manager';
import type { PluginLoader } from './plugin-loader';
import type { PluginPermissionManager } from './plugin-permission-manager';
import type { PluginRegistry } from './plugin-registry';
import type { PluginSandbox, PluginSandboxHandle } from './plugin-sandbox';
import type { PluginStorageManager } from './plugin-storage-manager';
import type { PluginValidator } from './plugin-validator';
import type {
  PluginCapability,
  PluginModule,
  PluginOperationResult,
  PluginPackage,
  PluginRuntimeEvents,
  PluginState,
} from './plugin-types';
import { PluginRuntimeError } from './plugin-types';

interface PluginInstance {
  readonly module: PluginModule;
  readonly sandbox: PluginSandboxHandle;
}

/** Coordinates plugin install, registration, activation, update, and teardown. */
export class PluginLifecycleManager {
  private readonly instances = new Map<string, PluginInstance>();

  public constructor(
    private readonly registry: PluginRegistry,
    private readonly loader: PluginLoader,
    private readonly validator: PluginValidator,
    private readonly dependencies: PluginDependencyManager,
    private readonly permissions: PluginPermissionManager,
    private readonly sandbox: PluginSandbox,
    private readonly storage: PluginStorageManager,
    private readonly contributions: PluginContributionStore,
    private readonly events: EventBus<PluginRuntimeEvents>,
  ) {}

  /** Returns loaded plugin modules for health checks. */
  public modules(): ReadonlyMap<string, PluginModule> {
    return new Map([...this.instances.entries()].map(([id, instance]) => [id, instance.module]));
  }

  /** Installs a plugin package after manifest and signature validation. */
  public async install(
    pluginPackage: PluginPackage,
    grantedCapabilities: readonly PluginCapability[] = pluginPackage.manifest.permissions,
  ): Promise<PluginOperationResult> {
    try {
      await this.validator.validatePackage(pluginPackage);
      this.registry.install(pluginPackage);
      this.permissions.grant(
        pluginPackage.manifest.id,
        pluginPackage.manifest.permissions,
        grantedCapabilities,
      );
      await this.emitLifecycle(pluginPackage.manifest.id, 'installed');
      return ok(undefined);
    } catch (error) {
      return err(toPluginError(error));
    }
  }

  /** Registers a plugin module and its declared lifecycle hooks. */
  public async register(pluginId: string): Promise<PluginOperationResult> {
    try {
      const pluginPackage = this.requirePackage(pluginId);
      this.dependencies.validateDependencies(pluginPackage.manifest);
      const module = await this.loader.load(pluginPackage);
      const sandbox = this.sandbox.create(pluginPackage.manifest);
      this.instances.set(pluginId, { module, sandbox });
      await this.invoke(pluginId, 'install', () => module.install?.(sandbox.sdk));
      await this.invoke(pluginId, 'validate', () => module.validate?.(sandbox.sdk));
      await this.invoke(pluginId, 'register', () => module.register?.(sandbox.sdk));
      this.registry.setState(pluginId, 'registered');
      await this.emitLifecycle(pluginId, 'registered');
      return ok(undefined);
    } catch (error) {
      return this.fail(pluginId, 'register', error);
    }
  }

  /** Initializes a registered plugin. */
  public async initialize(pluginId: string): Promise<PluginOperationResult> {
    try {
      if (!this.instances.has(pluginId)) {
        const result = await this.register(pluginId);

        if (!result.ok) {
          return result;
        }
      }

      const instance = this.requireInstance(pluginId);
      await this.invoke(pluginId, 'initialize', () =>
        instance.module.initialize?.(instance.sandbox.sdk),
      );
      this.registry.setState(pluginId, 'initialized');
      await this.emitLifecycle(pluginId, 'initialized');
      return ok(undefined);
    } catch (error) {
      return this.fail(pluginId, 'initialize', error);
    }
  }

  /** Activates a plugin and makes its runtime behavior available. */
  public async activate(pluginId: string): Promise<PluginOperationResult> {
    try {
      if (this.registry.getState(pluginId) !== 'initialized') {
        const result = await this.initialize(pluginId);

        if (!result.ok) {
          return result;
        }
      }

      const instance = this.requireInstance(pluginId);
      await this.invoke(pluginId, 'activate', () =>
        instance.module.activate?.(instance.sandbox.sdk),
      );
      this.registry.setState(pluginId, 'activated');
      await this.emitLifecycle(pluginId, 'activated');
      return ok(undefined);
    } catch (error) {
      return this.fail(pluginId, 'activate', error);
    }
  }

  /** Deactivates a plugin without deleting its package or storage. */
  public async deactivate(pluginId: string, reason = 'deactivate'): Promise<PluginOperationResult> {
    try {
      const instance = this.instances.get(pluginId);

      if (instance !== undefined) {
        await this.invoke(pluginId, 'deactivate', () => instance.module.deactivate?.(reason));
      }

      this.registry.setState(pluginId, 'initialized');
      await this.emitLifecycle(pluginId, 'initialized');
      return ok(undefined);
    } catch (error) {
      return this.fail(pluginId, 'deactivate', error);
    }
  }

  /** Updates an installed plugin package after validation. */
  public async update(
    pluginPackage: PluginPackage,
    grantedCapabilities: readonly PluginCapability[] = pluginPackage.manifest.permissions,
  ): Promise<PluginOperationResult> {
    const pluginId = pluginPackage.manifest.id;

    try {
      const current = this.requirePackage(pluginId);
      await this.deactivate(pluginId, 'update');
      await this.destroy(pluginId);
      await this.validator.validatePackage(pluginPackage);
      this.registry.update(pluginPackage);
      this.permissions.grant(pluginId, pluginPackage.manifest.permissions, grantedCapabilities);
      const registerResult = await this.register(pluginId);

      if (!registerResult.ok) {
        return registerResult;
      }

      const instance = this.requireInstance(pluginId);
      await this.invoke(pluginId, 'update', () =>
        instance.module.update?.(current.manifest.version, instance.sandbox.sdk),
      );
      return ok(undefined);
    } catch (error) {
      return this.fail(pluginId, 'update', error);
    }
  }

  /** Uninstalls a plugin and clears its storage and contributions. */
  public async uninstall(pluginId: string): Promise<PluginOperationResult> {
    try {
      const instance = this.instances.get(pluginId);

      if (instance !== undefined) {
        await this.invoke(pluginId, 'uninstall', () => instance.module.uninstall?.());
      }

      await this.destroy(pluginId);
      this.storage.clearPlugin(pluginId);
      this.contributions.removePlugin(pluginId);
      this.permissions.revokeAll(pluginId);
      this.registry.remove(pluginId);
      await this.emitLifecycle(pluginId, 'uninstalled');
      return ok(undefined);
    } catch (error) {
      return this.fail(pluginId, 'uninstall', error);
    }
  }

  /** Destroys a plugin instance and releases sandbox resources. */
  public async destroy(pluginId: string): Promise<PluginOperationResult> {
    try {
      const instance = this.instances.get(pluginId);

      if (instance === undefined) {
        return ok(undefined);
      }

      await instance.module.dispose();
      await instance.sandbox.dispose();
      this.instances.delete(pluginId);
      this.registry.setState(pluginId, 'destroyed');
      await this.emitLifecycle(pluginId, 'destroyed');
      return ok(undefined);
    } catch (error) {
      return this.fail(pluginId, 'destroy', error);
    }
  }

  private async invoke(
    pluginId: string,
    operation: string,
    callback: () => Promise<void> | void,
  ): Promise<void> {
    const manifest = this.requirePackage(pluginId).manifest;
    const timeoutMs = manifest.securityPolicy.resourceLimits.activationTimeoutMs;
    await withTimeout(Promise.resolve(callback()), timeoutMs, pluginId, operation);
  }

  private requirePackage(pluginId: string): PluginPackage {
    const pluginPackage = this.registry.getPackage(pluginId);

    if (pluginPackage === undefined) {
      throw new PluginRuntimeError('PLUGIN_NOT_FOUND', `Plugin not installed: ${pluginId}`);
    }

    return pluginPackage;
  }

  private requireInstance(pluginId: string): PluginInstance {
    const instance = this.instances.get(pluginId);

    if (instance === undefined) {
      throw new PluginRuntimeError('PLUGIN_STATE_ERROR', `Plugin not loaded: ${pluginId}`);
    }

    return instance;
  }

  private async emitLifecycle(pluginId: string, state: PluginState): Promise<void> {
    await this.events.emit('plugin.lifecycle', { pluginId, state });
  }

  private fail(
    pluginId: string,
    operation: string,
    error: unknown,
  ): RuntimeResult<never, PluginRuntimeError> {
    const pluginError = toPluginError(error);
    this.registry.markFailed(pluginId, pluginError.message);
    void this.events.emit('plugin.failed', {
      message: pluginError.message,
      operation,
      pluginId,
    });
    return err(pluginError);
  }
}

function toPluginError(error: unknown): PluginRuntimeError {
  if (error instanceof PluginRuntimeError) {
    return error;
  }

  if (error instanceof Error) {
    return new PluginRuntimeError('PLUGIN_STATE_ERROR', error.message, {
      name: error.name,
    });
  }

  return new PluginRuntimeError('PLUGIN_STATE_ERROR', 'Plugin operation failed.');
}

async function withTimeout(
  operation: Promise<void>,
  timeoutMs: number,
  pluginId: string,
  hook: string,
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(
            new PluginRuntimeError('PLUGIN_TIMEOUT', `Plugin ${pluginId} timed out during ${hook}`),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}
