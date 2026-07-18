import { MousePointerClick, PanelRight, ScanSearch } from 'lucide-react';

import { Panel } from '@/design-system';

export function HomeGuideCard({
  copy,
}: {
  readonly copy: {
    readonly guideAction: string;
    readonly guidePage: string;
    readonly guideWorkspace: string;
    readonly whatHappens: string;
  };
}) {
  const items = [
    { icon: ScanSearch, label: copy.guidePage },
    { icon: MousePointerClick, label: copy.guideAction },
    { icon: PanelRight, label: copy.guideWorkspace },
  ] as const;

  return (
    <Panel className="mt-[var(--ds-space-3)] p-[var(--ds-space-2)]" tone="subtle">
      <div className="mb-[var(--ds-space-2)] px-[var(--ds-space-1)] text-[length:var(--ds-font-label)] font-semibold leading-[var(--ds-line-label)] text-[color:var(--ds-color-text-muted)]">
        {copy.whatHappens}
      </div>
      <div className="grid grid-cols-3 gap-[var(--ds-space-1)]">
        {items.map((item) => (
          <div
            className="grid min-w-0 gap-[var(--ds-space-1)] rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-subtle)] p-[var(--ds-space-2)]"
            key={item.label}
          >
            <item.icon
              aria-hidden="true"
              className="h-[var(--ds-icon-sm)] w-[var(--ds-icon-sm)] text-[color:var(--ds-color-accent)]"
            />
            <div className="text-[length:var(--ds-font-label)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
