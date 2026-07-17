import { RuntimeError } from '@/runtime/utils';

import type {
  RuntimeModule,
  RuntimeModuleContext,
  RuntimeModuleHealth,
  RuntimeModuleState,
} from './module-types';

/** Manages registration and lifecycle of runtime modules. */
export class ModuleRuntime {
  private readonly modules = new Map<string, RuntimeModule>();
  private readonly states = new Map<string, RuntimeModuleState>();

  /** Registers a module without side effects beyond validation. */
  public register(module: RuntimeModule): void {
    if (this.modules.has(module.metadata.id)) {
      throw new RuntimeError(
        'REGISTRATION_CONFLICT',
        `Module already registered: ${module.metadata.id}`,
      );
    }

    this.modules.set(module.metadata.id, module);
    this.states.set(module.metadata.id, 'registered');
  }

  /** Initializes all registered modules in registration order. */
  public async initializeAll(context: RuntimeModuleContext): Promise<void> {
    for (const id of this.modules.keys()) {
      await this.initialize(id, context);
    }
  }

  /** Enables all initialized modules in registration order. */
  public async enableAll(): Promise<void> {
    for (const id of this.modules.keys()) {
      await this.enable(id);
    }
  }

  /** Disables all modules in reverse registration order. */
  public async disableAll(reason?: string): Promise<void> {
    for (const id of [...this.modules.keys()].reverse()) {
      await this.disable(id, reason);
    }
  }

  /** Destroys all modules in reverse registration order. */
  public async destroyAll(): Promise<void> {
    for (const id of [...this.modules.keys()].reverse()) {
      await this.destroy(id);
    }
  }

  /** Initializes a registered module and validates declared dependencies. */
  public async initialize(id: string, context: RuntimeModuleContext): Promise<void> {
    const module = this.requireModule(id);
    this.validateDependencies(module);
    await module.initialize?.(context);
    this.states.set(id, 'initialized');
  }

  /** Enables an initialized or disabled module. */
  public async enable(id: string): Promise<void> {
    const module = this.requireModule(id);
    await module.enable?.();
    this.states.set(id, 'enabled');
  }

  /** Disables an enabled module. */
  public async disable(id: string, reason?: string): Promise<void> {
    const module = this.requireModule(id);
    await module.disable?.(reason);
    this.states.set(id, 'disabled');
  }

  /** Reloads a module by disabling and enabling it. */
  public async reload(id: string): Promise<void> {
    await this.disable(id, 'reload');
    await this.enable(id);
  }

  /** Destroys a module and removes it from the runtime. */
  public async destroy(id: string): Promise<void> {
    const module = this.requireModule(id);
    await module.dispose();
    this.modules.delete(id);
    this.states.set(id, 'destroyed');
  }

  /** Returns module lifecycle state. */
  public getState(id: string): RuntimeModuleState | undefined {
    return this.states.get(id);
  }

  /** Returns health for every registered module. */
  public async checkHealth(): Promise<Readonly<Record<string, RuntimeModuleHealth>>> {
    const results: Record<string, RuntimeModuleHealth> = {};

    for (const [id, module] of this.modules) {
      results[id] = module.health === undefined ? { status: 'unknown' } : await module.health();
    }

    return results;
  }

  private requireModule(id: string): RuntimeModule {
    const module = this.modules.get(id);

    if (module === undefined) {
      throw new RuntimeError('NOT_FOUND', `Module not registered: ${id}`);
    }

    return module;
  }

  private validateDependencies(module: RuntimeModule): void {
    for (const dependency of module.metadata.dependencies ?? []) {
      if (!this.modules.has(dependency)) {
        throw new RuntimeError(
          'NOT_FOUND',
          `Module ${module.metadata.id} depends on missing module ${dependency}`,
        );
      }
    }
  }
}
