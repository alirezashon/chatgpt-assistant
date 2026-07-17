import { Layers } from 'lucide-react';

import { MetricRow, Panel, SectionTitle } from '@/design-system';

import type { SidebarTask } from './sidebar-workspace-types';

export function CurrentContextPanel({ task }: { readonly task: SidebarTask }) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={Layers} title="Current context" />
      <dl className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)] sm:grid-cols-2">
        {task.context.map((item) => (
          <MetricRow key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </Panel>
  );
}
