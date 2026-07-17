import type { AIContextChunk, AIPromptMessage } from './ai-types';

/** Estimates and budgets tokens for prompts and context. */
export class AITokenManager {
  /** Estimates token count using a deterministic approximation. */
  public estimate(text: string): number {
    return Math.max(1, Math.ceil(text.trim().length / 4));
  }

  /** Estimates messages token count. */
  public estimateMessages(messages: readonly AIPromptMessage[]): number {
    return messages.reduce((sum, message) => sum + this.estimate(message.content), 0);
  }

  /** Selects highest-priority context chunks that fit within a token budget. */
  public selectContext(
    chunks: readonly AIContextChunk[],
    budgetTokens: number,
  ): readonly AIContextChunk[] {
    const selected: AIContextChunk[] = [];
    let used = 0;

    for (const chunk of [...chunks].sort((left, right) => right.priority - left.priority)) {
      const tokens = chunk.estimatedTokens ?? this.estimate(chunk.content);

      if (used + tokens > budgetTokens) {
        continue;
      }

      selected.push({
        ...chunk,
        estimatedTokens: tokens,
      });
      used += tokens;
    }

    return selected;
  }
}
