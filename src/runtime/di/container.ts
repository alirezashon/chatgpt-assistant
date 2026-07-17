import { DisposableStore, RuntimeError } from '@/runtime/utils';

import type {
  DependencyGraphEdge,
  ServiceRegistration,
  ServiceResolver,
  ServiceToken,
} from './di-types';

const ROOT_SCOPE_ID = 'root';

/** Production dependency injection container with lifetime and cycle validation. */
export class DIContainer implements ServiceResolver {
  private readonly registrations = new Map<string, ServiceRegistration<unknown>>();
  private readonly singletons = new Map<string, unknown>();
  private readonly scoped = new Map<string, Map<string, unknown>>();
  private readonly disposables = new DisposableStore();

  /** Registers a service. Throws on duplicate token ids. */
  public register<Service>(registration: ServiceRegistration<Service>): void {
    if (this.registrations.has(registration.token.id)) {
      throw new RuntimeError(
        'REGISTRATION_CONFLICT',
        `Service already registered: ${registration.token.id}`,
      );
    }

    this.registrations.set(registration.token.id, registration);
    this.validateDeclaredDependencies(registration);
  }

  /** Resolves a service from the root scope. */
  public async resolve<Service>(token: ServiceToken<Service>): Promise<Service> {
    return this.resolveInScope(token, ROOT_SCOPE_ID, []);
  }

  /** Resolves a service from a named scope. */
  public async resolveScoped<Service>(
    token: ServiceToken<Service>,
    scopeId: string,
  ): Promise<Service> {
    return this.resolveInScope(token, scopeId, []);
  }

  /** Returns the declared dependency graph. */
  public getDependencyGraph(): readonly DependencyGraphEdge[] {
    return [...this.registrations.values()].flatMap((registration) =>
      (registration.dependencies ?? []).map((dependency) => ({
        from: registration.token.id,
        to: dependency.id,
      })),
    );
  }

  /** Validates the full dependency graph for cycles. */
  public validate(): void {
    for (const registration of this.registrations.values()) {
      this.detectCycle(registration.token.id, []);
    }
  }

  /** Disposes all singleton/scoped services that implement Disposable. */
  public async dispose(): Promise<void> {
    await this.disposables.dispose();
    this.singletons.clear();
    this.scoped.clear();
    this.registrations.clear();
  }

  private async resolveInScope<Service>(
    token: ServiceToken<Service>,
    scopeId: string,
    stack: readonly string[],
  ): Promise<Service> {
    if (stack.includes(token.id)) {
      throw new RuntimeError(
        'CIRCULAR_DEPENDENCY',
        `Circular dependency detected: ${[...stack, token.id].join(' -> ')}`,
      );
    }

    const registration = this.registrations.get(token.id);

    if (registration === undefined) {
      throw new RuntimeError('NOT_FOUND', `Service not registered: ${token.id}`);
    }

    if (registration.lifetime === 'singleton' || registration.lifetime === 'lazy') {
      const existing = this.singletons.get(token.id);

      if (existing !== undefined) {
        return existing as Service;
      }

      const instance = await this.createInstance(registration, scopeId, [...stack, token.id]);
      this.singletons.set(token.id, instance);
      this.trackDisposable(instance);
      return instance as Service;
    }

    if (registration.lifetime === 'scoped') {
      const scope = this.scoped.get(scopeId) ?? new Map<string, unknown>();
      this.scoped.set(scopeId, scope);

      const existing = scope.get(token.id);

      if (existing !== undefined) {
        return existing as Service;
      }

      const instance = await this.createInstance(registration, scopeId, [...stack, token.id]);
      scope.set(token.id, instance);
      this.trackDisposable(instance);
      return instance as Service;
    }

    const instance = await this.createInstance(registration, scopeId, [...stack, token.id]);
    this.trackDisposable(instance);
    return instance as Service;
  }

  private createInstance(
    registration: ServiceRegistration<unknown>,
    scopeId: string,
    stack: readonly string[],
  ): Promise<unknown> {
    const resolver: ServiceResolver = {
      resolve: async <Service>(token: ServiceToken<Service>) =>
        this.resolveInScope(token, scopeId, stack),
    };

    return Promise.resolve(registration.factory(resolver, { scopeId }));
  }

  private validateDeclaredDependencies(registration: ServiceRegistration<unknown>): void {
    for (const dependency of registration.dependencies ?? []) {
      if (dependency.id === registration.token.id) {
        throw new RuntimeError(
          'CIRCULAR_DEPENDENCY',
          `Service depends on itself: ${registration.token.id}`,
        );
      }
    }
  }

  private detectCycle(tokenId: string, stack: readonly string[]): void {
    if (stack.includes(tokenId)) {
      throw new RuntimeError(
        'CIRCULAR_DEPENDENCY',
        `Circular dependency detected: ${[...stack, tokenId].join(' -> ')}`,
      );
    }

    const registration = this.registrations.get(tokenId);

    if (registration === undefined) {
      return;
    }

    for (const dependency of registration.dependencies ?? []) {
      this.detectCycle(dependency.id, [...stack, tokenId]);
    }
  }

  private trackDisposable(instance: unknown): void {
    if (isDisposable(instance)) {
      this.disposables.add(instance);
    }
  }
}

function isDisposable(value: unknown): value is { dispose(): void | Promise<void> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof (value as { readonly dispose?: unknown }).dispose === 'function'
  );
}
