import { STORAGE_SCHEMA_VERSION } from '@/constants/storage';
import { assignmentStore } from '@/features/assignments';
import { conversationStore } from '@/features/conversations';
import { folderStore } from '@/features/folders';
import { workspaceStore } from '@/app/workspace/workspace-state';
import { DEFAULT_UI_PREFERENCES } from '@/app/synchronization/sync-config';
import type { UiPreferences, WorkspaceSnapshot } from '@/app/synchronization/sync-types';

export function createWorkspaceSnapshot(
  uiPreferences: UiPreferences = DEFAULT_UI_PREFERENCES,
): WorkspaceSnapshot {
  return {
    assignments: assignmentStore.getState(),
    conversations: conversationStore.getState(),
    createdAt: new Date().toISOString(),
    folders: folderStore.getState(),
    id: crypto.randomUUID(),
    schemaVersion: STORAGE_SCHEMA_VERSION,
    uiPreferences,
    workspace: workspaceStore.getState(),
  };
}

export function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['schemaVersion'] === 'number' &&
    typeof candidate['assignments'] === 'object' &&
    typeof candidate['folders'] === 'object' &&
    typeof candidate['workspace'] === 'object'
  );
}
