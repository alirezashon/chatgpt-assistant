/** Stable Distributed Runtime version. */
export const DISTRIBUTED_RUNTIME_VERSION = '1.0.0';

/** JSON-like distributed runtime value. */
export type DistributedValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: DistributedValue }
  | readonly DistributedValue[];

/** Delivery semantic. */
export type EventDeliveryMode = 'at-least-once' | 'at-most-once' | 'exactly-once';

/** Event namespace. */
export type PlatformEventNamespace =
  | 'agent'
  | 'ai'
  | 'api'
  | 'browser'
  | 'enterprise'
  | 'knowledge'
  | 'marketplace'
  | 'memory'
  | 'security'
  | 'workflow';

/** Platform event type. */
export type PlatformEventType =
  | 'agent.failed'
  | 'agent.task.completed'
  | 'agent.goal.created'
  | 'ai.completion.finished'
  | 'ai.model.selected'
  | 'ai.tool.called'
  | 'api.request.completed'
  | 'browser.element.detected'
  | 'browser.page.changed'
  | 'browser.page.opened'
  | 'enterprise.organization.updated'
  | 'enterprise.user.created'
  | 'knowledge.updated'
  | 'marketplace.package.published'
  | 'memory.created'
  | 'memory.updated'
  | 'security.permission.requested'
  | 'security.policy.denied'
  | 'workflow.started'
  | 'workflow.step.finished';

/** Event actor. */
export interface DistributedActor {
  readonly id: string;
  readonly type: 'agent' | 'api-client' | 'service' | 'system' | 'user' | 'workflow';
}

/** Event security context. */
export interface DistributedSecurityContext {
  readonly identityId: string;
  readonly permissions: readonly string[];
  readonly trustLevel: 'enterprise-approved' | 'limited' | 'trusted' | 'unknown' | 'verified';
  readonly signature?: string;
}

/** Versioned distributed event envelope. */
export interface DistributedEvent<Payload extends DistributedValue = DistributedValue> {
  readonly actor: DistributedActor;
  readonly deliveryMode: EventDeliveryMode;
  readonly id: string;
  readonly idempotencyKey?: string;
  readonly metadata: Readonly<Record<string, DistributedValue>>;
  readonly organizationId?: string;
  readonly payload: Payload;
  readonly security: DistributedSecurityContext;
  readonly source: string;
  readonly timestamp: number;
  readonly traceId: string;
  readonly type: PlatformEventType;
  readonly version: number;
}

/** Event schema. */
export interface DistributedEventSchema {
  readonly type: string;
  readonly version: number;
  readonly requiredFields: readonly string[];
  readonly deprecated: boolean;
  readonly compatibleWith: readonly number[];
}

/** Consumer subscription. */
export interface EventSubscriptionDefinition {
  readonly id: string;
  readonly consumerId: string;
  readonly pattern: string;
  readonly deliveryMode: EventDeliveryMode;
  readonly maxAttempts: number;
}

/** Delivery state. */
export interface EventDeliveryRecord {
  readonly id: string;
  readonly eventId: string;
  readonly subscriptionId: string;
  readonly consumerId: string;
  readonly attempts: number;
  readonly status: 'acknowledged' | 'dead-lettered' | 'failed' | 'pending';
  readonly error?: string;
  readonly timestamp: number;
}

/** Event consumer. */
export interface EventConsumer {
  readonly id: string;
  handle(event: DistributedEvent): Promise<void> | void;
}

/** Job priority. */
export type JobPriority = 'critical' | 'high' | 'low' | 'normal';

/** Job status. */
export type JobStatus =
  | 'cancelled'
  | 'completed'
  | 'dead-lettered'
  | 'failed'
  | 'pending'
  | 'running'
  | 'scheduled';

/** Retry policy. */
export interface DistributedRetryPolicy {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly multiplier: number;
}

/** Distributed job. */
export interface DistributedJob {
  readonly id: string;
  readonly type: string;
  readonly queue: string;
  readonly payload: DistributedValue;
  readonly priority: JobPriority;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly retryPolicy: DistributedRetryPolicy;
  readonly runAt: number;
  readonly recurring?: DistributedRecurringSchedule;
  readonly organizationId?: string;
  readonly idempotencyKey?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly error?: string;
}

/** Recurring schedule. */
export interface DistributedRecurringSchedule {
  readonly intervalMs?: number;
  readonly cron?: string;
  readonly timezone?: string;
}

/** Job handler. */
export interface DistributedJobHandler {
  readonly type: string;
  execute(job: DistributedJob, state: DistributedStateStore): Promise<DistributedValue> | DistributedValue;
}

/** Worker. */
export interface DistributedWorker {
  readonly id: string;
  readonly queues: readonly string[];
  readonly concurrency: number;
  readonly resourceLimit: {
    readonly maxMemoryMb: number;
    readonly maxRuntimeMs: number;
  };
}

/** Worker health. */
export interface WorkerHealth {
  readonly workerId: string;
  readonly status: 'degraded' | 'healthy' | 'offline';
  readonly activeJobs: number;
  readonly lastHeartbeatAt: number;
}

/** Versioned state record. */
export interface DistributedStateRecord {
  readonly key: string;
  readonly value: DistributedValue;
  readonly version: number;
  readonly updatedAt: number;
  readonly history: readonly {
    readonly value: DistributedValue;
    readonly version: number;
    readonly timestamp: number;
  }[];
}

/** State store contract. */
export interface DistributedStateStore {
  checkpoint(key: string, value: DistributedValue): DistributedStateRecord;
  get(key: string): DistributedStateRecord | undefined;
  list(prefix?: string): readonly DistributedStateRecord[];
}

/** Realtime subscription. */
export interface RealtimeSubscription {
  readonly id: string;
  readonly topic: string;
  readonly connectionId: string;
  readonly organizationId?: string;
}

/** Presence record. */
export interface RealtimePresence {
  readonly connectionId: string;
  readonly userId: string;
  readonly topic: string;
  readonly status: 'away' | 'offline' | 'online';
  readonly updatedAt: number;
}

/** Distributed trace span. */
export interface DistributedTraceSpan {
  readonly id: string;
  readonly traceId: string;
  readonly parentId?: string;
  readonly name: string;
  readonly kind: 'event' | 'job' | 'realtime' | 'scheduler';
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly status: 'failed' | 'ok' | 'running';
  readonly attributes: Readonly<Record<string, DistributedValue>>;
}

/** Distributed runtime error code. */
export type DistributedRuntimeErrorCode =
  | 'DISTRIBUTED_EVENT_REJECTED'
  | 'DISTRIBUTED_JOB_FAILED'
  | 'DISTRIBUTED_NOT_FOUND'
  | 'DISTRIBUTED_REPLAY_REJECTED'
  | 'DISTRIBUTED_SCHEMA_INVALID'
  | 'DISTRIBUTED_SECURITY_DENIED';

/** Structured distributed runtime error. */
export class DistributedRuntimeError extends Error {
  readonly code: DistributedRuntimeErrorCode;
  readonly details: Readonly<Record<string, DistributedValue>> | undefined;

  public constructor(
    code: DistributedRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, DistributedValue>>,
  ) {
    super(message);
    this.name = 'DistributedRuntimeError';
    this.code = code;
    this.details = details;
  }
}
