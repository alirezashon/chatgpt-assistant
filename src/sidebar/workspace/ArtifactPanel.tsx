import { Copy, Download, FileText, Pin, Save } from 'lucide-react';

import { Button, IconButton, Panel, SectionTitle } from '@/design-system';

import type { SidebarTask } from './sidebar-workspace-types';

export function ArtifactPanel({ task }: { readonly task: SidebarTask }) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={FileText} title="Artifacts" />
      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)]">
        {task.artifacts.map((artifact) => (
          <div
            className="grid grid-cols-[1fr_auto] items-center gap-[var(--ds-space-3)] rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] p-[var(--ds-space-2)]"
            key={artifact.id}
          >
            <div className="min-w-0">
              <div className="truncate text-[length:var(--ds-font-body)] font-medium leading-[var(--ds-line-body)] text-[color:var(--ds-color-text)]">
                {artifact.title}
              </div>
              <p className="text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
                {artifact.format}
                {artifact.pinned ? ' - pinned' : ''}
              </p>
            </div>
            <div className="flex items-center gap-[var(--ds-space-1)]">
              <IconButton icon={Copy} label={`Copy ${artifact.title}`} size="sm" />
              <IconButton icon={Download} label={`Export ${artifact.title}`} size="sm" />
              <IconButton icon={Save} label={`Save ${artifact.title}`} size="sm" />
              <IconButton icon={Pin} label={`Pin ${artifact.title}`} size="sm" />
            </div>
          </div>
        ))}
      </div>
      <Button className="mt-[var(--ds-space-3)] w-full" icon={FileText} size="sm">
        Reopen Artifact
      </Button>
    </Panel>
  );
}
