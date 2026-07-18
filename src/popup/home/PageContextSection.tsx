import { Badge, CompactActionRow, Panel, SectionTitle } from '@/design-system';
import type { AppLocale } from '@/i18n';

import { contextActions } from './home-actions';
import { runHomeAction } from './home-runner';
import type { HomePageContext } from './home-types';

export function PageContextSection({
  canMessageTab,
  context,
  copy,
  locale,
  tabId,
  windowId,
}: {
  readonly canMessageTab: boolean;
  readonly context: HomePageContext | null;
  readonly copy: { readonly detectedPage: string };
  readonly locale: AppLocale;
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}) {
  if (context === null) {
    return null;
  }

  const actions = contextActions(context, locale);
  const hint = pageContextHint(context, locale);

  return (
    <section className="mt-[var(--ds-space-3)]">
      <div className="mb-[var(--ds-space-2)] flex items-center justify-between">
        <SectionTitle title={copy.detectedPage} />
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
          <p className="mt-[var(--ds-space-1)] truncate text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-info)]">
            {hint}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-[var(--ds-space-1)]">
          {actions.slice(0, 4).map((action) => (
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
        </div>
      </Panel>
    </section>
  );
}

function pageContextHint(context: HomePageContext, locale: AppLocale): string {
  const hints = {
    en: {
      article: 'Readable page: summarize, research, or extract structured data.',
      'chat-empty': 'Blank ChatGPT chat: build a stronger prompt or workflow.',
      'chat-thread': 'Active ChatGPT chat: summarize, extract tasks, or save context.',
      code: 'Code page: explain, review, test, or document what is visible.',
      document: 'Document page: summarize, translate, or create notes.',
      email: 'Email thread: draft, summarize, translate, or improve a reply.',
      generic: 'Current page: save context, research, or start a workflow.',
      'issue-tracker': 'Issue page: summarize decisions, risks, and next actions.',
      pdf: 'PDF page: summarize, research, or extract important details.',
      social: 'Social page: summarize useful context or save what matters.',
      video: 'Video page: summarize, extract chapters, or create notes.',
    },
    fa: {
      article: 'صفحه خواندنی: خلاصه، پژوهش یا استخراج داده.',
      'chat-empty': 'چت خالی ChatGPT: ساخت پرامپت بهتر یا شروع گردش‌کار.',
      'chat-thread': 'گفت‌وگوی فعال ChatGPT: خلاصه، استخراج کارها یا ذخیره زمینه.',
      code: 'صفحه کد: توضیح، بررسی، تست یا مستندسازی.',
      document: 'صفحه سند: خلاصه، ترجمه یا ساخت یادداشت.',
      email: 'رشته ایمیل: پیش‌نویس، خلاصه، ترجمه یا بهبود پاسخ.',
      generic: 'صفحه فعلی: ذخیره زمینه، پژوهش یا شروع گردش‌کار.',
      'issue-tracker': 'صفحه مسئله: خلاصه تصمیم‌ها، ریسک‌ها و اقدام‌های بعدی.',
      pdf: 'صفحه PDF: خلاصه، پژوهش یا استخراج جزئیات مهم.',
      social: 'صفحه اجتماعی: خلاصه زمینه مفید یا ذخیره نکته‌های مهم.',
      video: 'صفحه ویدیو: خلاصه، استخراج فصل‌ها یا ساخت یادداشت.',
    },
  } as const;

  return hints[locale][context.pageKind];
}
