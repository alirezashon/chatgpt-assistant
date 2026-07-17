import type { KnowledgeEmbedding } from './knowledge-types';

/** Embedding provider abstraction for local and cloud embeddings. */
export interface KnowledgeEmbeddingProvider {
  /** Provider model id. */
  readonly model: string;
  /** Provider version. */
  readonly version: string;
  /** Embeds text. */
  embed(text: string): Promise<KnowledgeEmbedding>;
}

/** Deterministic local embedding provider for private/offline indexing. */
export class LocalKnowledgeEmbeddingProvider implements KnowledgeEmbeddingProvider {
  public readonly model = 'local-hash';
  public readonly version = '1';

  public constructor(private readonly dimensions = 48) {}

  /** Embeds text into a normalized hashing vector. */
  public embed(text: string): Promise<KnowledgeEmbedding> {
    const vector = new Array<number>(this.dimensions).fill(0);

    for (const token of tokenize(text)) {
      const index = hash(token) % this.dimensions;
      vector[index] = (vector[index] ?? 0) + 1;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;

    return Promise.resolve({
      model: this.model,
      vector: vector.map((value) => value / magnitude),
      version: this.version,
    });
  }
}

/** Cosine similarity. */
export function knowledgeCosineSimilarity(left: readonly number[], right: readonly number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

function tokenize(text: string): readonly string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/i).filter((token) => token.length > 1);
}

function hash(value: string): number {
  let result = 2_166_136_261;

  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16_777_619);
  }

  return result >>> 0;
}
