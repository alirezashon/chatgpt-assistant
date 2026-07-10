import { describe, expect, it } from 'vitest';

import { createMarkdownExport } from '@/features/actions/markdown-export';
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
          tags: [],
          title: 'Client [Launch] Plan',
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

describe('markdown export', () => {
  it('creates a downloadable Markdown document for selected conversations', () => {
    const result = createMarkdownExport(createWorkspaceState(), ['conversation-1'], now);

    expect(result.filename).toBe('chatgpt-workspace-client-launch-plan-2026-07-10.md');
    expect(result.conversationCount).toBe(1);
    expect(result.content).toContain('# ChatGPT Workspace Export');
    expect(result.content).toContain('Workspace: Main Workspace');
    expect(result.content).toContain('## 1. Client \\[Launch\\] Plan');
    expect(result.content).toContain('- Folder: Client Work');
    expect(result.content).toContain('- Favorite: Yes');
    expect(result.content).toContain('[Open conversation](https://chatgpt.com/c/abc123)');
  });

  it('throws when no selected conversations can be exported', () => {
    expect(() => {
      createMarkdownExport(createWorkspaceState(), ['missing'], now);
    }).toThrow('No conversations are available to export.');
  });
});
