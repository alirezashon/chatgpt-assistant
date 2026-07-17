import type { DIContainer, ServiceRegistration } from '@/runtime/di';
import type { EventBus, EventMap } from '@/runtime/events';
import type { RuntimeModule } from '@/runtime/modules';
import type { ServiceRegistry, ServiceRegistryEntry } from '@/runtime/services';

/** Kernel semantic version. */
export interface KernelVersion {
  /** Major version. */
  readonly major: number;
  /** Minor version. */
  readonly minor: number;
  /** Patch version. */
  readonly patch: number;
}

/** Kernel metadata. */
export interface KernelMetadata {
  /** Stable kernel id. */
  readonly id: string;
  /** Human-readable kernel name. */
  readonly name: string;
  /** Kernel version. */
  readonly version: KernelVersion;
}

/** Kernel lifecycle state. */
export type KernelState =
  'booted' | 'booting' | 'created' | 'failed' | 'shutdown' | 'shutting-down';

/** Kernel lifecycle event map. */
export interface KernelEventMap extends EventMap {
  /** Kernel boot started. */
  readonly 'kernel.boot.started': { readonly kernelId: string };
  /** Kernel boot completed. */
  readonly 'kernel.boot.completed': { readonly kernelId: string };
  /** Kernel shutdown started. */
  readonly 'kernel.shutdown.started': { readonly kernelId: string };
  /** Kernel shutdown completed. */
  readonly 'kernel.shutdown.completed': { readonly kernelId: string };
  /** Kernel state changed. */
  readonly 'kernel.state.changed': { readonly next: KernelState; readonly previous: KernelState };
}

/** Hook names exposed by the kernel lifecycle. */
export type KernelHookName = 'afterBoot' | 'beforeBoot' | 'beforeShutdown';

/** Kernel hook callback. */
export type KernelHook = (kernel: Kernel) => Promise<void> | void;

/** Kernel runtime capabilities. */
export interface KernelCapabilities {
  /** Capability ids provided by core services and modules. */
  readonly ids: readonly string[];
}

/** Kernel health snapshot. */
export interface KernelHealth {
  /** Kernel state. */
  readonly state: KernelState;
  /** Service health by id. */
  readonly services: Readonly<Record<string, unknown>>;
  /** Module health by id. */
  readonly modules: Readonly<Record<string, unknown>>;
}

/** Kernel diagnostics snapshot. */
export interface KernelDiagnostics {
  /** Kernel metadata. */
  readonly metadata: KernelMetadata;
  /** Current state. */
  readonly state: KernelState;
  /** Event bus metrics. */
  readonly events: unknown;
  /** Dependency graph. */
  readonly dependencies: readonly unknown[];
}

/** Kernel construction context. */
export interface KernelContext {
  /** DI container. */
  readonly container: DIContainer;
  /** Event bus. */
  readonly events: EventBus<KernelEventMap>;
  /** Service registry. */
  readonly services: ServiceRegistry;
}

/** Public kernel contract. */
export interface Kernel {
  /** Kernel metadata. */
  readonly metadata: KernelMetadata;
  /** Current kernel state. */
  readonly state: KernelState;
  /** Kernel context. */
  readonly context: KernelContext;
  /** Boots all registered services and modules. */
  boot(): Promise<void>;
  /** Shuts down modules and services. */
  shutdown(): Promise<void>;
  /** Returns health snapshot. */
  health(): Promise<KernelHealth>;
  /** Returns diagnostics snapshot. */
  diagnostics(): KernelDiagnostics;
}

/** Builder registration input. */
export interface KernelBuilderRegistration {
  /** Service registrations. */
  readonly services: readonly ServiceRegistryEntry<unknown>[];
  /** Module registrations. */
  readonly modules: readonly RuntimeModule[];
  /** Raw DI registrations. */
  readonly rawServices: readonly ServiceRegistration<unknown>[];
}
