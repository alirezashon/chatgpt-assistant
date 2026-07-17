import { KnowledgeChunker } from './knowledge-chunking';
import type { KnowledgeEmbeddingProvider } from './knowledge-embedding';
import type { KnowledgeIndex } from './knowledge-index';
import { KnowledgeDocumentNormalizer } from './knowledge-normalizer';
import type { KnowledgeConnector, KnowledgeIndexedChunk, KnowledgeSourceRecord } from './knowledge-types';

/** Ingestion result. */
export interface KnowledgeIngestionResult {
  /** Indexed document count. */
  readonly documents: number;
  /** Indexed chunk count. */
  readonly chunks: number;
  /** Deleted document count. */
  readonly deleted: number;
}

/** Fetch/validate/extract/normalize/chunk/enrich/embed/index pipeline. */
export class KnowledgeIngestionPipeline {
  public constructor(
    private readonly index: KnowledgeIndex,
    private readonly embeddings: KnowledgeEmbeddingProvider,
    private readonly normalizer = new KnowledgeDocumentNormalizer(),
    private readonly chunker = new KnowledgeChunker(),
  ) {}

  /** Ingests records from one connector. */
  public async ingest(connector: KnowledgeConnector, since?: number): Promise<KnowledgeIngestionResult> {
    const records = await connector.fetch(since);
    let documents = 0;
    let chunks = 0;
    let deleted = 0;

    for (const record of records) {
      if (record.deleted === true) {
        this.index.deleteBySourceId(record.id);
        deleted += 1;
        continue;
      }

      if (!isValidRecord(record)) {
        continue;
      }

      const document = this.normalizer.normalize(record, connector.metadata.authority);
      const documentChunks = this.chunker.chunk(document, chooseChunkStrategy(record));
      const indexedChunks: KnowledgeIndexedChunk[] = [];

      for (const chunk of documentChunks) {
        indexedChunks.push({
          chunk,
          document,
          embedding: await this.embeddings.embed(`${document.title}\n${chunk.text}`),
        });
      }

      this.index.upsert(document, indexedChunks);
      documents += 1;
      chunks += indexedChunks.length;
    }

    return { chunks, deleted, documents };
  }
}

function isValidRecord(record: KnowledgeSourceRecord): boolean {
  return record.id.trim().length > 0 && record.content.trim().length > 0 && record.title.trim().length > 0;
}

function chooseChunkStrategy(record: KnowledgeSourceRecord) {
  if (record.sourceType === 'code-repository') {
    return 'code-aware' as const;
  }

  if (record.sourceType === 'email' || record.sourceType === 'slack') {
    return 'conversation' as const;
  }

  if (record.sourceType === 'markdown' || record.sourceType === 'document' || record.sourceType === 'pdf') {
    return 'document-structure' as const;
  }

  return 'semantic' as const;
}
