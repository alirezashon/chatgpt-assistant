/** Stable Hybrid Runtime version. */
export const HYBRID_RUNTIME_VERSION = '1.0.0';

/** JSON-like value for hybrid runtime state. */
export type HybridValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: HybridValue }
  | readonly HybridValue[];

/** Execution location. */
export type RuntimeTarget =
  | 'browser-ui'
  | 'cloud'
  | 'content-script'
  | 'edge'
  | 'extension-service-worker'
  | 'local'
  | 'offscreen-document'
  | 'shared-worker';

/** Runtime capability. */
export type RuntimeCapability =
  | 'agent-execution'
  | 'browser-dom'
  | 'document-indexing'
  | 'enterprise-integration'
  | 'gpu-compute'
  | 'heavy-reasoning'
  | 'local-embedding'
  | 'local-llm'
  | 'local-ocr'
  | 'local-speech'
  | 'local-vision'
  | 'offline-search'
  | 'workflow-execution';

/** Data placement class. */
export type DataPlacementClass =
  | 'can-use-cloud'
  | 'can-use-edge'
  | 'enterprise-restricted'
  | 'never-leave-device'
  | 'personally-sensitive';

/** Network quality. */
export type NetworkQuality = 'offline' | 'poor' | 'good' | 'excellent';

/** Runtime health. */
export type RuntimeHealthStatus = 'degraded' | 'healthy' | 'offline' | 'unavailable';

/** Local model status. */
export type LocalModelStatus = 'cached' | 'downloaded' | 'loaded' | 'missing' | 'verified';

/** Device profile. */
export interface DeviceCapabilityProfile {
  readonly cpuCores: number;
  readonly gpuAvailable: boolean;
  readonly ramMb: number;
  readonly batteryLevel: number;
  readonly charging: boolean;
  readonly network: NetworkQuality;
  readonly browserApis: readonly string[];
  readonly webGpu: boolean;
  readonly wasm: boolean;
  readonly storageQuotaMb: number;
  readonly hardwareAcceleration: boolean;
  readonly availableLocalModels: readonly string[];
}

/** Runtime descriptor. */
export interface RuntimeDescriptor {
  readonly target: RuntimeTarget;
  readonly capabilities: readonly RuntimeCapability[];
  readonly health: RuntimeHealthStatus;
  readonly latencyMs: number;
  readonly costScore: number;
  readonly privacyScore: number;
  readonly maxMemoryMb: number;
  readonly supportsOffline: boolean;
  readonly region?: string;
}

/** Execution policy. */
export interface ExecutionPolicy {
  readonly allowedTargets: readonly RuntimeTarget[];
  readonly dataPlacement: DataPlacementClass;
  readonly maxLatencyMs: number;
  readonly maxCostScore: number;
  readonly preferLocal: boolean;
  readonly requireOffline: boolean;
  readonly dataResidency?: string;
}

/** Execution request. */
export interface ExecutionRequest {
  readonly id: string;
  readonly capability: RuntimeCapability;
  readonly input: HybridValue;
  readonly policy: ExecutionPolicy;
  readonly priority: 'critical' | 'high' | 'low' | 'normal';
  readonly organizationId?: string;
  readonly checkpointKey?: string;
}

/** Placement decision. */
export interface PlacementDecision {
  readonly requestId: string;
  readonly target: RuntimeTarget;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly fallbackTargets: readonly RuntimeTarget[];
}

/** Execution result. */
export interface HybridExecutionResult {
  readonly requestId: string;
  readonly target: RuntimeTarget;
  readonly output: HybridValue;
  readonly latencyMs: number;
  readonly migrated: boolean;
}

/** Runtime executor. */
export interface RuntimeExecutor {
  readonly descriptor: RuntimeDescriptor;
  execute(request: ExecutionRequest): Promise<HybridValue> | HybridValue;
}

/** Local model record. */
export interface LocalModelRecord {
  readonly id: string;
  readonly capability: RuntimeCapability;
  readonly checksum: string;
  readonly sizeMb: number;
  readonly status: LocalModelStatus;
  readonly version: string;
  readonly loadedAt?: number;
}

/** Offline queue item. */
export interface OfflineQueueItem {
  readonly id: string;
  readonly request: ExecutionRequest;
  readonly createdAt: number;
  readonly attempts: number;
}

/** Version vector. */
export type VersionVector = Readonly<Record<string, number>>;

/** Sync record. */
export interface SyncRecord {
  readonly id: string;
  readonly value: HybridValue;
  readonly vector: VersionVector;
  readonly updatedAt: number;
}

/** Migration record. */
export interface MigrationRecord {
  readonly id: string;
  readonly requestId: string;
  readonly from: RuntimeTarget;
  readonly to: RuntimeTarget;
  readonly checkpointKey: string;
  readonly timestamp: number;
  readonly reason: string;
}

/** Resource budget. */
export interface ResourceBudget {
  readonly cpuPercent: number;
  readonly gpuPercent: number;
  readonly memoryMb: number;
  readonly aiCostScore: number;
  readonly batteryAware: boolean;
}

/** Telemetry event. */
export interface HybridTelemetryEvent {
  readonly id: string;
  readonly type:
    | 'crash'
    | 'device-diagnostics'
    | 'execution-finished'
    | 'latency'
    | 'migration'
    | 'placement-selected'
    | 'resource-throttled';
  readonly requestId?: string;
  readonly target?: RuntimeTarget;
  readonly message: string;
  readonly metrics: Readonly<Record<string, number>>;
  readonly timestamp: number;
}

/** Hybrid runtime error code. */
export type HybridRuntimeErrorCode =
  | 'HYBRID_CAPABILITY_UNAVAILABLE'
  | 'HYBRID_MODEL_INVALID'
  | 'HYBRID_OFFLINE_QUEUED'
  | 'HYBRID_PLACEMENT_DENIED'
  | 'HYBRID_RUNTIME_FAILED'
  | 'HYBRID_SYNC_CONFLICT';

/** Structured hybrid runtime error. */
export class HybridRuntimeError extends Error {
  readonly code: HybridRuntimeErrorCode;
  readonly details: Readonly<Record<string, HybridValue>> | undefined;

  public constructor(
    code: HybridRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, HybridValue>>,
  ) {
    super(message);
    this.name = 'HybridRuntimeError';
    this.code = code;
    this.details = details;
  }
}
