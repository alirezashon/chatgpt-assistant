import { History } from 'lucide-react';

import { Button, Panel, SectionTitle } from '@/design-system';
import type { AppLocale } from '@/i18n';

import type { SidebarTask, SidebarTaskStatus } from './sidebar-workspace-types';

export function TaskHistoryPanel({
  activeTaskId,
  copy,
  locale,
  onRepeatTask,
  onSelectTask,
  tasks,
}: {
  readonly activeTaskId: string;
  readonly copy: {
    readonly open: string;
    readonly openAgain: string;
    readonly repeatCurrentTask: string;
    readonly completed: string;
    readonly failed: string;
    readonly running: string;
    readonly seconds: string;
    readonly taskHistory: string;
    readonly waiting: string;
  };
  readonly locale: AppLocale;
  readonly onRepeatTask: () => void;
  readonly onSelectTask: (taskId: string) => void;
  readonly tasks: readonly SidebarTask[];
}) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={History} title={copy.taskHistory} />
      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)]">
        {tasks.slice(0, 5).map((task) => (
          <button
            className="grid grid-cols-[1fr_auto] items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] p-[var(--ds-space-2)] text-start transition hover:bg-[var(--ds-color-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ds-color-focus)]"
            key={task.id}
            type="button"
            onClick={() => {
              onSelectTask(task.id);
            }}
          >
            <span className="min-w-0">
              <span className="block truncate text-[length:var(--ds-font-body)] font-medium leading-[var(--ds-line-body)] text-[color:var(--ds-color-text)]">
                {task.historyLabel}
              </span>
              <span className="block text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
                {task.durationSec.toString()} {copy.seconds} - {statusLabel(task.status, copy)} -{' '}
                {new Date(task.createdAt).toLocaleDateString(locale === 'fa' ? 'fa-IR' : undefined)}
              </span>
            </span>
            <span className="text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-accent)]">
              {task.id === activeTaskId ? copy.open : copy.openAgain}
            </span>
          </button>
        ))}
      </div>
      <Button className="mt-[var(--ds-space-3)] w-full" size="sm" onClick={onRepeatTask}>
        {copy.repeatCurrentTask}
      </Button>
    </Panel>
  );
}

function statusLabel(
  status: SidebarTaskStatus,
  copy: Pick<
    Parameters<typeof TaskHistoryPanel>[0]['copy'],
    'completed' | 'failed' | 'running' | 'waiting'
  >,
): string {
  return copy[status];
}
