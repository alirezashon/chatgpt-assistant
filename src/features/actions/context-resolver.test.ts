import { describe, expect, it } from 'vitest';

import { FIRST_PARTY_ACTIONS } from './first-party-actions';
import { ActionContextResolver } from './context-resolver';
import { createMinimalPageContext, type PageContextSnapshot } from '@/features/context';

describe('ActionContextResolver', () => {
  it('surfaces GitHub pull request goals from GitHub context', () => {
    const resolver = new ActionContextResolver();
    const actions = resolver.resolve({
      actions: FIRST_PARTY_ACTIONS,
      context: pageContext({
        hostname: 'github.com',
        pageKind: 'code',
        title: 'Pull request',
      }),
    });

    expect(actions.map((entry) => entry.action.id)).toContain('github.reviewPr');
    expect(actions[0]?.confidence).toBeGreaterThan(0.5);
  });

  it('surfaces email goals from email context', () => {
    const resolver = new ActionContextResolver();
    const actions = resolver.resolve({
      actions: FIRST_PARTY_ACTIONS,
      context: pageContext({
        hostname: 'mail.google.com',
        pageKind: 'email',
        title: 'Inbox thread',
      }),
    });

    expect(actions.map((entry) => entry.action.id)).toContain('email.reply');
    expect(actions.map((entry) => entry.action.id)).toContain('email.summarizeThread');
  });

  it('does not require a website-specific context for universal goals', () => {
    const resolver = new ActionContextResolver();
    const actions = resolver.resolve({
      actions: FIRST_PARTY_ACTIONS,
      context: null,
    });

    expect(actions.map((entry) => entry.action.id)).toContain('research.topic');
    expect(actions.map((entry) => entry.action.id)).toContain('memory.saveContext');
  });
});

function pageContext(input: {
  readonly hostname: string;
  readonly pageKind: PageContextSnapshot['pageKind'];
  readonly title: string;
}): PageContextSnapshot {
  return createMinimalPageContext({
    capturedAt: '2026-07-17T00:00:00.000Z',
    hostname: input.hostname,
    pageKind: input.pageKind,
    title: input.title,
    url: `https://${input.hostname}/`,
  });
}
