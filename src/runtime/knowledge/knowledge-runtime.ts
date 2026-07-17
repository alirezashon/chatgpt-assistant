import type { AgentTool, AgentToolRequest, AgentToolResponse } from '@/runtime/agents';
import { EventBus } from '@/runtime/events';

import { KnowledgeChunker } from './knowledge-chunking';
import { KnowledgeConnectorRegistry } from './knowledge-connectors';
import { KnowledgeContextBuilder } from './knowledge-context-builder';
import { LocalKnowledgeEmbeddingProvider, type KnowledgeEmbeddingProvider } from './knowledge-embedding';
import { KnowledgeIndex } from './knowledge-index';
import { KnowledgeIngestionPipeline, type KnowledgeIngestionResult } from './knowledge-ingestion';
import { KnowledgeDocumentNormalizer } from './knowledge-normalizer';
import { KnowledgeRetrievalEngine } from './knowledge-retrieval';
import type {
  KnowledgeConnector,
  KnowledgeConnectorMetadata,
  KnowledgeGraph,
  KnowledgePermission,
  KnowledgeQuery,
  KnowledgeRagContext,
  KnowledgeRetrievalResult,
  KnowledgeRuntimeEvents,
  KnowledgeSourceType,
  KnowledgeValue,
} from './knowledge-types';

/** Knowledge runtime options. */
export interface KnowledgeRuntimeOptions {
  /** Connector registry. */
  readonly connectors?: KnowledgeConnectorRegistry;
  /** Hybrid index. */
  readonly index?: KnowledgeIndex;
  /** Embedding provider. */
  readonly embeddings?: KnowledgeEmbeddingProvider;
  /** Runtime event bus. */
  readonly events?: EventBus<KnowledgeRuntimeEvents>;
}

/** Knowledge search input. */
export interface KnowledgeSearchInput {
  /** Query text. */
  readonly text: string;
  /** Caller permissions. */
  readonly permissions: readonly KnowledgePermission[];
  /** Maximum results. */
  readonly limit?: number;
  /** Optional source filters. */
  readonly sourceTypes?: readonly KnowledgeSourceType[];
  /** Optional topic filters. */
  readonly topics?: readonly string[];
  /** Current timestamp. */
  readonly now?: number;
}

/** Knowledge context request. */
export interface KnowledgeContextRequest extends KnowledgeSearchInput {
  /** Context token budget. */
  readonly tokenBudget: number;
}

/** Knowledge sync result. */
export interface KnowledgeSyncResult extends KnowledgeIngestionResult {
  /** Connector id. */
  readonly connectorId: string;
}

/** Runtime error code. */
export type KnowledgeRuntimeErrorCode =
  | 'KNOWLEDGE_CONNECTOR_NOT_FOUND'
  | 'KNOWLEDGE_INVALID_INPUT'
  | 'KNOWLEDGE_PERMISSION_DENIED';

/** Structured Personal Knowledge Engine error. */
export class KnowledgeRuntimeError extends Error {
  /** Stable error code. */
  public readonly code: KnowledgeRuntimeErrorCode;

  /** Safe diagnostic details. */
  public readonly details: Readonly<Record<string, KnowledgeValue>> | undefined;

  public constructor(
    code: KnowledgeRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, KnowledgeValue>>,
  ) {
    super(message);
    this.name = 'KnowledgeRuntimeError';
    this.code = code;
    this.details = details;
  }
}

/** Public facade for connector sync, hybrid retrieval, RAG context, source transparency, and agent use. */
export class KnowledgeRuntime {
  private readonly connectors: KnowledgeConnectorRegistry;
  private readonly contextBuilder = new KnowledgeContextBuilder();
  private readonly events: EventBus<KnowledgeRuntimeEvents>;
  private readonly index: KnowledgeIndex;
  private readonly ingestion: KnowledgeIngestionPipeline;
  private readonly retrieval: KnowledgeRetrievalEngine;

