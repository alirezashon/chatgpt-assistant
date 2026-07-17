import type { AIContextChunk, AIPromptMessage } from './ai-types';
import { AITokenManager } from './ai-token-manager';

/** Builds prompt messages with selected context while respecting context windows. */
export class AIContextBuilder {
  public constructor(private readonly tokens = new AITokenManager()) {}

  /** Injects selected context into the final user message. */
  public build(input: {
    readonly context: readonly AIContextChunk[];
    readonly maxContextTokens: number;
    readonly messages: readonly AIPromptMessage[];
  }): readonly AIPromptMessage[] {
    const selected = this.tokens.selectContext(input.context, input.maxContextTokens);
    const contextText = selected
      .map((chunk) => `<context id="${chunk.id}">\n${chunk.content}\n</context>`)
      .join('\n\n');

    if (contextText.length === 0) {
      return input.messages;
    }

    const last = input.messages[input.messages.length - 1];

    if (last?.role !== 'user') {
      return input.messages;
    }

    return [
      ...input.messages.slice(0, -1),
      {
        role: 'user',
        content: `${contextText}\n\n${last.content}`,
      },
    ];
  }
}
