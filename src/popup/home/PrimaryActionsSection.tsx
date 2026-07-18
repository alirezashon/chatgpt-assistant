import { ActionTile, SectionTitle } from '@/design-system';
import type { AppLocale } from '@/i18n';

import { primaryActionsForContext } from './home-actions';
import { runHomeAction } from './home-runner';
import type { HomePageContext } from './home-types';

export function PrimaryActionsSection({
  canMessageTab,
  context,
  copy,
  locale,
  secondsLabel,
  tabId,
  windowId,
}: {
  readonly canMessageTab: boolean;
  readonly context: HomePageContext | null;
  readonly copy: { readonly startHere: string };
  readonly locale: AppLocale;
  readonly secondsLabel: string;
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}) {
  const actions = primaryActionsForContext(context, locale);
  const permissionHint =
    locale === 'fa'
      ? 'اگر صفحه نیاز به دسترسی داشته باشد، هنگام اجرای اکشن درخواست می‌شود.'
      : 'If this page needs access, the action will ask before it starts.';

  return (
    <section className="mt-[var(--ds-space-3)]">
      <div className="mb-[var(--ds-space-2)] flex items-center justify-between gap-[var(--ds-space-2)]">
        <SectionTitle title={copy.startHere} />
        <span className="shrink-0 text-[length:var(--ds-font-label)] leading-[var(--ds-line-label)] text-[color:var(--ds-color-text-subtle)]">
          {canMessageTab ? null : locale === 'fa' ? 'نیاز به دسترسی' : 'Needs access'}
        </span>
      </div>
      {canMessageTab ? null : (
        <p className="mb-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[color:var(--ds-color-warning-border)] bg-[var(--ds-color-warning-surface)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-warning)]">
          {permissionHint}
        </p>
      )}
      <div className="grid grid-cols-2 gap-[var(--ds-space-2)]">
        {actions.map((action, index) => (
          <ActionTile
            description={action.description}
            disabled={!canMessageTab && action.commandId !== undefined}
            icon={action.icon}
            key={action.id}
            meta={actionMeta(action, secondsLabel)}
            outcome={action.outcome}
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

function actionMeta(
  action: ReturnType<typeof primaryActionsForContext>[number],
  secondsLabel: string,
) {
  const duration = `${(action.estimatedDurationSec ?? 18).toString()} ${secondsLabel}`;
  const format = action.artifactsProduced?.[0]?.format;

  return format === undefined ? duration : `${duration} - ${format}`;
}
