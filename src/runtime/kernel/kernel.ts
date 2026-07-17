import { DIContainer } from '@/runtime/di';
import { EventBus } from '@/runtime/events';
import { ModuleRuntime, type RuntimeModule } from '@/runtime/modules';
import { ServiceRegistry, type ServiceRegistryEntry } from '@/runtime/services';
import { DisposableStore, RuntimeError } from '@/runtime/utils';

import type {
  Kernel,
  KernelCapabilities,
  KernelContext,
  KernelDiagnostics,
  KernelEventMap,
  KernelHealth,
  KernelHook,
  KernelHookName,
  KernelMetadata,
  KernelState,
} from './kernel-types';

/** Production micro-kernel implementation. */
export class ExtensionKernel implements Kernel {
  private readonly disposables = new DisposableStore();
  private readonly moduleRuntime = new ModuleRuntime();
  private readonly hooks = new Map<KernelHookName, KernelHook[]>();
  private currentState: KernelState = 'created';

  public readonly context: KernelContext;

  public constructor(
    public readonly metadata: KernelMetadata,
    serviceEntries: readonly ServiceRegistryEntry<unknown>[],
    modules: readonly RuntimeModule[],
  ) {
    const container = new DIContainer();
    const events = new EventBus<KernelEventMap>();
    const services = new ServiceRegistry(container);

    this.context = { container, events, services };
    this.disposables.add(events);

    for (const entry of serviceEntries) {
      services.register(entry);
    }

    for (const module of modules) {
      this.moduleRuntime.register(module);
    }
  }

  /** Current kernel state. */
  public get state(): KernelState {
    return this.currentState;
  }

  /** Registers a lifecycle hook. */
  public hook(name: KernelHookName, hook: KernelHook): void {
    const hooks = this.hooks.get(name) ?? [];
    hooks.push(hook);
    this.hooks.set(name, hooks);
  }

  /** Boots services, validates dependencies, and initializes modules. */
  public async boot(): Promise<void> {
    this.assertState('created');
    await this.transition('booting');
    await this.context.events.emit('kernel.boot.started', { kernelId: this.metadata.id });

    try {
      await this.runHooks('beforeBoot');
      this.context.container.validate();
      await this.moduleRuntime.initializeAll({ services: this.context.container });
      await this.moduleRuntime.enableAll();
      await this.runHooks('afterBoot');
      await this.transition('booted');
      await this.context.events.emit('kernel.boot.completed', { kernelId: this.metadata.id });
    } catch (error) {
      await this.transition('failed');
      throw error;
    }
  }

  /** Shuts down all kernel-owned runtime resources. */
  public async shutdown(): Promise<void> {
    if (this.currentState === 'shutdown' || this.currentState === 'shutting-down') {
      return;
    }

    await this.transition('shutting-down');
    await this.context.events.emit('kernel.shutdown.started', { kernelId: this.metadata.id });
    await this.runHooks('beforeShutdown');
    await this.moduleRuntime.disableAll('kernel shutdown');
    await this.moduleRuntime.destroyAll();
    await this.transition('shutdown');
    await this.context.events.emit('kernel.shutdown.completed', { kernelId: this.metadata.id });
    await this.disposables.dispose();
    await this.context.container.dispose();
  }

  /** Returns kernel health across services and modules. */
  public async health(): Promise<KernelHealth> {
    return {
      modules: await this.moduleRuntime.checkHealth(),
      services: await this.context.services.checkHealth(),
      state: this.currentState,
    };
  }

  /** Returns a diagnostics snapshot without sensitive runtime payloads. */
  public diagnostics(): KernelDiagnostics {
    return {
      dependencies: this.context.container.getDependencyGraph(),
      events: this.context.events.getMetrics(),
      metadata: this.metadata,
      state: this.currentState,
    };
  }

  /** Returns core capability ids currently known to the registry. */
  public capabilities(): KernelCapabilities {
    return {
      ids: [],
    };
  }

  private async transition(next: KernelState): Promise<void> {
    const previous = this.currentState;
    this.currentState = next;
    await this.context.events.emit('kernel.state.changed', { next, previous });
  }

  private assertState(expected: KernelState): void {
    if (this.currentState !== expected) {
      throw new RuntimeError(
        'INVALID_STATE',
        `Expected kernel state ${expected}, got ${this.currentState}.`,
      );
    }
  }

  private async runHooks(name: KernelHookName): Promise<void> {
    for (const hook of this.hooks.get(name) ?? []) {
      await hook(this);
    }
  }
}
