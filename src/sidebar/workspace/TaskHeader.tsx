import { ArrowLeft, Square, X, type LucideIcon } from 'lucide-react';

import { Badge, Button, Panel, StatusIndicator } from '@/design-system';

import type { SidebarTask, SidebarTaskStatus } from './sidebar-workspace-types';

interface SidebarCopy {
  readonly backToPage: string;
  readonly cancel: string;
  readonly completed: string;
  readonly failed: string;
  readonly running: string;
  readonly seconds: string;
  readonly waiting: string;
}

export function TaskHeader({
  backIcon: BackIcon = ArrowLeft,
  copy,
  onBackToPage,
  onCancelTask,
  task,
}: {
  readonly backIcon?: LucideIcon;
  readonly copy: SidebarCopy;
  readonly onBackToPage: () => void;
  readonly onCancelTask: () => void;
  readonly task: SidebarTask;
}) {
  return (
    <Panel className="sticky top-0 z-10 rounded-none border-x-0 border-t-0 bg-[var(--ds-color-surface)] px-[var(--ds-space-4)] py-[var(--ds-space-3)] backdrop-blur-[var(--ds-blur-panel)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-3)]">
        <div className="flex min-w-0 items-center gap-[var(--ds-space-3)]">
          <div className="grid h-[var(--ds-icon-hero)] w-[var(--ds-icon-hero)] shrink-0 place-items-center rounded-[var(--ds-radius-lg)] bg-[var(--ds-color-primary)] text-[color:var(--ds-color-text-inverse)]">
            <Square className="h-[var(--ds-icon-lg)] w-[var(--ds-icon-lg)]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[length:var(--ds-font-heading)] font-semibold leading-[var(--ds-line-heading)] tracking-normal text-[color:var(--ds-color-text-strong)]">
              {task.title}
            </h1>
            <div className="mt-[var(--ds-space-1)] flex items-center gap-[var(--ds-space-2)] text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
              <StatusIndicator
                intent={statusIntent(task.status)}
                label={statusLabel(task.status, copy)}
              />
              <span>
                {task.durationSec.toString()} {copy.seconds}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[var(--ds-space-2)]">
          <Button icon={BackIcon} size="sm" variant="secondary" onClick={onBackToPage}>
            {copy.backToPage}
          </Button>
          <Badge>{statusLabel(task.status, copy)}</Badge>
          {task.status === 'running' || task.status === 'waiting' ? (
            <Button icon={X} size="sm" variant="secondary" onClick={onCancelTask}>
              {copy.cancel}
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function statusLabel(status: SidebarTaskStatus, copy: SidebarCopy): string {
  return copy[status];
}

function statusIntent(status: SidebarTaskStatus) {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'failed') {
    return 'danger';
  }

  if (status === 'waiting') {
    return 'warning';
  }

  return 'info';
}
