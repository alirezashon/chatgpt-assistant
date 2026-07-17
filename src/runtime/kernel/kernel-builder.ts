import type { RuntimeModule } from '@/runtime/modules';
import type { ServiceRegistryEntry } from '@/runtime/services';

import { ExtensionKernel } from './kernel';
import type { KernelMetadata } from './kernel-types';

/** Builder for constructing a kernel without side effects until build. */
export class KernelBuilder {
  private readonly services: ServiceRegistryEntry<unknown>[] = [];
  private readonly modules: RuntimeModule[] = [];

  public constructor(private readonly metadata: KernelMetadata) {}

  /** Adds a service registry entry. */
  public addService(entry: ServiceRegistryEntry<unknown>): this {
    this.services.push(entry);
    return this;
  }

  /** Adds a runtime module. */
  public addModule(module: RuntimeModule): this {
    this.modules.push(module);
    return this;
  }

  /** Builds the kernel instance. */
  public build(): ExtensionKernel {
    return new ExtensionKernel(this.metadata, this.services, this.modules);
  }
}
