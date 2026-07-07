import { DEFAULT_SETTINGS } from '@/constants/settings';
import type { AppError } from '@/shared/errors';
import type { Workspace, WorkspaceSettings } from '@/shared/types';
import { createStore } from '@/state/store';

export type ExtensionStatus = 'error' | 'idle' | 'initializing' | 'ready';

export interface ExtensionState {
  readonly activeWorkspace: Workspace | null;
  readonly lastError: AppError | null;
  readonly settings: WorkspaceSettings;
  readonly status: ExtensionStatus;
}

export const initialExtensionState: ExtensionState = {
  activeWorkspace: null,
  lastError: null,
  settings: DEFAULT_SETTINGS,
  status: 'idle',
};

export const extensionStore = createStore<ExtensionState>(initialExtensionState);
