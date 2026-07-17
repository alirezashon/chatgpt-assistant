import type { EventBus } from '@/runtime/events';

import type { PluginCapability, PluginRuntimeEvents } from './plugin-types';
import { PluginRuntimeError } from './plugin-types';

/** Manages explicitly granted plugin capabilities. */
export class PluginPermissionManager {
  private readonly grants = new Map<string, Set<PluginCapability>>();

  public constructor(private readonly events?: EventBus<PluginRuntimeEvents>) {}

  /** Grants a subset of capabilities requested by a plugin. */
  public grant(
    pluginId: string,
    requested: readonly PluginCapability[],
    granted: readonly PluginCapability[],
  ): void {
    for (const capability of granted) {
      if (!requested.includes(capability)) {
        throw new PluginRuntimeError(
          'PLUGIN_CAPABILITY_DENIED',
          `Cannot grant undeclared capability ${capability} to ${pluginId}`,
        );
      }
    }

    this.grants.set(pluginId, new Set(granted));
  }

  /** Revokes all capabilities for a plugin. */
  public revokeAll(pluginId: string): void {
    this.grants.delete(pluginId);
  }

  /** Returns granted capabilities. */
  public list(pluginId: string): readonly PluginCapability[] {
    return [...(this.grants.get(pluginId) ?? new Set())];
  }

  /** Throws when a plugin lacks a capability. */
  public assert(pluginId: string, capability: PluginCapability): void {
    if (!this.grants.get(pluginId)?.has(capability)) {
      void this.events?.emit('plugin.audit', {
        action: 'capability.denied',
        capability,
        pluginId,
        timestamp: Date.now(),
      });

      throw new PluginRuntimeError(
        'PLUGIN_CAPABILITY_DENIED',
        `Plugin ${pluginId} lacks capability ${capability}`,
        { capability, pluginId },
      );
    }

    void this.events?.emit('plugin.audit', {
      action: 'capability.used',
      capability,
      pluginId,
      timestamp: Date.now(),
    });
  }
}
