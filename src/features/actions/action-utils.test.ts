import { describe, expect, it, vi } from 'vitest';

import {
  createMarkdownLink,
  getConversationTitle,
  getConversationUrl,
  openUrlInNewTab,
} from '@/features/actions/action-utils';
import type { WorkspaceRuntimeState } from '@/app/workspace';

const now = '2026-07-07T00:00:00.000Z';

function createWorkspaceState(): WorkspaceRuntimeState {
  return {
    activeConversationId: 'conversation-1',
    activeFolderId: null,
    assignments: {
      assignments: [],
      error: null,
      status: 'ready',
    },
    conversations: {
      activeConversationId: 'conversation-1',
      conversations: [
        {
          createdAt: now,
          favorite: false,
          folderId: null,
          id: 'conversation-1',
          isActive: true,
          isArchived: false,
          metadata: {
            detectedFrom: 'conversation-list',
            lastSeenAt: now,
          },
          tags: [],
          title: 'Launch Plan',
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
      folders: [],
      selectedFolderId: null,
      status: 'ready',
    },
    lifecycle: 'ready',
    updatedAt: now,
    workspace: {
      createdAt: now,
      id: 'workspace-1',
      name: 'Workspace',
      updatedAt: now,
    },
  };
}

describe('action utils', () => {
  it('reads conversation title and URL from workspace state', () => {
    const workspace = createWorkspaceState();

    expect(getConversationTitle(workspace, 'conversation-1')).toBe('Launch Plan');
    expect(getConversationUrl(workspace, 'conversation-1')).toBe('https://chatgpt.com/c/abc123');
    expect(getConversationTitle(workspace, 'missing')).toBe('Conversation');
    expect(getConversationUrl(workspace, 'missing')).toBeNull();
  });

  it('escapes square brackets in markdown links', () => {
    expect(createMarkdownLink('Plan [Q3]', 'https://chatgpt.com/c/abc123')).toBe(
      '[Plan \\[Q3\\]](https://chatgpt.com/c/abc123)',
    );
  });

  it('opens only supported ChatGPT conversation hosts in a new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    openUrlInNewTab('https://chat.openai.com/c/abc123');

    expect(openSpy).toHaveBeenCalledWith(
      'https://chat.openai.com/c/abc123',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  });

  it('rejects non-HTTPS or non-ChatGPT URLs', () => {
    expect(() => {
      openUrlInNewTab('http://chatgpt.com/c/abc123');
    }).toThrow('Refused to open an unsupported conversation URL.');

    expect(() => {
      openUrlInNewTab('https://example.com/c/abc123');
    }).toThrow('Refused to open an unsupported conversation URL.');
  });
});
