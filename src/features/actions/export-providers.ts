export type ExportProviderId = 'ai-summary' | 'html' | 'json' | 'markdown' | 'pdf';

export interface ExportProvider {
  readonly enabled: boolean;
  readonly id: ExportProviderId;
  readonly label: string;
}

export const DEFAULT_EXPORT_PROVIDERS: readonly ExportProvider[] = [
  {
    enabled: true,
    id: 'markdown',
    label: 'Markdown',
  },
  {
    enabled: true,
    id: 'json',
    label: 'JSON',
  },
  {
    enabled: true,
    id: 'html',
    label: 'HTML',
  },
  {
    enabled: true,
    id: 'pdf',
    label: 'PDF',
  },
  {
    enabled: false,
    id: 'ai-summary',
    label: 'Future AI Summary',
  },
];
