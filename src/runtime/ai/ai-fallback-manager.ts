import type { AIModelMetadata } from './ai-types';

/** Chooses fallback models after provider/model failures. */
export class AIFallbackManager {
  /** Returns fallback models excluding the failed model. */
  public getFallbacks(
    model: AIModelMetadata,
    candidates: readonly AIModelMetadata[],
  ): readonly AIModelMetadata[] {
    return candidates
      .filter((candidate) => candidate.id !== model.id)
      .sort(
        (left, right) =>
          right.quality - left.quality ||
          left.latencyMs - right.latencyMs ||
          left.id.localeCompare(right.id),
      );
  }
}
