import type { KnowledgeChunk, KnowledgeChunkingStrategy, KnowledgeDocument } from './knowledge-types';
import { stableKnowledgeHash } from './knowledge-normalizer';

/** Intelligent chunking engine with fixed, semantic, structure, code, and conversation strategies. */
export class KnowledgeChunker {
  public constructor(private readonly maxChunkTokens = 180) {}

  /** Chunks a document. */
  public chunk(document: KnowledgeDocument, strategy: KnowledgeChunkingStrategy = 'semantic'): readonly KnowledgeChunk[] {
    const units = splitDocument(document.content, strategy);
    const chunks: KnowledgeChunk[] = [];
    let buffer: string[] = [];
    let tokenCount = 0;

    const flush = (): void => {
      if (buffer.length === 0) {
        return;
      }

      const text = buffer.join('\n\n').trim();
      const index = chunks.length;
      chunks.push({
        documentId: document.id,
        entities: document.entities,
        headings: inferHeadings(text),
        id: `chunk-${stableKnowledgeHash(`${document.id}:${index.toString()}:${text}`)}`,
        index,
        metadata: document.metadata,
        modifiedAt: document.modifiedAt,
        permissions: document.permissions,
        sourceId: document.sourceId,
        text,
        tokenEstimate: estimateTokens(text),
        topics: document.topics,
      });
      buffer = [];
      tokenCount = 0;
    };

    for (const unit of units) {
      const unitTokens = estimateTokens(unit);

      if (tokenCount + unitTokens > this.maxChunkTokens) {
        flush();
      }

      buffer.push(unit);
      tokenCount += unitTokens;
    }

    flush();
    return chunks;
  }
}

function splitDocument(content: string, strategy: KnowledgeChunkingStrategy): readonly string[] {
  if (strategy === 'code-aware') {
    return content.split(/\n(?=(?:export|function|class|interface|type)\s)/g).filter(Boolean);
  }

  if (strategy === 'conversation') {
    return content.split(/\n(?=[A-Za-z][^:\n]{0,40}:)/g).filter(Boolean);
  }

  if (strategy === 'document-structure' || strategy === 'semantic') {
    return content.split(/\n{2,}|(?=^#{1,6}\s)/gm).filter((part) => part.trim().length > 0);
  }

  return content.match(/.{1,720}(?:\s|$)/gs)?.map((part) => part.trim()).filter(Boolean) ?? [content];
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function inferHeadings(text: string): readonly string[] {
  return text
    .split('\n')
    .filter((line) => /^#{1,6}\s/.test(line))
    .map((line) => line.replace(/^#{1,6}\s/, '').trim());
}
