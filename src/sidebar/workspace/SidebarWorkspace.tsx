import { useEffect, useMemo, useState } from 'react';

import { SurfaceRoot } from '@/design-system';

import { ArtifactPanel } from './ArtifactPanel';
import { ConversationProgressPanel } from './ConversationProgressPanel';
import { CurrentContextPanel } from './CurrentContextPanel';
import { FollowUpPanel } from './FollowUpPanel';
import { GeneratedResultsPanel } from './GeneratedResultsPanel';
import { loadSidebarWorkspace } from './sidebar-workspace-storage';
import type { SidebarWorkspaceState } from './sidebar-workspace-types';
import { StatusBar } from './StatusBar';
import { TaskHeader } from './TaskHeader';
import { TaskHistoryPanel } from './TaskHistoryPanel';

export function SidebarWorkspace() {
  const [workspace, setWorkspace] = useState<SidebarWorkspaceState | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadSidebarWorkspace().then((loaded) => {
      if (!cancelled) {
        setWorkspace(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTask = useMemo(() => {
    if (workspace === null) {
      return null;
    }

    return workspace.tasks.find((task) => task.id === workspace.activeTaskId) ?? workspace.tasks[0] ?? null;
  }, [workspace]);

  if (workspace === null || activeTask === null) {
    return <LoadingWorkspace />;
  }

  return (
    <SurfaceRoot size="sidebar">
      <div className="flex min-h-screen flex-col">
        <TaskHeader task={activeTask} />
        <div className="grid flex-1 gap-[var(--ds-space-3)] p-[var(--ds-space-4)]">
          <CurrentContextPanel task={activeTask} />
          <div className="grid gap-[var(--ds-space-3)] xl:grid-cols-[1.05fr_0.95fr]">
            <ConversationProgressPanel task={activeTask} />
            <GeneratedResultsPanel task={activeTask} />
          </div>
          <ArtifactPanel task={activeTask} />
          <FollowUpPanel task={activeTask} />
          <TaskHistoryPanel
            activeTaskId={activeTask.id}
            tasks={workspace.tasks}
            onSelectTask={(taskId) => {
              setWorkspace({
                ...workspace,
                activeTaskId: taskId,
              });
            }}
          />
        </div>
        <StatusBar task={activeTask} />
      </div>
    </SurfaceRoot>
  );
}

function LoadingWorkspace() {
  return (
    <SurfaceRoot size="sidebar">
      <div className="grid min-h-screen place-items-center p-[var(--ds-space-4)]">
        <div className="rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-panel)] px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text-muted)]">
          Loading task workspace...
        </div>
      </div>
    </SurfaceRoot>
  );
}
