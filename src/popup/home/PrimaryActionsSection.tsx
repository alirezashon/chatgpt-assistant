import { ActionTile, SectionTitle } from '@/design-system';

import { PRIMARY_ACTIONS } from './home-actions';
import { runHomeAction } from './home-runner';
import type { HomePageContext } from './home-types';

export function PrimaryActionsSection({
  canMessageTab,
  context,
  tabId,
  windowId,
}: {
  readonly canMessageTab: boolean;
  readonly context: HomePageContext | null;
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}) {
  return (
    <section className="mt-[var(--ds-space-3)]">
      <div className="mb-[var(--ds-space-2)]">
        <SectionTitle title="Start here" />
      </div>
      <div className="grid grid-cols-2 gap-[var(--ds-space-2)]">
        {PRIMARY_ACTIONS.map((action, index) => (
          <ActionTile
            description={action.description}
            disabled={!canMessageTab && action.commandId !== undefined}
            icon={action.icon}
            key={action.id}
            prominent={index === 0}
            title={action.title}
            onClick={() => {
              void runHomeAction({ action, context, tabId, windowId });
            }}
          />
        ))}
      </div>
    </section>
  );
}
