/** Stable Personal Knowledge Engine version. */
export const KNOWLEDGE_ENGINE_VERSION = '1.0.0';

/** JSON-like knowledge value. */
export type KnowledgeValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: KnowledgeValue }
  | readonly KnowledgeValue[];

/** Source type supported by connectors. */
export type KnowledgeSourceType =
  | 'browser-page'
  | 'code-repository'
  | 'document'
  | 'email'
  | 'github'
  | 'google-drive'
  | 'jira'
  | 'local-file'
  | 'markdown'
  | 'notion'
  | 'pdf'
  | 'slack';

/** Permission required to retrieve a source or chunk. */
export type KnowledgePermission =
  | 'knowledge.admin'
  | 'knowledge.read'
  | 'knowledge.read.confidential'
  | 'knowledge.write';

/** Connector auth mode. */
export type KnowledgeConnectorAuth = 'api-key' | 'local' | 'none' | 'oauth';

/** Sync strategy. */
export type KnowledgeSyncStrategy = 'manual' | 'polling' | 'realtime' | 'scheduled';

/** Document quality label. */
export type KnowledgeDocumentQuality = 'high' | 'low' | 'medium';

/** Knowledge connector metadata. */
export interface KnowledgeConnectorMetadata {
  /** Connector id. */
  readonly id: string;
  /** Source type. */
  readonly sourceType: KnowledgeSourceType;
  /** Display name. */
  readonly name: string;
  /** Authentication mode. */
  readonly authentication: KnowledgeConnectorAuth;
  /** Required permissions. */
  readonly permissions: readonly KnowledgePermission[];
  /** Sync strategy. */
  readonly syncStrategy: KnowledgeSyncStrategy;
  /** Source authority score. */
  readonly authority: number;
}

/** Raw fetched source record. */
export interface KnowledgeSourceRecord {
  /** Stable source id. */
  readonly id: string;
  /** Source type. */
  readonly sourceType: KnowledgeSourceType;
  /** URI. */
  readonly uri: string;
  /** Version. */
  readonly version: string;
  /** Title. */
  readonly title: string;
  /** Raw content. */
  readonly content: string;
  /** Metadata. */
  readonly metadata: Readonly<Record<string, KnowledgeValue>>;
  /** Required permissions. */
  readonly permissions: readonly KnowledgePermission[];
  /** Last modified timestamp. */
  readonly modifiedAt: number;
  /** Deleted flag. */
  readonly deleted?: boolean;
}

/** Connector contract. */
export interface KnowledgeConnector {
  /** Metadata. */
  readonly metadata: KnowledgeConnectorMetadata;
  /** Fetches source records since optional timestamp. */
  fetch(since?: number): Promise<readonly KnowledgeSourceRecord[]>;
}

/** Normalized knowledge document. */
export interface KnowledgeDocument {
  /** Document id. */
  readonly id: string;
  /** Source record id. */
  readonly sourceId: string;
  /** Source type. */
  readonly sourceType: KnowledgeSourceType;
  /** URI. */
  readonly uri: string;
  /** Version. */
  readonly version: string;
  /** Content hash. */
  readonly contentHash: string;
  /** Title. */
  readonly title: string;
  /** Author. */
  readonly author?: string;
  /** Date. */
  readonly date?: number;
  /** Topics. */
  readonly topics: readonly string[];
  /** Entities. */
  readonly entities: readonly string[];
  /** Links. */
  readonly links: readonly string[];
  /** Clean content. */
  readonly content: string;
  /** Metadata. */
  readonly metadata: Readonly<Record<string, KnowledgeValue>>;
  /** Required permissions. */
  readonly permissions: readonly KnowledgePermission[];
  /** Source authority score. */
  readonly authority: number;
  /** Quality label. */
  readonly quality: KnowledgeDocumentQuality;
  /** Last modified timestamp. */
  readonly modifiedAt: number;
  /** Indexed timestamp. */
  readonly indexedAt: number;
}

/** Chunking strategy. */
export type KnowledgeChunkingStrategy =
  | 'code-aware'
  | 'conversation'
  | 'document-structure'
  | 'fixed'
  | 'semantic';

/** Knowledge chunk. */
export interface KnowledgeChunk {
  /** Chunk id. */
  readonly id: string;
  /** Document id. */
  readonly documentId: string;
  /** Source id. */
  readonly sourceId: string;
  /** Chunk index. */
  readonly index: number;
  /** Text. */
  readonly text: string;
  /** Token estimate. */
  readonly tokenEstimate: number;
  /** Heading path. */
  readonly headings: readonly string[];
  /** Topics. */
  readonly topics: readonly string[];
  /** Entities. */
  readonly entities: readonly string[];
  /** Metadata. */
  readonly metadata: Readonly<Record<string, KnowledgeValue>>;
  /** Required permissions. */
  readonly permissions: readonly KnowledgePermission[];
  /** Modified timestamp. */
  readonly modifiedAt: number;
}

