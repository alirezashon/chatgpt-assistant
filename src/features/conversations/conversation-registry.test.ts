import { describe, expect, it } from 'vitest';

import { ConversationRegistry } from '@/features/conversations/conversation-registry';
import type { ConversationCandidate } from '@/features/conversations/conversation-types';

function createCandidate(title: string, capturedAt: string): ConversationCandidate {
  return {
    id: 'conversation-1',
    isActive: true,
    metadata: {
      detectedFrom: 'conversation-list',
      lastSeenAt: capturedAt,
    },
    title,
    url: 'https://chatgpt.com/c/abc123',
  };
}

describe('conversation registry', () => {
  it('preserves local rename overrides when provider titles are detected again', () => {
    const registry = new ConversationRegistry();

    registry.applyCandidates(
      [createCandidate('Provider Title', '2026-07-10T10:00:00.000Z')],
      'conversation-1',
      '2026-07-10T10:00:00.000Z',
      false,
    );

    const conversation = registry.getById('conversation-1');

    if (conversation === undefined) {
      throw new Error('Expected seeded conversation.');
    }

    registry.replaceConversation({
      ...conversation,
      metadata: {
        ...conversation.metadata,
        localTitle: 'Local Client Title',
        providerTitle: conversation.title,
        titleSource: 'local',
      },
      title: 'Local Client Title',
    });

    registry.applyCandidates(
      [createCandidate('Provider Renamed Title', '2026-07-10T11:00:00.000Z')],
      'conversation-1',
      '2026-07-10T11:00:00.000Z',
      false,
    );

    expect(registry.getById('conversation-1')).toMatchObject({
      metadata: {
        localTitle: 'Local Client Title',
        providerTitle: 'Provider Renamed Title',
        titleSource: 'local',
      },
      title: 'Local Client Title',
    });
  });
});
