import { describe, expect, it } from 'vitest';

import { createAISummaryTeaser } from '@/features/ai/ai-summary-teaser';
import { createWorkspaceState } from '@/test/workspace-fixtures';

describe('AI summary teaser', () => {
  it('creates a local preview without pretending to summarize message content', () => {
    const teaser = createAISummaryTeaser(createWorkspaceState(), 'conversation-1');

    expect(teaser).toMatchObject({
      conversationId: 'conversation-1',
      title: 'Launch Plan',
    });
    expect(teaser.localSignals).toContain('Folder: Clients');
    expect(teaser.copiedText).toContain('AI Summary Preview: Launch Plan');
    expect(teaser.copiedText).toContain('Pro AI summaries can turn this ChatGPT thread');
  });
});