  public constructor(options: KnowledgeRuntimeOptions = {}) {
    this.connectors = options.connectors ?? new KnowledgeConnectorRegistry();
    this.index = options.index ?? new KnowledgeIndex();
    const embeddings = options.embeddings ?? new LocalKnowledgeEmbeddingProvider();
    this.events = options.events ?? new EventBus<KnowledgeRuntimeEvents>();
    this.ingestion = new KnowledgeIngestionPipeline(
      this.index,
      embeddings,
      new KnowledgeDocumentNormalizer(),
      new KnowledgeChunker(),
    );
    this.retrieval = new KnowledgeRetrievalEngine(this.index, embeddings);
  }

  /** Runtime event bus for diagnostics and feature integration. */
  public eventBus(): EventBus<KnowledgeRuntimeEvents> {
    return this.events;
  }

  /** Registers a connector. */
  public async registerConnector(connector: KnowledgeConnector): Promise<void> {
    this.connectors.register(connector);
    await this.events.emit('knowledge.connectorRegistered', { connectorId: connector.metadata.id });
  }

  /** Lists connector metadata. */
  public listConnectors(): readonly KnowledgeConnectorMetadata[] {
    return this.connectors.all().map((connector) => connector.metadata);
  }

  /** Syncs one connector into the local hybrid index. */
  public async syncConnector(connectorId: string, since?: number): Promise<KnowledgeSyncResult> {
    const connector = this.connectors.get(connectorId);

    if (connector === undefined) {
      throw new KnowledgeRuntimeError('KNOWLEDGE_CONNECTOR_NOT_FOUND', 'Connector is not registered.', {
        connectorId,
      });
    }

    const result = await this.ingestion.ingest(connector, since);
    const syncResult = { ...result, connectorId };

    await this.events.emit('knowledge.connectorSynced', syncResult);

    return syncResult;
  }

  /** Syncs all registered connectors. */
  public async syncAll(sinceByConnector: Readonly<Record<string, number>> = {}): Promise<readonly KnowledgeSyncResult[]> {
    const results: KnowledgeSyncResult[] = [];

    for (const connector of this.connectors.all()) {
      results.push(await this.syncConnector(connector.metadata.id, sinceByConnector[connector.metadata.id]));
    }

    return results;
  }

  /** Searches indexed knowledge with permission-aware hybrid retrieval. */
  public async search(input: KnowledgeSearchInput): Promise<readonly KnowledgeRetrievalResult[]> {
    const query = toQuery(input);
    const results = await this.retrieval.retrieve(query);

    await this.events.emit('knowledge.retrieved', {
      query: query.text,
      resultCount: results.length,
    });

    return results;
  }

  /** Builds a source-transparent RAG context package. */
  public async buildContext(request: KnowledgeContextRequest): Promise<KnowledgeRagContext> {
    const results = await this.search(request);
    const context = this.contextBuilder.build(results, request.tokenBudget);

    await this.events.emit('knowledge.contextBuilt', {
      blockCount: context.blocks.length,
      query: request.text,
      sourceCount: context.sources.length,
      tokenCount: context.totalTokens,
    });

    return context;
  }

  /** Deletes one source and all derived chunks. */
  public async deleteSource(sourceId: string): Promise<void> {
    this.index.deleteBySourceId(sourceId);
    await this.events.emit('knowledge.documentDeleted', { sourceId });
  }

  /** Returns current local knowledge graph snapshot. */
  public graphSnapshot(): KnowledgeGraph {
    return this.index.graph();
  }

  /** Creates an agent-safe retrieval tool. */
  public createAgentTool(defaultPermissions: readonly KnowledgePermission[] = ['knowledge.read']): AgentTool {
    return {
      execute: async (request) => this.executeAgentTool(request, defaultPermissions),
      metadata: {
        availability: 'available',
        cost: 1,
        description: 'Retrieve source-grounded personal knowledge and return a compact RAG context.',
        latencyMs: 250,
        name: 'knowledge.search',
        permissions: ['knowledge.read'],
        risk: 'low',
        schema: {
          required: ['query'],
          version: 1,
        },
      },
    };
  }

