import type { AIModelMetadata } from './ai-types';

/** Cost estimate result. */
export interface AICostEstimate {
  /** Estimated cost in USD. */
  readonly costUsd: number;
  /** Estimated input tokens. */
  readonly inputTokens: number;
  /** Estimated output tokens. */
  readonly outputTokens: number;
}

/** Tracks and estimates AI usage cost. */
export class AICostManager {
  private totalCostUsd = 0;

  /** Estimates request cost. */
  public estimate(
    model: AIModelMetadata,
    inputTokens: number,
    outputTokens: number,
  ): AICostEstimate {
    const costUsd =
      (inputTokens / 1_000_000) * model.pricing.inputPerMillion +
      (outputTokens / 1_000_000) * model.pricing.outputPerMillion;

    return {
      costUsd,
      inputTokens,
      outputTokens,
    };
  }

  /** Records realized request cost. */
  public record(costUsd: number): void {
    this.totalCostUsd += costUsd;
  }

  /** Returns total tracked cost. */
  public total(): number {
    return this.totalCostUsd;
  }
}
