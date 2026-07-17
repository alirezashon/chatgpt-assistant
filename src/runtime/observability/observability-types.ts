/** Stable Observability Runtime version. */
export const OBSERVABILITY_RUNTIME_VERSION = '1.0.0';

/** JSON-like telemetry value. */
export type ObservabilityValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: ObservabilityValue }
  | readonly ObservabilityValue[];

/** Telemetry signal type. */
export type TelemetrySignalType =
  | 'ai-kpi'
  | 'business-kpi'
  | 'event'
  | 'health'
  | 'log'
  | 'metric'
  | 'profile'
  | 'trace';

/** Severity. */
export type ObservabilitySeverity = 'critical' | 'debug' | 'error' | 'info' | 'warn';

/** Platform subsystem. */
export type ObservedSubsystem =
  | 'agent'
  | 'ai'
  | 'api'
  | 'browser'
  | 'distributed'
  | 'enterprise'
  | 'hybrid'
  | 'knowledge'
  | 'marketplace'
  | 'memory'
  | 'plugin'
  | 'security'
  | 'workflow';

/** Telemetry resource context. */
export interface TelemetryContext {
  readonly traceId: string;
  readonly spanId?: string;
  readonly parentSpanId?: string;
  readonly correlationId: string;
  readonly subsystem: ObservedSubsystem;
  readonly organizationId?: string;
  readonly actorId?: string;
}

/** Telemetry record. */
export interface TelemetryRecord {
  readonly id: string;
  readonly type: TelemetrySignalType;
  readonly timestamp: number;
  readonly context: TelemetryContext;
  readonly name: string;
  readonly severity: ObservabilitySeverity;
  readonly value: ObservabilityValue;
  readonly attributes: Readonly<Record<string, ObservabilityValue>>;
}

/** Trace span. */
export interface ObservabilitySpan {
  readonly id: string;
  readonly traceId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly subsystem: ObservedSubsystem;
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly status: 'error' | 'ok' | 'running';
  readonly attributes: Readonly<Record<string, ObservabilityValue>>;
}

/** Metric aggregation. */
export interface MetricPoint {
  readonly name: string;
  readonly value: number;
  readonly timestamp: number;
  readonly tags: Readonly<Record<string, string>>;
}

/** Health status. */
export type HealthStatus = 'degraded' | 'down' | 'healthy' | 'unknown';

/** Health check. */
export interface HealthCheck {
  readonly id: string;
  readonly subsystem: ObservedSubsystem;
  readonly name: string;
  readonly status: HealthStatus;
  readonly readiness: boolean;
  readonly liveness: boolean;
  readonly dependencies: readonly string[];
  readonly checkedAt: number;
  readonly message: string;
}

/** Diagnostic finding. */
export interface DiagnosticFinding {
  readonly id: string;
  readonly subsystem: ObservedSubsystem;
  readonly type:
    | 'agent-loop'
    | 'deadlock'
    | 'memory-leak'
    | 'performance-regression'
    | 'queue-congestion'
    | 'retry-storm'
    | 'slow-query'
    | 'workflow-stall';
  readonly severity: Exclude<ObservabilitySeverity, 'debug' | 'info'>;
  readonly summary: string;
  readonly evidence: readonly string[];
  readonly timestamp: number;
}

/** Anomaly. */
export interface Anomaly {
  readonly id: string;
  readonly type:
    | 'ai-behavior'
    | 'cost-spike'
    | 'latency-spike'
    | 'plugin-abuse'
    | 'resource-exhaustion'
    | 'security'
    | 'traffic-spike';
  readonly severity: Exclude<ObservabilitySeverity, 'debug' | 'info'>;
  readonly metric: string;
  readonly observed: number;
  readonly expected: number;
  readonly subsystem?: ObservedSubsystem;
  readonly timestamp: number;
}

/** Recovery action. */
export type RecoveryAction =
  | 'circuit-break'
  | 'graceful-degradation'
  | 'provider-failover'
  | 'queue-drain'
  | 'retry'
  | 'service-restart'
  | 'worker-replacement';

/** Recovery policy. */
export interface RecoveryPolicy {
  readonly id: string;
  readonly subsystem: ObservedSubsystem;
  readonly trigger: DiagnosticFinding['type'] | Anomaly['type'] | 'health-down';
  readonly action: RecoveryAction;
  readonly maxAttempts: number;
  readonly destructive: boolean;
  readonly requiresApproval: boolean;
}

/** Recovery record. */
export interface RecoveryRecord {
  readonly id: string;
  readonly policyId: string;
  readonly subsystem: ObservedSubsystem;
  readonly action: RecoveryAction;
  readonly status: 'blocked' | 'failed' | 'succeeded';
  readonly reason: string;
  readonly timestamp: number;
}

/** Alert channel. */
export type AlertChannel = 'email' | 'pagerduty' | 'slack' | 'webhook';

/** Alert. */
export interface Alert {
  readonly id: string;
  readonly channel: AlertChannel;
  readonly severity: Exclude<ObservabilitySeverity, 'debug' | 'info'>;
  readonly title: string;
  readonly message: string;
  readonly subsystem: ObservedSubsystem;
  readonly timestamp: number;
}

/** SLO definition. */
export interface SLODefinition {
  readonly id: string;
  readonly subsystem: ObservedSubsystem;
  readonly name: string;
  readonly metric: string;
  readonly objective: number;
  readonly comparator: 'gte' | 'lte';
}

/** SLO result. */
export interface SLOResult {
  readonly sloId: string;
  readonly compliant: boolean;
  readonly observed: number;
  readonly objective: number;
}

/** Dashboard. */
export interface ObservabilityDashboard {
  readonly id: string;
  readonly title: string;
  readonly widgets: readonly {
    readonly title: string;
    readonly metric: string;
    readonly subsystem?: ObservedSubsystem;
  }[];
}

/** Postmortem. */
export interface Postmortem {
  readonly id: string;
  readonly title: string;
  readonly timeline: readonly string[];
  readonly rootCause: string;
  readonly impact: string;
  readonly recovery: string;
  readonly correctiveActions: readonly string[];
  readonly createdAt: number;
}
