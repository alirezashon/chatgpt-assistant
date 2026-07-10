import type { WorkspaceRuntimeState } from '@/app/workspace';

const now = '2026-07-10T00:00:00.000Z';

export function createWorkspaceState(): WorkspaceRuntimeState {
  return {
    activeConversationId: 'conversation-1',
    activeFolderId: null,
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
          title: 'Launch Plan',
          updatedAt: now,
          url: 'https://chatgpt.com/c/conversation-1',
        },
        {
          createdAt: now,
          favorite: false,
          folderId: null,
          id: 'conversation-2',
          isActive: false,
          isArchived: false,
          metadata: {
            detectedFrom: 'conversation-list',
            lastSeenAt: now,
          },
          tags: [],
          title: 'Research Notes',
          updatedAt: now,
          url: 'https://chatgpt.com/c/conversation-2',
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
          color: '#10b981',
          createdAt: now,
          icon: 'folder',
          id: 'folder-1',
          name: 'Clients',
          order: 0,
          updatedAt: now,
        },
      ],
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
