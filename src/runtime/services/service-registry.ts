import type { DIContainer, ServiceRegistration, ServiceToken } from '@/runtime/di';
import { RuntimeError } from '@/runtime/utils';

/** Runtime health status for registered services. */
export type ServiceHealthStatus = 'degraded' | 'healthy' | 'unhealthy' | 'unknown';

/** Service metadata consumed by diagnostics and capability lookup. */
export interface ServiceMetadata {
  /** Stable service id. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Semver-compatible service contract version. */
  readonly version: string;
  /** Capabilities provided by this service. */
  readonly capabilities: readonly string[];
}

/** Health check result for service monitoring. */
export interface ServiceHealth {
  /** Health status. */
  readonly status: ServiceHealthStatus;
  /** Optional diagnostic message. */
  readonly message?: string;
}

/** Service health check function. */
export type ServiceHealthCheck = () => Promise<ServiceHealth> | ServiceHealth;

/** Full service registry entry. */
export interface ServiceRegistryEntry<Service> {
  /** Service metadata. */
  readonly metadata: ServiceMetadata;
  /** DI registration. */
  readonly registration: ServiceRegistration<Service>;
  /** Optional health check. */
  readonly healthCheck?: ServiceHealthCheck;
}

/** Registry for versioned, capability-bearing services. */
export class ServiceRegistry {
  private readonly entries = new Map<string, ServiceRegistryEntry<unknown>>();
  private readonly capabilityIndex = new Map<string, Set<string>>();

  public constructor(private readonly container: DIContainer) {}

  /** Registers a service in both metadata registry and DI container. */
  public register<Service>(entry: ServiceRegistryEntry<Service>): void {
    if (this.entries.has(entry.metadata.id)) {
      throw new RuntimeError(
        'REGISTRATION_CONFLICT',
        `Service already registered: ${entry.metadata.id}`,
      );
    }

    this.entries.set(entry.metadata.id, entry);
    this.container.register(entry.registration);

    for (const capability of entry.metadata.capabilities) {
      const serviceIds = this.capabilityIndex.get(capability) ?? new Set<string>();
      serviceIds.add(entry.metadata.id);
      this.capabilityIndex.set(capability, serviceIds);
    }
  }

  /** Resolves a service by token through the DI container. */
  public async resolve<Service>(token: ServiceToken<Service>): Promise<Service> {
    return this.container.resolve(token);
  }

  /** Returns service metadata by id. */
  public getMetadata(id: string): ServiceMetadata | undefined {
    return this.entries.get(id)?.metadata;
  }

  /** Returns metadata for services providing a capability. */
  public findByCapability(capability: string): readonly ServiceMetadata[] {
    const ids = this.capabilityIndex.get(capability);

    if (ids === undefined) {
      return [];
    }

    return [...ids]
      .map((id) => this.getMetadata(id))
      .filter((metadata): metadata is ServiceMetadata => metadata !== undefined);
  }

  /** Runs all service health checks. */
  public async checkHealth(): Promise<Readonly<Record<string, ServiceHealth>>> {
    const results: Record<string, ServiceHealth> = {};

    for (const [id, entry] of this.entries) {
      if (entry.healthCheck === undefined) {
        results[id] = { status: 'unknown' };
        continue;
      }

      results[id] = await entry.healthCheck();
    }

    return results;
  }
}
