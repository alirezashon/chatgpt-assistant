import type { AIContextChunk } from './ai-types';
import { AITokenManager } from './ai-token-manager';

/** Manages context window, compression, memory, knowledge, and tool-result injection. */
export class AIContextManager {
  public constructor(private readonly tokens = new AITokenManager()) {}

  /** Builds a context pack under token budget. */
  public prepare(input: {
    readonly baseContext?: readonly AIContextChunk[];
    readonly knowledge?: readonly AIContextChunk[];
    readonly memory?: readonly AIContextChunk[];
    readonly tokenBudget: number;
    readonly toolResults?: readonly AIContextChunk[];
  }): readonly AIContextChunk[] {
    const chunks = [
      ...(input.memory ?? []),
      ...(input.knowledge ?? []),
      ...(input.toolResults ?? []),
      ...(input.baseContext ?? []),
    ].map((chunk) => ({
      ...chunk,
      content: compress(chunk.content),
      estimatedTokens: chunk.estimatedTokens ?? this.tokens.estimate(chunk.content),
    }));

    return this.tokens.selectContext(chunks, input.tokenBudget);
  }
}

function compress(content: string): string {
  return content.replaceAll(/\s+/g, ' ').trim();
}
