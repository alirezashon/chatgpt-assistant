import { describe, expect, it } from 'vitest';

import { ConflictResolver } from '@/app/synchronization/conflict-resolver';
import type { WorkspaceSnapshot } from '@/app/synchronization/sync-types';

const oldTime = '2026-07-10T10:00:00.000Z';
const newTime = '2026-07-10T11:00:00.000Z';

function createSnapshot(): WorkspaceSnapshot {
  return {
    assignments: {
      assignments: [
        {
          assignmentId: 'assignment-old',
          conversationId: 'conversation-1',
          createdAt: oldTime,
          folderId: 'folder-1',
          metadata: {
            source: 'manual',
          },
          updatedAt: oldTime,
        },
        {
          assignmentId: 'assignment-new',
          conversationId: 'conversation-1',
          createdAt: oldTime,
          folderId: 'folder-2',
          metadata: {
            source: 'manual',
          },
          updatedAt: newTime,
        },
      ],
      error: null,
      status: 'ready',
    },
    conversations: {
      activeConversationId: 'conversation-1',
      conversations: [
        {
          createdAt: oldTime,
          favorite: false,
          folderId: null,
          id: 'conversation-1',
          isActive: true,
          isArchived: false,
          metadata: {
            detectedFrom: 'conversation-list',
            lastSeenAt: newTime,
          },
          tags: [],
          title: 'Conversation',
          updatedAt: newTime,
          url: 'https://chatgpt.com/c/abc123',
        },
      ],
      error: null,
      status: 'ready',
    },
    createdAt: newTime,
    folders: {
      error: null,
      folders: [
        {
          color: '#0f766e',
          createdAt: oldTime,
          icon: 'briefcase',
          id: 'folder-1',
          name: 'Old Name',
          order: 0,
          updatedAt: oldTime,
        },
        {
          color: '#0284c7',
          createdAt: oldTime,
          icon: 'briefcase',
          id: 'folder-1',
          name: 'New Name',
          order: 0,
          updatedAt: newTime,
        },
        {
          color: '#0f766e',
          createdAt: oldTime,
          icon: 'folder',
          id: 'folder-2',
          name: 'Target',
          order: 1,
          updatedAt: newTime,
        },
      ],
      selectedFolderId: 'missing-folder',
      status: 'ready',
    },
    id: 'snapshot-1',
    schemaVersion: 1,
    uiPreferences: {
      expandedFolderIds: [],
      floatingButtonPosition: null,
      onboardingDismissed: true,
      recentlyUsedFolderIds: [],
      sidebarOpen: true,
      sidebarWidth: 380,
    },
    workspace: {
      activeConversationId: 'conversation-1',
      activeFolderId: null,
      assignments: {
        assignments: [],
        error: null,
        status: 'ready',
      },
      conversations: {
        activeConversationId: 'conversation-1',
        conversations: [],
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
      updatedAt: newTime,
      workspace: {
        createdAt: oldTime,
        id: 'workspace-1',
        name: 'Workspace',
        updatedAt: newTime,
      },
    },
  };
}

describe('conflict resolver', () => {
  it('keeps newest duplicate records and clears invalid selected folders', () => {
    const result = new ConflictResolver().resolve(createSnapshot());

    expect(result.conflicts.map((conflict) => conflict.code)).toEqual([
      'DUPLICATE_FOLDER',
      'DUPLICATE_ASSIGNMENT',
    ]);
    expect(result.recoveredSnapshot.folders.folders).toHaveLength(2);
    expect(result.recoveredSnapshot.folders.folders[0]).toMatchObject({
      color: '#0284c7',
      id: 'folder-1',
      name: 'New Name',
    });
    expect(result.recoveredSnapshot.assignments.assignments).toEqual([
      expect.objectContaining({
        assignmentId: 'assignment-new',
        conversationId: 'conversation-1',
        folderId: 'folder-2',
      }),
    ]);
    expect(result.recoveredSnapshot.folders.selectedFolderId).toBeNull();
  });
});
