import { APP_NAME } from '@/constants/app';
import type { Workspace } from '@/shared/types';

export interface WorkspaceEngineConfig {
  readonly eventHistoryLimit: number;
  readonly workspace: Workspace;
}

export function createDefaultWorkspaceConfig(
  now: () => Date = createCurrentDate,
): WorkspaceEngineConfig {
  const timestamp = now().toISOString();

  return {
    eventHistoryLimit: 100,
    workspace: {
      createdAt: timestamp,
      id: 'local-workspace',
      name: APP_NAME,
      updatedAt: timestamp,
    },
  };
}

function createCurrentDate(): Date {
  return new Date();
}
