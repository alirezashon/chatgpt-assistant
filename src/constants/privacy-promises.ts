export interface PrivacyPromise {
  readonly description: string;
  readonly id: 'ai-processing' | 'cloud-sync' | 'local-only';
  readonly status: 'future-opt-in' | 'local-now';
  readonly title: string;
}

export const PRIVACY_PROMISES: readonly PrivacyPromise[] = [
  {
    description:
      'Folders, assignments, favorites, Markdown exports, settings, and local backups stay in Chrome local storage by default.',
    id: 'local-only',
    status: 'local-now',
    title: 'Local workspace data stays local',
  },
  {
    description:
      'Cloud sync is a future Pro feature and will require sign-in, explicit enablement, and clear backup controls.',
    id: 'cloud-sync',
    status: 'future-opt-in',
    title: 'Cloud sync will be opt-in',
  },
  {
    description:
      'External AI processing is off by default and must be enabled before any provider call can use conversation content.',
    id: 'ai-processing',
    status: 'future-opt-in',
    title: 'AI processing will be explicit',
  },
];
