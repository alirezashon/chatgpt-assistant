import type { AITextChunk } from '@/features/ai/ai-types';
import { createAIId } from '@/features/ai/ai-utils';
import type { EntityId } from '@/shared/types';

export interface AIChunkingOptions {
  readonly chunkSize: number;
  readonly overlap: number;
}

export interface AIChunkingStrategy {
  chunkText(
    sourceId: EntityId,
    content: string,
    metadata?: Readonly<Record<string, unknown>>,
  ): readonly AITextChunk[];
}

export class FixedWindowChunkingStrategy implements AIChunkingStrategy {
  private readonly options: AIChunkingOptions;

  public constructor(options: AIChunkingOptions = { chunkSize: 1200, overlap: 160 }) {
    this.options = options;
  }

  public chunkText(
    sourceId: EntityId,
    content: string,
    metadata: Readonly<Record<string, unknown>> = {},
  ): readonly AITextChunk[] {
    const normalizedContent = content.trim();

    if (normalizedContent.length === 0) {
      return [];
    }

    const chunks: AITextChunk[] = [];
    const step = Math.max(1, this.options.chunkSize - this.options.overlap);

    for (let startOffset = 0; startOffset < normalizedContent.length; startOffset += step) {
      const endOffset = Math.min(startOffset + this.options.chunkSize, normalizedContent.length);

      chunks.push({
        content: normalizedContent.slice(startOffset, endOffset),
        endOffset,
        id: createAIId('ai-chunk'),
        index: chunks.length,
        metadata,
        sourceId,
        startOffset,
      });

      if (endOffset === normalizedContent.length) {
        break;
      }
    }

    return chunks;
  }
}
