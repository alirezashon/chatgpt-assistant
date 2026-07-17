import { DeviceCapabilityDetector } from './device-capability-detector';
import { ExecutionPlanner } from './execution-planner';
import { LocalModelManager } from './local-model-manager';
import { MigrationEngine } from './migration-engine';
import { OfflineEngine } from './offline-engine';
import { ResourceManager } from './resource-manager';
import { SyncEngine } from './sync-engine';
import { HybridTelemetry } from './telemetry';
import type {
  ExecutionRequest,
  HybridExecutionResult,
  HybridValue,
  RuntimeDescriptor,
  RuntimeExecutor,
  RuntimeTarget,
} from './hybrid-types';
import { HybridRuntimeError } from './hybrid-types';

/** Hybrid Runtime dependencies. */
export interface HybridRuntimeDependencies {
  readonly deviceDetector?: DeviceCapabilityDetector;
  readonly localModels?: LocalModelManager;
  readonly migration?: MigrationEngine;
  readonly offline?: OfflineEngine;
  readonly planner?: ExecutionPlanner;
  readonly resources?: ResourceManager;
  readonly sync?: SyncEngine;
  readonly telemetry?: HybridTelemetry;
}

/** Browser-native hybrid execution runtime. */
export class HybridRuntime {
  public readonly localModels: LocalModelManager;
  public readonly migration: MigrationEngine;
  public readonly offline: OfflineEngine;
  public readonly planner: ExecutionPlanner;
  public readonly resources: ResourceManager;
  public readonly sync: SyncEngine;
  public readonly telemetry: HybridTelemetry;

  private readonly executors = new Map<RuntimeTarget, RuntimeExecutor>();

  public constructor(dependencies: HybridRuntimeDependencies = {}) {
    const detector = dependencies.deviceDetector ?? new DeviceCapabilityDetector();
    this.planner = dependencies.planner ?? new ExecutionPlanner(detector);
    this.localModels = dependencies.localModels ?? new LocalModelManager();
    this.migration = dependencies.migration ?? new MigrationEngine();
    this.offline = dependencies.offline ?? new OfflineEngine();
    this.resources = dependencies.resources ?? new ResourceManager();
    this.sync = dependencies.sync ?? new SyncEngine();
    this.telemetry = dependencies.telemetry ?? new HybridTelemetry();
  }

  /** Registers runtime executor. */
  public registerExecutor(executor: RuntimeExecutor): void {
    this.executors.set(executor.descriptor.target, executor);
  }

  /** Executes a request through planned runtime placement and fallback. */
  public async execute(request: ExecutionRequest): Promise<HybridExecutionResult> {
    const startedAt = Date.now();

    try {
      const decision = this.planner.plan(request, this.descriptors());
      this.telemetry.record({
        message: decision.reasons.join('; '),
        metrics: { score: decision.score },
        requestId: request.id,
        target: decision.target,
        type: 'placement-selected',
      });
      const output = await this.executeOn(decision.target, request, decision.fallbackTargets);
      const result: HybridExecutionResult = {
        latencyMs: Date.now() - startedAt,
        migrated: false,
        output,
        requestId: request.id,
        target: decision.target,
      };
      this.telemetry.record({
        message: 'Execution finished.',
        metrics: { latencyMs: result.latencyMs },
        requestId: request.id,
        target: result.target,
        type: 'execution-finished',
      });
      return result;
    } catch (error) {
      const device = new DeviceCapabilityDetector().detect();

      if (device.network === 'offline' || request.policy.requireOffline) {
        this.offline.enqueue(request);
        throw new HybridRuntimeError('HYBRID_OFFLINE_QUEUED', 'Request queued for offline execution.', {
          requestId: request.id,
        });
      }

      throw error;
    }
  }

  /** Drains offline queue. */
  public drainOffline(): Promise<readonly HybridValue[]> {
    return this.offline.drain(async (request) => (await this.execute(request)).output);
  }

  /** Migrates request to target after checkpoint. */
  public migrate(request: ExecutionRequest, from: RuntimeTarget, to: RuntimeTarget, reason: string) {
    const migration = this.migration.migrate({ from, reason, request, to });
    this.telemetry.record({
      message: reason,
      requestId: request.id,
      target: to,
      type: 'migration',
    });
    return migration;
  }

  /** Runtime descriptors. */
  public descriptors(): readonly RuntimeDescriptor[] {
    return [...this.executors.values()].map((executor) => executor.descriptor);
  }

  private async executeOn(
    target: RuntimeTarget,
    request: ExecutionRequest,
    fallbacks: readonly RuntimeTarget[],
  ): Promise<HybridValue> {
    const executor = this.executors.get(target);

    if (executor === undefined) {
      return this.tryFallback(request, fallbacks, `Executor not registered: ${target}`);
    }

    try {
      return await executor.execute(request);
    } catch (error) {
      return this.tryFallback(request, fallbacks, error instanceof Error ? error.message : String(error));
    }
  }

  private async tryFallback(
    request: ExecutionRequest,
    fallbacks: readonly RuntimeTarget[],
    reason: string,
  ): Promise<HybridValue> {
    for (const fallback of fallbacks) {
      const executor = this.executors.get(fallback);

      if (executor !== undefined) {
        this.migrate(request, request.policy.allowedTargets[0] ?? fallback, fallback, reason);
        return executor.execute(request);
      }
    }

    throw new HybridRuntimeError('HYBRID_RUNTIME_FAILED', reason, { requestId: request.id });
  }
}
