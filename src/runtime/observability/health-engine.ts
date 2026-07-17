import type { HealthCheck, HealthStatus, ObservedSubsystem } from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Registered health check producer. */
export interface HealthProbe {
  readonly id: string;
  readonly subsystem: ObservedSubsystem;
  readonly name: string;
  readonly dependencies?: readonly string[];
  readonly check: () => HealthStatus | Promise<HealthStatus>;
}

/** Platform health, readiness, liveness, and dependency graph engine. */
export class HealthEngine {
  private readonly probes = new Map<string, HealthProbe>();

  public constructor(private readonly storage: TelemetryStorage) {}

  public register(probe: HealthProbe): void {
    this.probes.set(probe.id, probe);
  }

  public async run(): Promise<readonly HealthCheck[]> {
    const checks: HealthCheck[] = [];

    for (const probe of this.probes.values()) {
      checks.push(await this.runProbe(probe));
    }

    return checks;
  }

  public readiness(): boolean {
    return this.storage.getHealthChecks().every((check) => check.readiness);
  }

  public liveness(): boolean {
    return this.storage.getHealthChecks().every((check) => check.liveness);
  }

  public dependencyGraph(): Readonly<Record<string, readonly string[]>> {
    return Object.fromEntries(this.storage.getHealthChecks().map((check) => [check.id, check.dependencies]));
  }

  public platformStatus(): HealthStatus {
    const checks = this.storage.getHealthChecks();

    if (checks.length === 0) {
      return 'unknown';
    }

    if (checks.some((check) => check.status === 'down')) {
      return 'down';
    }

    if (checks.some((check) => check.status === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  public degradedSubsystems(): readonly ObservedSubsystem[] {
    return [...new Set(this.storage.getHealthChecks().filter((check) => check.status !== 'healthy').map((check) => check.subsystem))];
  }

  private async runProbe(probe: HealthProbe): Promise<HealthCheck> {
    const status = await probe.check();
    const check: HealthCheck = {
      checkedAt: Date.now(),
      dependencies: probe.dependencies ?? [],
      id: probe.id,
      liveness: status !== 'down',
      message: `${probe.name} is ${status}`,
      name: probe.name,
      readiness: status === 'healthy',
      status,
      subsystem: probe.subsystem,
    };
    this.storage.writeHealth(check);
    return check;
  }
}
