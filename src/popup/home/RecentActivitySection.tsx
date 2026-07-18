import { CheckCircle2, Clock3 } from 'lucide-react';

import { CompactActionRow, Panel, SectionTitle } from '@/design-system';
import type { AppLocale } from '@/i18n';

import { capabilityActions } from './home-actions';
import { runHomeAction } from './home-runner';
import type { HomeActivity, HomePageContext } from './home-types';

export function RecentActivitySection({
  canMessageTab,
  context,
  copy,
  locale,
  recent,
  tabId,
  windowId,
}: {
  readonly canMessageTab: boolean;
  readonly context: HomePageContext | null;
  readonly copy: { readonly commonGoals: string; readonly recentWork: string };
  readonly locale: AppLocale;
  readonly recent: readonly HomeActivity[];
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}) {
  return (
    <section className="mt-[var(--ds-space-3)]">
      <div className="mb-[var(--ds-space-2)]">
        <SectionTitle
          icon={Clock3}
          title={recent.length === 0 ? copy.commonGoals : copy.recentWork}
        />
      </div>
      <Panel className="grid gap-[var(--ds-space-1)] p-[var(--ds-space-2)]">
        {recent.length === 0
          ? capabilityActions(locale)
              .slice(0, 4)
              .map((action) => (
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
              ))
          : recent.slice(0, 5).map((activity) => (
              <CompactActionRow
                aria-label={activity.action.description}
                description={activity.action.outcome ?? activity.action.description}
                icon={CheckCircle2}
                key={activity.id}
                meta={activity.action.artifactsProduced?.[0]?.format}
                title={activity.label}
                onClick={() => {
                  void runHomeAction({ action: activity.action, context, tabId, windowId });
                }}
              />
            ))}
      </Panel>
    </section>
  );
}