/** Knowledge embedding. */
export interface KnowledgeEmbedding {
  /** Model id. */
  readonly model: string;
  /** Version. */
  readonly version: string;
  /** Vector. */
  readonly vector: readonly number[];
}

/** Indexed chunk. */
export interface KnowledgeIndexedChunk {
  /** Chunk. */
  readonly chunk: KnowledgeChunk;
  /** Document. */
  readonly document: KnowledgeDocument;
  /** Embedding. */
  readonly embedding: KnowledgeEmbedding;
}

/** Knowledge graph entity type. */
export type KnowledgeEntityType =
  | 'company'
  | 'concept'
  | 'document'
  | 'file'
  | 'issue'
  | 'person'
  | 'project'
  | 'repository'
  | 'task'
  | 'technology'
  | 'user';

/** Knowledge relationship type. */
export type KnowledgeRelationshipType =
  | 'created'
  | 'depends'
  | 'modified'
  | 'references'
  | 'related'
  | 'uses';

/** Knowledge graph entity. */
export interface KnowledgeEntity {
  /** Entity id. */
  readonly id: string;
  /** Entity type. */
  readonly type: KnowledgeEntityType;
  /** Label. */
  readonly label: string;
  /** Metadata. */
  readonly metadata: Readonly<Record<string, KnowledgeValue>>;
}

/** Knowledge graph relationship. */
export interface KnowledgeRelationship {
  /** Relationship id. */
  readonly id: string;
  /** Source entity id. */
  readonly from: string;
  /** Target entity id. */
  readonly to: string;
  /** Type. */
  readonly type: KnowledgeRelationshipType;
  /** Confidence. */
  readonly confidence: number;
}

/** Knowledge graph. */
export interface KnowledgeGraph {
  /** Entities. */
  readonly entities: readonly KnowledgeEntity[];
  /** Relationships. */
  readonly relationships: readonly KnowledgeRelationship[];
}

/** Retrieval query. */
export interface KnowledgeQuery {
  /** Query text. */
  readonly text: string;
  /** Available permissions. */
  readonly permissions: readonly KnowledgePermission[];
  /** Optional source types. */
  readonly sourceTypes?: readonly KnowledgeSourceType[];
  /** Optional topic filters. */
  readonly topics?: readonly string[];
  /** Maximum results. */
  readonly limit: number;
  /** Current timestamp. */
  readonly now?: number;
}

/** Source reference for transparency. */
export interface KnowledgeSourceReference {
  /** Document id. */
  readonly documentId: string;
  /** Source id. */
  readonly sourceId: string;
  /** URI. */
  readonly uri: string;
  /** Title. */
  readonly title: string;
  /** Chunk id. */
  readonly chunkId: string;
}

/** Retrieval result. */
export interface KnowledgeRetrievalResult {
  /** Chunk. */
  readonly chunk: KnowledgeChunk;
  /** Document. */
  readonly document: KnowledgeDocument;
  /** Source reference. */
  readonly source: KnowledgeSourceReference;
  /** Score. */
  readonly score: number;
  /** Confidence. */
  readonly confidence: number;
  /** Ranking reasons. */
  readonly reasons: readonly string[];
}

/** RAG context block. */
export interface KnowledgeContextBlock {
  /** Chunk id. */
  readonly chunkId: string;
  /** Text included in context. */
  readonly text: string;
  /** Source reference. */
  readonly source: KnowledgeSourceReference;
  /** Token estimate. */
  readonly tokenEstimate: number;
}

/** RAG context package. */
export interface KnowledgeRagContext {
  /** Context blocks. */
  readonly blocks: readonly KnowledgeContextBlock[];
  /** Total tokens. */
  readonly totalTokens: number;
  /** Source references. */
  readonly sources: readonly KnowledgeSourceReference[];
  /** Confidence. */
  readonly confidence: number;
}

/** Knowledge runtime events. */
export interface KnowledgeRuntimeEvents {
  readonly 'knowledge.connectorRegistered': { readonly connectorId: string };
  readonly 'knowledge.connectorSynced': {
    readonly connectorId: string;
    readonly chunks: number;
    readonly deleted: number;
    readonly documents: number;
  };
  readonly 'knowledge.contextBuilt': {
    readonly blockCount: number;
    readonly query: string;
    readonly sourceCount: number;
    readonly tokenCount: number;
  };
  readonly 'knowledge.documentDeleted': { readonly sourceId: string };
  readonly 'knowledge.retrieved': { readonly query: string; readonly resultCount: number };
}
