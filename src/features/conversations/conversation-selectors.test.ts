import { describe, expect, it } from 'vitest';

import { ConversationMapper } from '@/features/conversations/conversation-mapper';
import { extractConversationIdFromUrl } from '@/features/conversations/conversation-utils';

describe('conversation detection fallbacks', () => {
  it('extracts GPT-scoped conversation URLs', () => {
    expect(
      extractConversationIdFromUrl(
        'https://chatgpt.com/g/g-custom/c/conversation-1',
        'https://chatgpt.com',
      ),
    ).toBe('conversation-1');
  });

  it('detects active links with newer active attributes', () => {
    const document = new DOMParser().parseFromString(
      `
        <main><h1>Current Project</h1></main>
        <nav>
          <a data-active="true" href="/c/conversation-1" aria-label="Launch Plan"></a>
          <a href="/c/conversation-2">Archive Plan</a>
        </nav>
      `,
      'text/html',
    );
    const snapshot = new ConversationMapper().createSnapshot({
      document,
      location: new URL('https://chatgpt.com/c/conversation-1') as unknown as Location,
      now: () => new Date('2026-07-10T00:00:00.000Z'),
    });

    expect(snapshot.activeConversationId).toBe('conversation-1');
    expect(snapshot.conversations).toContainEqual(
      expect.objectContaining({
        id: 'conversation-1',
        isActive: true,
        title: 'Launch Plan',
      }),
    );
  });
});
