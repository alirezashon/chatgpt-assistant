import { cosineSimilarity, type MemoryEmbeddingProvider } from './memory-embedding';
import { isExpired } from './memory-store';
import type {
  MemoryItem,
  MemoryQuery,
  MemoryRetrievalResult,
  MemoryRelationship,
} from './memory-types';

/** Retrieves memories using keyword, vector, graph, recency, confidence, and importance signals. */
export class MemoryRetrievalEngine {
  public constructor(private readonly embeddings: MemoryEmbeddingProvider) {}

  /** Retrieves ranked memories. */
  public async retrieve(input: {
    readonly items: readonly MemoryItem[];
    readonly relationships: readonly MemoryRelationship[];
    readonly query: MemoryQuery;
  }): Promise<readonly MemoryRetrievalResult[]> {
    const queryEmbedding = await this.embeddings.embed(input.query.text);
    const now = input.query.now ?? Date.now();

    return input.items
      .filter((item) => item.approval === 'approved')
      .filter((item) => !isExpired(item, now))
      .filter((item) => input.query.types === undefined || input.query.types.includes(item.type))
      .filter(
        (item) =>
          input.query.tags === undefined || input.query.tags.some((tag) => item.tags.includes(tag)),
      )
      .filter((item) =>
        item.permissions.every((permission) => input.query.permissions.includes(permission)),
      )
      .map((item) =>
        scoreMemory(item, queryEmbedding.vector, input.relationships, input.query.text, now),
      )
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, input.query.limit);
  }
}

function scoreMemory(
  item: MemoryItem,
  queryVector: readonly number[],
  relationships: readonly MemoryRelationship[],
  query: string,
  now: number,
): MemoryRetrievalResult {
  const keyword = keywordScore(item, query);
  const vector =
    item.embedding === undefined ? 0 : cosineSimilarity(queryVector, item.embedding.vector);
  const graph = relationships.some(
    (relationship) => relationship.from === item.id || relationship.to === item.id,
  )
    ? 0.08
    : 0;
  const ageDays = Math.max(0, (now - item.updatedAt) / 86_400_000);
  const recency = Math.max(0, 1 - ageDays * item.expiration.decayPerDay);
  const score =
    keyword * 0.28 +
    vector * 0.32 +
    graph +
    recency * 0.12 +
    item.importance.score * 0.16 +
    item.confidence.score * 0.12;

  return {
    item,
    reasons: [
      `keyword=${keyword.toFixed(2)}`,
      `semantic=${vector.toFixed(2)}`,
      `importance=${item.importance.score.toFixed(2)}`,
      `confidence=${item.confidence.score.toFixed(2)}`,
    ],
    score,
  };
}

function keywordScore(item: MemoryItem, query: string): number {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 1);
  const text = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
  const matched = terms.filter((term) => text.includes(term)).length;
  return matched / Math.max(terms.length, 1);
}
