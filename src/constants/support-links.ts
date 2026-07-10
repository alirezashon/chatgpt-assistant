export interface SupportLink {
  readonly description: string;
  readonly href: string;
  readonly label: string;
}

export const SUPPORT_LINKS: readonly SupportLink[] = [
  {
    description: 'Draft a support email with version, browser, page URL, and issue notes.',
    href: 'mailto:?subject=ChatGPT%20Workspace%20support&body=Extension%20version%3A%200.1.0%0AChrome%20version%3A%20%0AChatGPT%20URL%3A%20%0AIssue%3A%20',
    label: 'Email support draft',
  },
  {
    description: 'Review the local beta support checklist before reporting a bug.',
    href: 'support.html',
    label: 'Support guide',
  },
  {
    description: 'Review current local-first privacy behavior.',
    href: 'privacy.html',
    label: 'Privacy policy',
  },
];
