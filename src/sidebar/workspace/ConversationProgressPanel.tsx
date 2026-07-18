import { CheckCircle2, CircleDashed, MessageSquareText } from 'lucide-react';

import { Panel, SectionTitle } from '@/design-system';
import type { AppLocale } from '@/i18n';

import type { SidebarTask, SidebarTaskMessage, SidebarTaskStage } from './sidebar-workspace-types';

export function ConversationProgressPanel({
  copy,
  locale,
  task,
}: {
  readonly copy: { readonly conversationProgress: string; readonly now: string };
  readonly locale: AppLocale;
  readonly task: SidebarTask;
}) {
  return (
    <Panel className="p-[var(--ds-space-3)]">
      <SectionTitle icon={MessageSquareText} title={copy.conversationProgress} />
      <div className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)]">
        {task.messages.map((message) => (
          <TaskMessage copy={copy} key={message.id} locale={locale} message={message} />
        ))}
      </div>
    </Panel>
  );
}

function TaskMessage({
  copy,
  locale,
  message,
}: {
  readonly copy: { readonly now: string };
  readonly locale: AppLocale;
  readonly message: SidebarTaskMessage;
}) {
  const Icon = message.kind === 'completed' ? CheckCircle2 : CircleDashed;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-[var(--ds-space-2)] rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-surface-subtle)] p-[var(--ds-space-3)]">
      <Icon
        className={`mt-0.5 h-[var(--ds-icon-md)] w-[var(--ds-icon-md)] ${stageColor(message.kind)}`}
      />
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-[var(--ds-space-2)]">
          <p className="text-[length:var(--ds-font-label)] font-medium uppercase leading-[var(--ds-line-label)] tracking-[var(--ds-letter-label)] text-[color:var(--ds-color-text-muted)]">
            {message.label}
          </p>
          <span className="text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-subtle)]">
            {shortTime(message.timestamp, locale, copy.now)}
          </span>
        </div>
        <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text)]">
          {message.text}
        </p>
      </div>
    </div>
  );
}

function stageColor(kind: SidebarTaskStage): string {
  if (kind === 'completed') {
    return 'text-[color:var(--ds-color-success)]';
  }

  if (kind === 'calling-tool') {
    return 'text-[color:var(--ds-color-warning)]';
  }

  return 'text-[color:var(--ds-color-accent)]';
}

function shortTime(timestamp: string, locale: AppLocale, nowLabel: string): string {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return nowLabel;
  }

  return parsed.toLocaleTimeString(locale === 'fa' ? 'fa-IR' : undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
