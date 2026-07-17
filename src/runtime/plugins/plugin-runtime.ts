import { EventBus } from '@/runtime/events';

import { PluginContributionStore } from './plugin-contribution-store';
import { PluginDependencyManager } from './plugin-dependency-manager';
import { PluginHealthMonitor } from './plugin-health-monitor';
import { PluginLifecycleManager } from './plugin-lifecycle-manager';
import { PluginLoader } from './plugin-loader';
import { PluginPermissionManager } from './plugin-permission-manager';
import { PluginRegistry, type PluginRegistryEntry } from './plugin-registry';
import { PluginResolver } from './plugin-resolver';
import {
  PluginSandbox,
  type PluginAIRequestGateway,
  type PluginHostLogger,
  type PluginNotificationSink,
  type PluginTelemetrySink,
} from './plugin-sandbox';
import { PluginStorageManager } from './plugin-storage-manager';
import type { PluginValidator } from './plugin-validator';
import { PluginValidator as DefaultPluginValidator } from './plugin-validator';
import type {
  PluginCapability,
  PluginHealth,
  PluginOperationResult,
  PluginPackage,
  PluginRuntimeEvents,
} from './plugin-types';

/** Runtime host dependencies for plugin infrastructure. */
export interface PluginRuntimeDependencies {
  /** Kernel version used for compatibility validation. */
  readonly kernelVersion: string;
  /** Optional runtime event bus. */
  readonly events?: EventBus<PluginRuntimeEvents>;
  /** Optional validator override. */
  readonly validator?: PluginValidator;
  /** Optional AI gateway. */
  readonly ai?: PluginAIRequestGateway;
  /** Optional notification sink. */
  readonly notifications?: PluginNotificationSink;
  /** Optional telemetry sink. */
  readonly telemetry?: PluginTelemetrySink;
  /** Optional logger. */
  readonly logger?: PluginHostLogger;
}

/** Public facade for installing, activating, and inspecting plugins. */
export class PluginRuntime {
  /** Runtime event bus. */
  public readonly events: EventBus<PluginRuntimeEvents>;
  /** Installed plugin registry. */
  public readonly registry: PluginRegistry;
  /** Runtime contribution store. */
  public readonly contributions: PluginContributionStore;
  /** Permission manager. */
  public readonly permissions: PluginPermissionManager;
  /** Storage manager. */
  public readonly storage: PluginStorageManager;
  /** Dependency resolver. */
  public readonly resolver: PluginResolver;

  private readonly lifecycle: PluginLifecycleManager;
  private readonly healthMonitor: PluginHealthMonitor;

  public constructor(dependencies: PluginRuntimeDependencies) {
    this.events = dependencies.events ?? new EventBus<PluginRuntimeEvents>();
    this.registry = new PluginRegistry();
    this.contributions = new PluginContributionStore();
    this.permissions = new PluginPermissionManager(this.events);
    this.storage = new PluginStorageManager();

    const dependencyManager = new PluginDependencyManager(this.registry);
    const sandbox = new PluginSandbox({
      ...(dependencies.ai === undefined ? {} : { ai: dependencies.ai }),
      contributions: this.contributions,
      events: this.events,
      ...(dependencies.logger === undefined ? {} : { logger: dependencies.logger }),
      ...(dependencies.notifications === undefined
        ? {}
        : { notifications: dependencies.notifications }),
      permissions: this.permissions,
      storage: this.storage,
      ...(dependencies.telemetry === undefined ? {} : { telemetry: dependencies.telemetry }),
    });
    const validator =
      dependencies.validator ?? new DefaultPluginValidator(dependencies.kernelVersion);

    this.resolver = new PluginResolver(dependencyManager);
    this.healthMonitor = new PluginHealthMonitor();
    this.lifecycle = new PluginLifecycleManager(
      this.registry,
      new PluginLoader(),
      validator,
      dependencyManager,
      this.permissions,
      sandbox,
      this.storage,
      this.contributions,
      this.events,
    );
  }

  /** Installs a plugin package with explicit granted capabilities. */
  public install(
    pluginPackage: PluginPackage,
    grantedCapabilities?: readonly PluginCapability[],
  ): Promise<PluginOperationResult> {
    return this.lifecycle.install(
      pluginPackage,
      grantedCapabilities ?? pluginPackage.manifest.permissions,
    );
  }

  /** Registers an installed plugin. */
  public register(pluginId: string): Promise<PluginOperationResult> {
    return this.lifecycle.register(pluginId);
  }

  /** Initializes an installed plugin. */
  public initialize(pluginId: string): Promise<PluginOperationResult> {
    return this.lifecycle.initialize(pluginId);
  }

  /** Activates an installed plugin. */
  public activate(pluginId: string): Promise<PluginOperationResult> {
    return this.lifecycle.activate(pluginId);
  }

  /** Deactivates an active plugin. */
  public deactivate(pluginId: string, reason?: string): Promise<PluginOperationResult> {
    return this.lifecycle.deactivate(pluginId, reason);
  }

  /** Updates an installed plugin package. */
  public update(
    pluginPackage: PluginPackage,
    grantedCapabilities?: readonly PluginCapability[],
  ): Promise<PluginOperationResult> {
    return this.lifecycle.update(
      pluginPackage,
      grantedCapabilities ?? pluginPackage.manifest.permissions,
    );
  }

  /** Uninstalls a plugin and clears runtime state. */
  public uninstall(pluginId: string): Promise<PluginOperationResult> {
    return this.lifecycle.uninstall(pluginId);
  }

  /** Returns safe registry entries. */
  public list(): readonly PluginRegistryEntry[] {
    return this.registry.list();
  }

  /** Checks health for all installed plugins. */
  public health(): Promise<Readonly<Record<string, PluginHealth>>> {
    return this.healthMonitor.check(this.registry, this.lifecycle.modules());
  }
}
