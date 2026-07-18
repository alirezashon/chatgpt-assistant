import { Pin } from 'lucide-react';

import { CompactActionRow, Panel, SectionTitle } from '@/design-system';
import type { AppLocale } from '@/i18n';

import { favoriteActions } from './home-actions';
import { runHomeAction } from './home-runner';
import type { HomePageContext } from './home-types';

export function FavoritesSection({
  canMessageTab,
  context,
  copy,
  locale,
  tabId,
  windowId,
}: {
  readonly canMessageTab: boolean;
  readonly context: HomePageContext | null;
  readonly copy: { readonly savedGoals: string };
  readonly locale: AppLocale;
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}) {
  const actions = favoriteActions(locale);

  return (
    <section className="mt-[var(--ds-space-3)]">
      <div className="mb-[var(--ds-space-2)]">
        <SectionTitle icon={Pin} title={copy.savedGoals} />
      </div>
      <Panel className="grid grid-cols-2 gap-[var(--ds-space-1)] p-[var(--ds-space-2)]">
        {actions.map((action) => (
          <CompactActionRow
            aria-label={action.description}
            description={action.outcome ?? action.description}
            disabled={!canMessageTab && action.commandId !== undefined}
            icon={action.icon}
            key={action.id}
            meta={action.artifactsProduced?.[0]?.format}
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
