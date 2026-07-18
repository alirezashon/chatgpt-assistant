import { Sparkles } from 'lucide-react';

import { Button, Panel, SectionTitle } from '@/design-system';

import type { SidebarFollowUpAction, SidebarTask } from './sidebar-workspace-types';

export function FollowUpPanel({
  copy,
  onRunFollowUp,
  task,
}: {
  readonly copy: { readonly followUpActions: string };
  readonly onRunFollowUp: (action: SidebarFollowUpAction) => void;
  readonly task: SidebarTask;
}) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={Sparkles} title={copy.followUpActions} />
      <div className="mt-[var(--ds-space-3)] grid grid-cols-2 gap-[var(--ds-space-2)]">
        {task.followUps.map((action) => (
          <Button
            key={action.id}
            size="sm"
            onClick={() => {
              onRunFollowUp(action);
            }}
          >
            {action.title}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
