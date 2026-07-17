import { knowledgeCosineSimilarity } from './knowledge-embedding';
import type {
  KnowledgeDocument,
  KnowledgeEntity,
  KnowledgeGraph,
  KnowledgeIndexedChunk,
  KnowledgePermission,
  KnowledgeRelationship,
  KnowledgeSourceType,
} from './knowledge-types';

/** Hybrid in-memory index for chunks, documents, keyword, vector, metadata, and graph lookups. */
export class KnowledgeIndex {
  private readonly chunks = new Map<string, KnowledgeIndexedChunk>();
  private readonly documents = new Map<string, KnowledgeDocument>();
  private readonly sourceToDocument = new Map<string, string>();
  private readonly entities = new Map<string, KnowledgeEntity>();
  private readonly relationships = new Map<string, KnowledgeRelationship>();

  /** Upserts document chunks and graph entities. */
  public upsert(document: KnowledgeDocument, chunks: readonly KnowledgeIndexedChunk[]): void {
    this.documents.set(document.id, document);
    this.sourceToDocument.set(document.sourceId, document.id);

    for (const [chunkId, indexed] of this.chunks) {
      if (indexed.document.id === document.id) {
        this.chunks.delete(chunkId);
      }
    }

    for (const chunk of chunks) {
      this.chunks.set(chunk.chunk.id, chunk);
    }

    this.entities.set(document.id, {
      id: document.id,
      label: document.title,
      metadata: {
        sourceType: document.sourceType,
        uri: document.uri,
      },
      type: 'document',
    });

    for (const entity of document.entities) {
      const id = `entity-${hash(entity)}`;
      this.entities.set(id, {
        id,
        label: entity,
        metadata: {},
        type: inferEntityType(entity),
      });
      this.relationships.set(`${document.id}:references:${id}`, {
        confidence: 0.7,
        from: document.id,
        id: `${document.id}:references:${id}`,
        to: id,
        type: 'references',
      });
    }
  }

  /** Deletes a document and its chunks. */
  public deleteBySourceId(sourceId: string): void {
    const documentId = this.sourceToDocument.get(sourceId);

    if (documentId === undefined) {
      return;
    }

    this.documents.delete(documentId);
    this.sourceToDocument.delete(sourceId);

    for (const [chunkId, indexed] of this.chunks) {
      if (indexed.document.id === documentId) {
        this.chunks.delete(chunkId);
      }
    }

    for (const relationshipId of [...this.relationships.keys()]) {
      if (relationshipId.startsWith(`${documentId}:`)) {
        this.relationships.delete(relationshipId);
      }
    }
  }

  /** Returns all chunks. */
  public allChunks(): readonly KnowledgeIndexedChunk[] {
    return [...this.chunks.values()];
  }

  /** Keyword retrieval. */
  public keywordSearch(query: string, permissions: readonly KnowledgePermission[]): readonly KnowledgeIndexedChunk[] {
    const terms = tokenize(query);
    return this.permissionFiltered(permissions)
      .map((chunk) => ({
        chunk,
        score: keywordScore(chunk, terms),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.chunk);
  }

  /** Vector retrieval. */
  public vectorSearch(queryVector: readonly number[], permissions: readonly KnowledgePermission[]): readonly KnowledgeIndexedChunk[] {
    return this.permissionFiltered(permissions)
      .map((chunk) => ({
        chunk,
        score: knowledgeCosineSimilarity(queryVector, chunk.embedding.vector),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.chunk);
  }

  /** Metadata filtering. */
  public metadataFilter(input: {
    readonly permissions: readonly KnowledgePermission[];
    readonly sourceTypes?: readonly KnowledgeSourceType[];
    readonly topics?: readonly string[];
  }): readonly KnowledgeIndexedChunk[] {
    return this.permissionFiltered(input.permissions)
      .filter((chunk) => input.sourceTypes === undefined || input.sourceTypes.includes(chunk.document.sourceType))
      .filter((chunk) => input.topics === undefined || input.topics.some((topic) => chunk.chunk.topics.includes(topic)));
  }

  /** Graph traversal around chunk entities. */
  public graphRelated(chunks: readonly KnowledgeIndexedChunk[]): readonly KnowledgeIndexedChunk[] {
    const documentIds = new Set(chunks.map((chunk) => chunk.document.id));
    const relatedDocumentIds = new Set<string>();

    for (const relationship of this.relationships.values()) {
      if (documentIds.has(relationship.from)) {
        relatedDocumentIds.add(relationship.from);
      }
    }

    return [...this.chunks.values()].filter((chunk) => relatedDocumentIds.has(chunk.document.id));
  }

  /** Graph snapshot. */
  public graph(): KnowledgeGraph {
    return {
      entities: [...this.entities.values()],
      relationships: [...this.relationships.values()],
    };
  }

  private permissionFiltered(permissions: readonly KnowledgePermission[]): readonly KnowledgeIndexedChunk[] {
    return [...this.chunks.values()].filter((chunk) =>
      chunk.chunk.permissions.every((permission) => permissions.includes(permission)),
    );
  }
}

function keywordScore(chunk: KnowledgeIndexedChunk, terms: readonly string[]): number {
  const text = `${chunk.document.title} ${chunk.chunk.text} ${chunk.chunk.topics.join(' ')}`.toLowerCase();
  const matched = terms.filter((term) => text.includes(term)).length;
  return matched / Math.max(terms.length, 1);
}

function tokenize(query: string): readonly string[] {
  return query.toLowerCase().split(/[^a-z0-9]+/i).filter((term) => term.length > 1);
}

function hash(value: string): string {
  let result = 2_166_136_261;

  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16_777_619);
  }

  return (result >>> 0).toString(16);
}

function inferEntityType(entity: string): KnowledgeEntity['type'] {
  const lower = entity.toLowerCase();

  if (['mongodb', 'typescript', 'react', 'docker'].some((term) => lower.includes(term))) {
    return 'technology';
  }

  return 'concept';
}
