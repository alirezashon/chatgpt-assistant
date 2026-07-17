import type { KnowledgeContextBlock, KnowledgeRagContext, KnowledgeRetrievalResult } from './knowledge-types';

/** Builds transparent RAG context with deduplication, ordering, compression, and token budget. */
export class KnowledgeContextBuilder {
  /** Builds context from retrieval results. */
  public build(results: readonly KnowledgeRetrievalResult[], tokenBudget: number): KnowledgeRagContext {
    const blocks: KnowledgeContextBlock[] = [];
    const seenText = new Set<string>();
    let totalTokens = 0;

    for (const result of results) {
      const text = compress(result.chunk.text);

      if (seenText.has(text)) {
        continue;
      }

      const tokenEstimate = Math.max(1, Math.ceil(text.length / 4));

      if (totalTokens + tokenEstimate > tokenBudget) {
        continue;
      }

      seenText.add(text);
      blocks.push({
        chunkId: result.chunk.id,
        source: result.source,
        text,
        tokenEstimate,
      });
      totalTokens += tokenEstimate;
    }

    return {
      blocks,
      confidence:
        blocks.length === 0
          ? 0
          : results.slice(0, blocks.length).reduce((sum, result) => sum + result.confidence, 0) / blocks.length,
      sources: blocks.map((block) => block.source),
      totalTokens,
    };
  }
}

function compress(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}
