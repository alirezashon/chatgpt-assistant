/** Stable Personal Memory Runtime version. */
export const MEMORY_RUNTIME_VERSION = '1.0.0';

/** JSON-like memory value. */
export type MemoryValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: MemoryValue }
  | readonly MemoryValue[];

/** Memory type. */
export type MemoryType =
  'episodic' | 'preference' | 'procedural' | 'semantic' | 'short-term' | 'working';

/** Memory source type. */
export type MemorySourceType =
  'agent' | 'browser' | 'command' | 'explicit-user' | 'plugin' | 'system' | 'workflow';

/** Memory sensitivity. */
export type MemorySensitivity = 'confidential' | 'personal' | 'public' | 'restricted';

/** Memory permission. */
export type MemoryPermission =
  'memory.apply' | 'memory.delete' | 'memory.export' | 'memory.read' | 'memory.write';

/** Memory approval state. */
export type MemoryApprovalState = 'approved' | 'pending' | 'rejected';

/** Memory relationship type. */
export type MemoryRelationshipType =
  'conflicts_with' | 'derived_from' | 'mentions' | 'reinforces' | 'related_to' | 'used_with';

/** Memory source metadata. */
export interface MemorySource {
  /** Source type. */
  readonly type: MemorySourceType;
  /** Source id. */
  readonly id: string;
  /** Source URL or entity id. */
  readonly uri?: string;
  /** Trust score from 0 to 1. */
  readonly trust: number;
  /** Created timestamp. */
  readonly timestamp: number;
}

/** Memory importance score and signals. */
export interface MemoryImportance {
  /** Final score from 0 to 1. */
  readonly score: number;
  /** Frequency signal. */
  readonly frequency: number;
  /** Recency signal. */
  readonly recency: number;
  /** User confirmation signal. */
  readonly userConfirmed: boolean;
  /** Future usefulness signal. */
  readonly futureUsefulness: number;
  /** Task success signal. */
  readonly taskSuccess: boolean;
}

/** Memory confidence score. */
export interface MemoryConfidence {
  /** Final confidence from 0 to 1. */
  readonly score: number;
  /** Evidence count. */
  readonly evidenceCount: number;
  /** Source trust. */
  readonly sourceTrust: number;
  /** Contradiction penalty from 0 to 1. */
  readonly contradictionPenalty: number;
}

/** Memory embedding. */
export interface MemoryEmbedding {
  /** Embedding model id. */
  readonly model: string;
  /** Vector values. */
  readonly vector: readonly number[];
}

/** Memory expiration policy. */
export interface MemoryExpiration {
  /** Optional expiration timestamp. */
  readonly expiresAt?: number;
  /** Decay rate per day. */
  readonly decayPerDay: number;
  /** Whether memory should be retained until explicit deletion. */
  readonly persistent: boolean;
}

/** Memory relationship. */
export interface MemoryRelationship {
  /** Relationship id. */
  readonly id: string;
  /** Source memory/entity id. */
  readonly from: string;
  /** Target memory/entity id. */
  readonly to: string;
  /** Relationship type. */
  readonly type: MemoryRelationshipType;
  /** Confidence. */
  readonly confidence: number;
}

/** Memory item. */
export interface MemoryItem {
  /** Memory id. */
  readonly id: string;
  /** Type. */
  readonly type: MemoryType;
  /** Title. */
  readonly title: string;
  /** Content summary. */
  readonly content: string;
  /** Structured value. */
  readonly value: MemoryValue;
  /** Tags. */
  readonly tags: readonly string[];
  /** Source. */
  readonly source: MemorySource;
  /** Importance. */
  readonly importance: MemoryImportance;
  /** Confidence. */
  readonly confidence: MemoryConfidence;
  /** Optional embedding. */
  readonly embedding?: MemoryEmbedding;
  /** Expiration. */
  readonly expiration: MemoryExpiration;
  /** Sensitivity. */
  readonly sensitivity: MemorySensitivity;
  /** Permissions required to retrieve/apply this memory. */
  readonly permissions: readonly MemoryPermission[];
  /** Approval state. */
  readonly approval: MemoryApprovalState;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Updated timestamp. */
  readonly updatedAt: number;
}

/** Memory observation before extraction. */
export interface MemoryObservation {
  /** Observation id. */
  readonly id: string;
  /** Raw text. */
  readonly text: string;
  /** Structured context. */
  readonly context: MemoryValue;
  /** Source. */
  readonly source: MemorySource;
  /** Sensitivity. */
  readonly sensitivity: MemorySensitivity;
  /** Explicit user confirmation. */
  readonly userConfirmed: boolean;
  /** Task succeeded. */
  readonly taskSuccess: boolean;
}

/** Memory extraction candidate. */
export interface MemoryCandidate {
  /** Candidate type. */
  readonly type: MemoryType;
  /** Title. */
  readonly title: string;
  /** Content. */
  readonly content: string;
  /** Value. */
  readonly value: MemoryValue;
  /** Tags. */
  readonly tags: readonly string[];
  /** Sensitivity. */
  readonly sensitivity: MemorySensitivity;
}

/** Knowledge graph node. */
export interface MemoryGraphNode {
  /** Node id. */
  readonly id: string;
  /** Node kind. */
  readonly kind:
    | 'document'
    | 'memory'
    | 'preference'
    | 'project'
    | 'repository'
    | 'task'
    | 'technology'
    | 'user';
  /** Label. */
  readonly label: string;
  /** Metadata. */
  readonly metadata: MemoryValue;
}

/** Memory graph. */
export interface MemoryGraph {
  /** Nodes. */
  readonly nodes: readonly MemoryGraphNode[];
  /** Relationships. */
  readonly relationships: readonly MemoryRelationship[];
}

/** Memory query. */
export interface MemoryQuery {
  /** Query text. */
  readonly text: string;
  /** Optional memory types. */
  readonly types?: readonly MemoryType[];
  /** Permissions available to caller. */
  readonly permissions: readonly MemoryPermission[];
  /** Optional tags. */
  readonly tags?: readonly string[];
  /** Maximum results. */
  readonly limit: number;
  /** Current timestamp. */
  readonly now?: number;
}

/** Memory retrieval result. */
export interface MemoryRetrievalResult {
  /** Memory item. */
  readonly item: MemoryItem;
  /** Final retrieval score. */
  readonly score: number;
  /** Match reasons. */
  readonly reasons: readonly string[];
}

/** Privacy policy for memory storage and retrieval. */
export interface MemoryPrivacyPolicy {
  /** Allow restricted memories. */
  readonly allowRestricted: boolean;
  /** Require approval for implicit memory. */
  readonly requireApprovalForImplicit: boolean;
  /** Local-only mode. */
  readonly localOnly: boolean;
}

/** Memory runtime event map. */
export interface MemoryRuntimeEvents {
  readonly 'memory.created': { readonly memoryId: string; readonly type: MemoryType };
  readonly 'memory.deleted': { readonly memoryId: string };
  readonly 'memory.expired': { readonly memoryId: string };
  readonly 'memory.conflict': { readonly memoryId: string; readonly conflictsWith: string };
  readonly 'memory.retrieved': { readonly query: string; readonly resultCount: number };
}
