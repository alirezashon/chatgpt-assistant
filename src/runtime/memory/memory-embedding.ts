import type { MemoryEmbedding } from './memory-types';

/** Embedding provider boundary for local/private/vector DB backends. */
export interface MemoryEmbeddingProvider {
  /** Embeds text. */
  embed(text: string): Promise<MemoryEmbedding>;
}

/** Deterministic local embedding provider for offline/private retrieval. */
export class LocalMemoryEmbeddingProvider implements MemoryEmbeddingProvider {
  public constructor(private readonly dimensions = 32) {}

  /** Embeds text into a normalized hashing vector. */
  public embed(text: string): Promise<MemoryEmbedding> {
    const vector = new Array<number>(this.dimensions).fill(0);

    for (const token of tokenize(text)) {
      const index = hash(token) % this.dimensions;
      vector[index] = (vector[index] ?? 0) + 1;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;

    return Promise.resolve({
      model: `local-hash-${this.dimensions.toString()}`,
      vector: vector.map((value) => value / magnitude),
    });
  }
}

/** Computes cosine similarity. */
export function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
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
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1);
}

function hash(value: string): number {
  let result = 2_166_136_261;

  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16_777_619);
  }

  return result >>> 0;
}
