import { History } from 'lucide-react';

import { Button, Panel, SectionTitle } from '@/design-system';

import type { SidebarTask } from './sidebar-workspace-types';

export function TaskHistoryPanel({
  activeTaskId,
  onSelectTask,
  tasks,
}: {
  readonly activeTaskId: string;
  readonly onSelectTask: (taskId: string) => void;
  readonly tasks: readonly SidebarTask[];
}) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={History} title="Task history" />
      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)]">
        {tasks.slice(0, 5).map((task) => (
          <button
            className="grid grid-cols-[1fr_auto] items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] p-[var(--ds-space-2)] text-left transition hover:bg-[var(--ds-color-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ds-color-focus)]"
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
                {task.durationSec.toString()} sec - {task.status} - {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </span>
            <span className="text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-accent)]">
              {task.id === activeTaskId ? 'Open' : 'Open Again'}
            </span>
          </button>
        ))}
      </div>
      <Button className="mt-[var(--ds-space-3)] w-full" size="sm">
        Repeat Current Task
      </Button>
    </Panel>
  );
}
