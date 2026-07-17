import type { PageContextSnapshot, PageKind } from '@/features/context';

import type { HomePageContext, HomeStatus } from './home-types';

/** Builds Home context from content-script context or active-tab fallback. */
export function buildHomePageContext(
  activeTab: chrome.tabs.Tab | null,
  pageContext: PageContextSnapshot | null,
): HomePageContext | null {
  const url = pageContext?.url ?? activeTab?.url ?? '';

  if (url.length === 0 || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null;
  }

  const hostname = pageContext?.hostname ?? safeHostname(url);
  const pageKind = pageContext?.pageKind ?? inferPageKind(hostname, url);
  const hasSelection = pageContext?.selectedText !== undefined && pageContext.selectedText.length > 0;

  return {
    confidence: pageContext === null ? 72 : hasSelection ? 98 : 92,
    hostname,
    label: platformLabel(hostname, pageKind),
    pageKind,
    title: pageContext?.title ?? activeTab?.title ?? hostname,
  };
}

/** Derives header status. */
export function homeStatus(input: {
  readonly canMessageTab: boolean;
  readonly contextLoading: boolean;
}): HomeStatus {
  if (!input.canMessageTab) {
    return 'offline';
  }

  return input.contextLoading ? 'working' : 'ready';
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function inferPageKind(hostname: string, url: string): PageKind {
  if (url.endsWith('.pdf')) {
    return 'pdf';
  }

  if (hostname.includes('github.com') || hostname.includes('stackoverflow.com')) {
    return 'code';
  }

  if (hostname.includes('mail.google.com') || hostname.includes('outlook')) {
    return 'email';
  }

  if (hostname.includes('youtube.com')) {
    return 'video';
  }

  if (hostname.includes('twitter.com') || hostname.includes('x.com') || hostname.includes('linkedin.com')) {
    return 'social';
  }

  if (hostname.includes('jira') || hostname.includes('linear.app')) {
    return 'issue-tracker';
  }

  return 'generic';
}

function platformLabel(hostname: string, pageKind: PageKind): string {
  if (hostname.includes('github.com')) {
    return 'GitHub';
  }

  if (hostname.includes('youtube.com')) {
    return 'YouTube';
  }

  if (hostname.includes('stackoverflow.com')) {
    return 'Stack Overflow';
  }

  if (hostname.includes('mail.google.com')) {
    return 'Gmail';
  }

  if (hostname.includes('docs.google.com')) {
    return 'Google Docs';
  }

  if (hostname.includes('notion.so')) {
    return 'Notion';
  }

  if (hostname.includes('linkedin.com')) {
    return 'LinkedIn';
  }

  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'X / Twitter';
  }

  if (hostname.includes('reddit.com')) {
    return 'Reddit';
  }

  if (hostname.includes('wikipedia.org')) {
    return 'Wikipedia';
  }

  const fallback = {
    article: 'Article',
    code: 'Code page',
    document: 'Document',
    email: 'Email',
    generic: 'Current page',
    'issue-tracker': 'Issue tracker',
    pdf: 'PDF',
    social: 'Social page',
    video: 'Video',
  } satisfies Record<PageKind, string>;

  return fallback[pageKind];
}
