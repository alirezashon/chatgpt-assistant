import { Badge, CompactActionRow, Panel, SectionTitle } from '@/design-system';

import { contextActions } from './home-actions';
import { runHomeAction } from './home-runner';
import type { HomePageContext } from './home-types';

export function PageContextSection({
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
  if (context === null) {
    return null;
  }

  const actions = contextActions(context);

  return (
    <section className="mt-[var(--ds-space-3)]">
      <div className="mb-[var(--ds-space-2)] flex items-center justify-between">
        <SectionTitle title="Detected page" />
        <Badge intent="accent">{context.confidence.toString()}%</Badge>
      </div>
      <Panel className="p-[var(--ds-space-2)]" tone="elevated">
        <div className="mb-[var(--ds-space-2)] min-w-0 px-[var(--ds-space-1)]">
          <div className="truncate text-[length:var(--ds-font-title)] font-semibold leading-[var(--ds-line-title)] text-[color:var(--ds-color-text-strong)]">
            {context.label}
          </div>
          <p className="truncate text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
            {context.title}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-[var(--ds-space-1)]">
          {actions.slice(0, 4).map((action) => (
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
        </div>
      </Panel>
    </section>
  );
}
