export interface ReleaseNote {
  readonly date: string;
  readonly highlights: readonly string[];
  readonly label: string;
  readonly summary: string;
  readonly version: string;
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    date: '2026-07-10',
    highlights: [
      'Free Local now includes folders, assignment, search, favorites, Markdown export, and local backup.',
      'Settings can export and import a local JSON backup without including account or AI secrets.',
      'The sidebar now has onboarding, empty-state guidance, and a clear ChatGPT DOM detection error state.',
      'Extension smoke tests cover install shape, sidebar open, folder assignment, persistence, and detection failures.',
    ],
    label: 'Beta foundation',
    summary:
      'Local-first workspace features are stable enough to keep hardening before account and billing work.',
    version: '0.1.0',
  },
];
