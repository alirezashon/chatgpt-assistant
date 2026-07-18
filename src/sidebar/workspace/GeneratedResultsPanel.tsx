import { FileText } from 'lucide-react';

import { Panel, SectionTitle } from '@/design-system';

import type { SidebarTask } from './sidebar-workspace-types';

export function GeneratedResultsPanel({
  copy,
  task,
}: {
  readonly copy: { readonly generatedResults: string };
  readonly task: SidebarTask;
}) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={FileText} title={copy.generatedResults} />
      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)]">
        {task.results.map((result) => (
          <article
            className="rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] p-[var(--ds-space-3)]"
            key={result.id}
          >
            <div className="flex items-center justify-between gap-[var(--ds-space-3)]">
              <h2 className="text-[length:var(--ds-font-title)] font-semibold leading-[var(--ds-line-title)] text-[color:var(--ds-color-text-strong)]">
                {result.title}
              </h2>
              <span className="text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
                {result.format}
              </span>
            </div>
            <ul className="mt-[var(--ds-space-2)] grid gap-[var(--ds-space-1)]">
              {result.content.map((item) => (
                <li
                  className="text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text)]"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Panel>
  );
}
