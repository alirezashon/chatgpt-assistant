import type { Disposable } from '@/runtime/utils';

/** Unique token used to register and resolve a dependency. */
export interface ServiceToken<Service> {
  /** Stable identifier used in diagnostics and dependency graphs. */
  readonly id: string;
  /** Optional description for debugging. */
  readonly description?: string;
  /** Phantom type marker. */
  readonly service?: Service;
}

/** Supported dependency lifetime models. */
export type ServiceLifetime = 'lazy' | 'scoped' | 'singleton' | 'transient';

/** Factory context passed to service constructors. */
export interface ServiceFactoryContext {
  /** Current dependency scope id. */
  readonly scopeId: string;
}

/** Factory that creates a service instance. */
export type ServiceFactory<Service> = (
  container: ServiceResolver,
  context: ServiceFactoryContext,
) => Service | Promise<Service>;

/** Public dependency resolver exposed to service factories. */
export interface ServiceResolver {
  /** Resolves a registered dependency. */
  resolve<Service>(token: ServiceToken<Service>): Promise<Service>;
}

/** Metadata used for validation, diagnostics, and future auto registration. */
export interface ServiceRegistration<Service> {
  /** Service token. */
  readonly token: ServiceToken<Service>;
  /** Service lifetime. */
  readonly lifetime: ServiceLifetime;
  /** Service factory. */
  readonly factory: ServiceFactory<Service>;
  /** Declared dependencies used for graph validation. */
  readonly dependencies?: readonly ServiceToken<unknown>[];
  /** Version string for compatibility checks. */
  readonly version?: string;
  /** Provided capability ids. */
  readonly capabilities?: readonly string[];
}

/** Dependency graph edge for diagnostics. */
export interface DependencyGraphEdge {
  /** Dependent service id. */
  readonly from: string;
  /** Required service id. */
  readonly to: string;
}

/** Resolved service with optional disposal contract. */
export type ResolvedService<Service> = Service & Partial<Disposable>;
