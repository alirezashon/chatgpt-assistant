export type PricingOutcomeId = 'automate' | 'export' | 'organize' | 'protect';

export interface PricingOutcomeCopy {
  readonly body: string;
  readonly id: PricingOutcomeId;
  readonly title: string;
}

export const PRICING_OUTCOME_COPY: readonly PricingOutcomeCopy[] = [
  {
    body: 'Folders, favorites, tags, cleanup suggestions, and workspace health checks keep GPT work findable.',
    id: 'organize',
    title: 'Organize',
  },
  {
    body: 'Markdown stays free, while PDF, branded templates, export profiles, and client handoffs become Pro.',
    id: 'export',
    title: 'Export',
  },
  {
    body: 'AI summaries, folder suggestions, auto-tags, digests, and job controls turn long threads into workflows.',
    id: 'automate',
    title: 'Automate',
  },
  {
    body: 'Backups, diagnostics, conflict recovery, privacy exports, and priority support protect professional work.',
    id: 'protect',
    title: 'Protect',
  },
] as const;
