import { Activity } from 'lucide-react';

import { Badge, Panel, StatusIndicator } from '@/design-system';

import type { SidebarTask } from './sidebar-workspace-types';

export function StatusBar({
  copy,
  task,
}: {
  readonly copy: {
    readonly artifacts: string;
    readonly followUps: string;
    readonly workspaceAttached: string;
  };
  readonly task: SidebarTask;
}) {
  return (
    <Panel className="rounded-none border-x-0 border-b-0 px-[var(--ds-space-4)] py-[var(--ds-space-2)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-3)]">
        <div className="flex items-center gap-[var(--ds-space-2)] text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
          <Activity className="h-[var(--ds-icon-sm)] w-[var(--ds-icon-sm)]" />
          <StatusIndicator
            intent={task.status === 'completed' ? 'success' : 'info'}
            label={copy.workspaceAttached}
          />
        </div>
        <div className="flex items-center gap-[var(--ds-space-2)]">
          <Badge>
            {task.artifacts.length.toString()} {copy.artifacts}
          </Badge>
          <Badge>
            {task.followUps.length.toString()} {copy.followUps}
          </Badge>
        </div>
      </div>
    </Panel>
  );
}
