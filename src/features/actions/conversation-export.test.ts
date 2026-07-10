import { describe, expect, it } from 'vitest';

import { createConversationExport } from '@/features/actions/conversation-export';
import type { WorkspaceRuntimeState } from '@/app/workspace';

const now = '2026-07-10T00:00:00.000Z';

function createWorkspaceState(): WorkspaceRuntimeState {
  return {
    activeConversationId: 'conversation-1',
    activeFolderId: 'folder-1',
    assignments: {
      assignments: [
        {
          assignmentId: 'assignment-1',
          conversationId: 'conversation-1',
          createdAt: now,
          folderId: 'folder-1',
          metadata: {
            source: 'manual',
          },
          updatedAt: now,
        },
      ],
      error: null,
      status: 'ready',
    },
    conversations: {
      activeConversationId: 'conversation-1',
      conversations: [
        {
          createdAt: now,
          favorite: true,
          folderId: 'folder-1',
          id: 'conversation-1',
          isActive: true,
          isArchived: false,
          metadata: {
            detectedFrom: 'conversation-list',
            lastSeenAt: now,
          },
          tags: ['tag-1'],
          title: 'Client <Launch> Plan',
          updatedAt: now,
          url: 'https://chatgpt.com/c/abc123',
        },
      ],
      error: null,
      status: 'ready',
    },
    error: null,
    folders: {
      error: null,
      folders: [
        {
          color: '#0f766e',
          createdAt: now,
          icon: 'briefcase',
          id: 'folder-1',
          name: 'Client Work',
          order: 0,
          updatedAt: now,
        },
      ],
      selectedFolderId: 'folder-1',
      status: 'ready',
    },
    lifecycle: 'ready',
    updatedAt: now,
    workspace: {
      createdAt: now,
      id: 'workspace-1',
      name: 'Main Workspace',
      updatedAt: now,
    },
  };
}

describe('conversation export providers', () => {
  it('creates JSON exports', () => {
    const result = createConversationExport(
      createWorkspaceState(),
      ['conversation-1'],
      'json',
      now,
    );
    const parsed = JSON.parse(getTextContent(result.content)) as {
      readonly conversations: readonly {
        readonly tags: readonly string[];
        readonly title: string;
      }[];
    };

    expect(result.filename).toBe('chatgpt-workspace-client-launch-plan-2026-07-10.json');
    expect(result.mimeType).toBe('application/json;charset=utf-8');
    expect(parsed.conversations[0]?.title).toBe('Client <Launch> Plan');
    expect(parsed.conversations[0]?.tags).toEqual(['tag-1']);
  });

  it('creates escaped HTML exports', () => {
    const result = createConversationExport(
      createWorkspaceState(),
      ['conversation-1'],
      'html',
      now,
    );

    expect(result.filename).toBe('chatgpt-workspace-client-launch-plan-2026-07-10.html');
    expect(getTextContent(result.content)).toContain('Client &lt;Launch&gt; Plan');
    expect(getTextContent(result.content)).toContain('tag-1');
  });

  it('creates simple PDF exports', () => {
    const result = createConversationExport(createWorkspaceState(), ['conversation-1'], 'pdf', now);

    expect(result.filename).toBe('chatgpt-workspace-client-launch-plan-2026-07-10.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(getTextContent(result.content)).toContain('%PDF-1.4');
  });
});

function getTextContent(content: BlobPart): string {
  if (typeof content === 'string') {
    return content;
  }

  if (content instanceof ArrayBuffer) {
    return new TextDecoder().decode(content);
  }

  if (ArrayBuffer.isView(content)) {
    return new TextDecoder().decode(content);
  }

  throw new Error('Expected text export content.');
}
