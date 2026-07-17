import { Pin } from 'lucide-react';

import { CompactActionRow, Panel, SectionTitle } from '@/design-system';

import { FAVORITE_ACTIONS } from './home-actions';
import { runHomeAction } from './home-runner';
import type { HomePageContext } from './home-types';

export function FavoritesSection({
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
        <SectionTitle icon={Pin} title="Saved goals" />
      </div>
      <Panel className="grid grid-cols-2 gap-[var(--ds-space-1)] p-[var(--ds-space-2)]">
        {FAVORITE_ACTIONS.map((action) => (
          <CompactActionRow
            aria-label={action.description}
            disabled={!canMessageTab && action.commandId !== undefined}
            icon={action.icon}
            key={action.id}
            title={action.title}
            onClick={() => {
              void runHomeAction({ action, context, tabId, windowId });
            }}
          />
        ))}
      </Panel>
    </section>
  );
}
