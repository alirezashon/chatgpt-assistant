import { knowledgeCosineSimilarity } from './knowledge-embedding';
import type { KnowledgeIndexedChunk, KnowledgeQuery, KnowledgeRetrievalResult } from './knowledge-types';

/** Ranks hybrid retrieval candidates using semantic similarity, freshness, authority, relevance, confidence, and quality. */
export class KnowledgeRankingEngine {
  /** Ranks unique chunks. */
  public rank(input: {
    readonly candidates: readonly KnowledgeIndexedChunk[];
    readonly query: KnowledgeQuery;
    readonly queryVector: readonly number[];
    readonly usageByDocument: Readonly<Record<string, number>>;
  }): readonly KnowledgeRetrievalResult[] {
    const unique = new Map<string, KnowledgeIndexedChunk>();

    for (const candidate of input.candidates) {
      unique.set(candidate.chunk.id, candidate);
    }

    return [...unique.values()]
      .map((candidate) => this.score(candidate, input.query, input.queryVector, input.usageByDocument))
      .sort((left, right) => right.score - left.score)
      .slice(0, input.query.limit);
  }

  private score(
    candidate: KnowledgeIndexedChunk,
    query: KnowledgeQuery,
    queryVector: readonly number[],
    usageByDocument: Readonly<Record<string, number>>,
  ): KnowledgeRetrievalResult {
    const semantic = knowledgeCosineSimilarity(queryVector, candidate.embedding.vector);
    const keyword = keywordScore(candidate, query.text);
    const freshness = freshnessScore(candidate.document.modifiedAt, query.now ?? Date.now());
    const authority = candidate.document.authority;
    const usage = Math.min(1, (usageByDocument[candidate.document.id] ?? 0) / 5);
    const quality = candidate.document.quality === 'high' ? 1 : candidate.document.quality === 'medium' ? 0.65 : 0.35;
    const score =
      semantic * 0.32 +
      keyword * 0.24 +
      freshness * 0.12 +
      authority * 0.14 +
      usage * 0.06 +
      quality * 0.12;

    return {
      chunk: candidate.chunk,
      confidence: Math.min(0.99, score),
      document: candidate.document,
      reasons: [
        `semantic=${semantic.toFixed(2)}`,
        `keyword=${keyword.toFixed(2)}`,
        `freshness=${freshness.toFixed(2)}`,
        `authority=${authority.toFixed(2)}`,
        `quality=${quality.toFixed(2)}`,
      ],
      score,
      source: {
        chunkId: candidate.chunk.id,
        documentId: candidate.document.id,
        sourceId: candidate.document.sourceId,
        title: candidate.document.title,
        uri: candidate.document.uri,
      },
    };
  }
}

function keywordScore(candidate: KnowledgeIndexedChunk, query: string): number {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/i).filter((term) => term.length > 1);
  const text = `${candidate.document.title} ${candidate.chunk.text} ${candidate.chunk.topics.join(' ')}`.toLowerCase();
  const matched = terms.filter((term) => text.includes(term)).length;
  return matched / Math.max(terms.length, 1);
}

function freshnessScore(modifiedAt: number, now: number): number {
  const days = Math.max(0, (now - modifiedAt) / 86_400_000);
  return Math.max(0, 1 - days / 365);
}
