import type {
  Anomaly,
  DiagnosticFinding,
  HealthCheck,
  ObservedSubsystem,
  RecoveryPolicy,
  RecoveryRecord,
} from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Recovery execution input. */
export interface RecoveryRequest {
  readonly approved?: boolean;
  readonly signal: Anomaly | DiagnosticFinding | HealthCheck;
}

/** Self-healing runtime with approval gates and audit history. */
export class SelfHealingRuntime {
  private readonly policies = new Map<string, RecoveryPolicy>();
  private readonly attempts = new Map<string, number>();

  public constructor(private readonly storage: TelemetryStorage) {
    this.register({
      action: 'retry',
      destructive: false,
      id: 'retry-on-retry-storm',
      maxAttempts: 1,
      requiresApproval: false,
      subsystem: 'workflow',
      trigger: 'retry-storm',
    });
    this.register({
      action: 'provider-failover',
      destructive: false,
      id: 'ai-provider-failover',
      maxAttempts: 2,
      requiresApproval: false,
      subsystem: 'ai',
      trigger: 'latency-spike',
    });
    this.register({
      action: 'queue-drain',
      destructive: false,
      id: 'queue-drain-on-congestion',
      maxAttempts: 2,
      requiresApproval: false,
      subsystem: 'workflow',
      trigger: 'queue-congestion',
    });
    this.register({
      action: 'service-restart',
      destructive: true,
      id: 'restart-down-service',
      maxAttempts: 1,
      requiresApproval: true,
      subsystem: 'distributed',
      trigger: 'health-down',
    });
  }

  public register(policy: RecoveryPolicy): void {
    this.policies.set(policy.id, policy);
  }

  public recover(request: RecoveryRequest): readonly RecoveryRecord[] {
    const policies = [...this.policies.values()].filter((policy) => this.matches(policy, request.signal));
    const records = policies.map((policy) => this.executePolicy(policy, request.approved ?? false));

    for (const record of records) {
      this.storage.writeRecovery(record);
    }

    return records;
  }

  private executePolicy(policy: RecoveryPolicy, approved: boolean): RecoveryRecord {
    const previousAttempts = this.attempts.get(policy.id) ?? 0;

    if (previousAttempts >= policy.maxAttempts) {
      return this.record(policy, 'blocked', 'Recovery max attempts exhausted.');
    }

    if ((policy.requiresApproval || policy.destructive) && !approved) {
      return this.record(policy, 'blocked', 'Human approval required before recovery action.');
    }

    this.attempts.set(policy.id, previousAttempts + 1);
    return this.record(policy, 'succeeded', `Applied ${policy.action}.`);
  }

  private matches(policy: RecoveryPolicy, signal: RecoveryRequest['signal']): boolean {
    if ('status' in signal) {
      return signal.status === 'down' && policy.trigger === 'health-down' && policy.subsystem === signal.subsystem;
    }

    return policy.trigger === signal.type && policy.subsystem === this.signalSubsystem(signal);
  }

  private signalSubsystem(signal: Anomaly | DiagnosticFinding): ObservedSubsystem {
    if ('subsystem' in signal) {
      return signal.subsystem;
    }

    if (signal.metric.startsWith('ai.')) {
      return 'ai';
    }

    if (signal.metric.startsWith('plugin.')) {
      return 'plugin';
    }

    if (signal.metric.startsWith('security.')) {
      return 'security';
    }

    return 'workflow';
  }

  private record(policy: RecoveryPolicy, status: RecoveryRecord['status'], reason: string): RecoveryRecord {
    return {
      action: policy.action,
      id: `recovery_${crypto.randomUUID()}`,
      policyId: policy.id,
      reason,
      status,
      subsystem: policy.subsystem,
      timestamp: Date.now(),
    };
  }
}
