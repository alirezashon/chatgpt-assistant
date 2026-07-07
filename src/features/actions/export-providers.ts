export type ExportProviderId = 'ai-summary' | 'html' | 'json' | 'markdown' | 'pdf';

export interface ExportProvider {
  readonly enabled: boolean;
  readonly id: ExportProviderId;
  readonly label: string;
}

export const DEFAULT_EXPORT_PROVIDERS: readonly ExportProvider[] = [
  {
    enabled: false,
    id: 'markdown',
    label: 'Markdown',
  },
  {
    enabled: false,
    id: 'json',
    label: 'JSON',
  },
  {
    enabled: false,
    id: 'html',
    label: 'HTML',
  },
  {
    enabled: false,
    id: 'pdf',
    label: 'PDF',
  },
  {
    enabled: false,
    id: 'ai-summary',
    label: 'Future AI Summary',
  },
];