  private async executeAgentTool(
    request: AgentToolRequest,
    defaultPermissions: readonly KnowledgePermission[],
  ): Promise<AgentToolResponse> {
    const input = asRecord(request.input);
    const query = readString(input, 'query') ?? readString(input, 'text');

    if (query === undefined) {
      throw new KnowledgeRuntimeError('KNOWLEDGE_INVALID_INPUT', 'Agent knowledge tool requires a query.');
    }

    const limit = readNumber(input, 'limit') ?? 5;
    const tokenBudget = readNumber(input, 'tokenBudget') ?? 1_200;
    const permissions = readKnowledgePermissions(input, defaultPermissions);
    const sourceTypes = readSourceTypes(input);
    const topics = readStringArray(input, 'topics');
    const context = await this.buildContext({
      limit,
      permissions,
      text: query,
      tokenBudget,
      ...(sourceTypes.length === 0 ? {} : { sourceTypes }),
      ...(topics.length === 0 ? {} : { topics }),
    });

    return {
      observation: {
        data: {
          blockCount: context.blocks.length,
          confidence: context.confidence,
          sourceCount: context.sources.length,
        },
        id: crypto.randomUUID(),
        source: 'knowledge.search',
        success: true,
        summary: `Retrieved ${context.blocks.length.toString()} knowledge blocks.`,
        timestamp: Date.now(),
      },
      output: serializeContext(context),
    };
  }
}

function toQuery(input: KnowledgeSearchInput): KnowledgeQuery {
  if (input.text.trim().length === 0) {
    throw new KnowledgeRuntimeError('KNOWLEDGE_INVALID_INPUT', 'Knowledge query cannot be empty.');
  }

  return {
    limit: input.limit ?? 10,
    permissions: input.permissions,
    text: input.text,
    ...(input.now === undefined ? {} : { now: input.now }),
    ...(input.sourceTypes === undefined ? {} : { sourceTypes: input.sourceTypes }),
    ...(input.topics === undefined ? {} : { topics: input.topics }),
  };
}

function asRecord(value: KnowledgeValue): Readonly<Record<string, KnowledgeValue>> {
  return isKnowledgeRecord(value) ? value : {};
}

function isKnowledgeRecord(value: KnowledgeValue): value is Readonly<Record<string, KnowledgeValue>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString(record: Readonly<Record<string, KnowledgeValue>>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readNumber(record: Readonly<Record<string, KnowledgeValue>>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readStringArray(record: Readonly<Record<string, KnowledgeValue>>, key: string): readonly string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function readKnowledgePermissions(
  record: Readonly<Record<string, KnowledgeValue>>,
  fallback: readonly KnowledgePermission[],
): readonly KnowledgePermission[] {
  const permissions = readStringArray(record, 'permissions').filter(isKnowledgePermission);
  return permissions.length === 0 ? fallback : permissions;
}

function readSourceTypes(record: Readonly<Record<string, KnowledgeValue>>): readonly KnowledgeSourceType[] {
  return readStringArray(record, 'sourceTypes').filter(isKnowledgeSourceType);
}

function isKnowledgePermission(value: string): value is KnowledgePermission {
  return ['knowledge.admin', 'knowledge.read', 'knowledge.read.confidential', 'knowledge.write'].includes(value);
}

function isKnowledgeSourceType(value: string): value is KnowledgeSourceType {
  return [
    'browser-page',
    'code-repository',
    'document',
    'email',
    'github',
    'google-drive',
    'jira',
    'local-file',
    'markdown',
    'notion',
    'pdf',
    'slack',
  ].includes(value);
}

function serializeContext(context: KnowledgeRagContext): KnowledgeValue {
  return {
    blocks: context.blocks.map((block) => ({
      chunkId: block.chunkId,
      source: serializeSource(block.source),
      text: block.text,
      tokenEstimate: block.tokenEstimate,
    })),
    confidence: context.confidence,
    sources: context.sources.map(serializeSource),
    totalTokens: context.totalTokens,
  };
}

function serializeSource(source: KnowledgeRagContext['sources'][number]): KnowledgeValue {
  return {
    chunkId: source.chunkId,
    documentId: source.documentId,
    sourceId: source.sourceId,
    title: source.title,
    uri: source.uri,
  };
}
