import { Sparkles } from 'lucide-react';

import { Button, Panel, SectionTitle } from '@/design-system';

import type { SidebarTask } from './sidebar-workspace-types';

export function FollowUpPanel({ task }: { readonly task: SidebarTask }) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={Sparkles} title="Follow-up actions" />
      <div className="mt-[var(--ds-space-3)] grid grid-cols-2 gap-[var(--ds-space-2)]">
        {task.followUps.map((action) => (
          <Button key={action.id} size="sm">
            {action.title}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
