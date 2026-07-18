import { Copy, Download, FileText, Pin, Save } from 'lucide-react';

import { Button, IconButton, Panel, SectionTitle } from '@/design-system';

import type { SidebarArtifact, SidebarTask } from './sidebar-workspace-types';

export function ArtifactPanel({
  copy,
  onCopyArtifact,
  onExportArtifact,
  onPinArtifact,
  onReopenArtifact,
  onSaveArtifact,
  task,
}: {
  readonly copy: {
    readonly artifacts: string;
    readonly copy: string;
    readonly export: string;
    readonly pin: string;
    readonly pinned: string;
    readonly reopenArtifact: string;
    readonly save: string;
  };
  readonly onCopyArtifact: (artifact: SidebarArtifact) => void;
  readonly onExportArtifact: (artifact: SidebarArtifact) => void;
  readonly onPinArtifact: (artifact: SidebarArtifact) => void;
  readonly onReopenArtifact: (artifact: SidebarArtifact | null) => void;
  readonly onSaveArtifact: (artifact: SidebarArtifact) => void;
  readonly task: SidebarTask;
}) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={FileText} title={copy.artifacts} />
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
                {artifact.pinned ? ` - ${copy.pinned}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-[var(--ds-space-1)]">
              <IconButton
                icon={Copy}
                label={`${copy.copy} ${artifact.title}`}
                size="sm"
                onClick={() => {
                  onCopyArtifact(artifact);
                }}
              />
              <IconButton
                icon={Download}
                label={`${copy.export} ${artifact.title}`}
                size="sm"
                onClick={() => {
                  onExportArtifact(artifact);
                }}
              />
              <IconButton
                icon={Save}
                label={`${copy.save} ${artifact.title}`}
                size="sm"
                onClick={() => {
                  onSaveArtifact(artifact);
                }}
              />
              <IconButton
                icon={Pin}
                label={`${copy.pin} ${artifact.title}`}
                size="sm"
                onClick={() => {
                  onPinArtifact(artifact);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        className="mt-[var(--ds-space-3)] w-full"
        icon={FileText}
        size="sm"
        onClick={() => {
          onReopenArtifact(null);
        }}
      >
        {copy.reopenArtifact}
      </Button>
    </Panel>
  );
}
