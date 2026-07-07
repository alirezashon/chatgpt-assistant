import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { getWorkspaceEngine } from '@/app/workspace/workspace-initializer';
import { workspaceStore } from '@/app/workspace/workspace-state';
import type {
  WorkspaceCommandMap,
  WorkspaceCommandName,
  WorkspaceRuntimeState,
} from '@/app/workspace/workspace-types';
import type { WorkspaceEventListener, WorkspaceEventName } from '@/app/workspace/workspace-events';

export function useWorkspaceState(): WorkspaceRuntimeState {
  return useSyncExternalStore(
    (listener) => workspaceStore.subscribe(listener),
    () => workspaceStore.getState(),
    () => workspaceStore.getState(),
  );
}

export interface WorkspaceActions {
  readonly execute: <CommandName extends WorkspaceCommandName>(
    commandName: CommandName,
    payload: WorkspaceCommandMap[CommandName],
  ) => Promise<void>;
}

export function useWorkspaceActions(): WorkspaceActions {
  const execute = useCallback(
    async <CommandName extends WorkspaceCommandName>(
      commandName: CommandName,
      payload: WorkspaceCommandMap[CommandName],
    ) => {
      await getWorkspaceEngine().execute(commandName, payload);
    },
    [],
  );

  return useMemo(
    () => ({
      execute,
    }),
    [execute],
  );
}

export function useWorkspaceEvent<EventName extends WorkspaceEventName>(
  eventName: EventName,
  listener: WorkspaceEventListener<EventName>,
): void {
  useEffect(() => getWorkspaceEngine().subscribe(eventName, listener), [eventName, listener]);
}
