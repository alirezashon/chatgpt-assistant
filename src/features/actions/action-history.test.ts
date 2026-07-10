import { describe, expect, it } from 'vitest';

import type { WorkspaceRuntimeState } from '@/app/workspace';
import { DEFAULT_ACTION_CONFIG } from '@/features/actions/action-config';
import { ActionHistory } from '@/features/actions/action-history';
import type { ActionContext, ActionDefinition } from '@/features/actions/action-types';
import type { FavoriteService } from '@/features/favorites';

const now = '2026-07-10T00:00:00.000Z';

describe('action history', () => {
  it('captures recovery snapshots for destructive actions', () => {
    const history = new ActionHistory(DEFAULT_ACTION_CONFIG);
    const action: ActionDefinition = {
      execute: () => Promise.resolve({ type: 'completed' }),
      icon: 'trash',
      id: 'delete-assignment',
      kind: 'danger',
      label: 'Delete Assignment',
      scope: 'bulk',
    };

    const entries = history.record(action, createActionContext());

    expect(entries[0]).toMatchObject({
      actionId: 'delete-assignment',
      reversible: true,
      targetIds: ['conversation-1'],
    });
    expect(entries[0]?.recovery).toMatchObject({
      actionId: 'delete-assignment',
      assignments: [
        {
          conversationId: 'conversation-1',
          folderId: 'folder-1',
        },
      ],
      conversations: [
        {
          id: 'conversation-1',
          title: 'Launch Plan',
        },
      ],
      folders: [
        {
          id: 'folder-1',
          name: 'Clients',
        },
      ],
    });
  });
});

function createActionContext(): ActionContext {
  return {
    favoriteService: {
      initialize: () => Promise.resolve(),
      isFavorite: () => false,
      listFavorites: () => Promise.resolve([]),
      setFavorite: () => Promise.resolve(),
      toggleFavorite: () => Promise.resolve(false),
    } satisfies FavoriteService,
    targetIds: ['conversation-1'],
    workspace: createWorkspaceState(),
  };
}

function createWorkspaceState(): WorkspaceRuntimeState {
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
          favorite: false,
          folderId: 'folder-1',
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
