import { describe, expect, it } from 'vitest';

import { utilityActionProvider, conversationActionProvider } from '@/features/actions';
import type { ActionContext } from '@/features/actions/action-types';
import type { FavoriteService } from '@/features/favorites';
import { createWorkspaceState } from '@/test/workspace-fixtures';

describe('default action providers', () => {
  it('adds contextual upgrade prompts to locked premium actions', () => {
    const context = createActionContext(['conversation-1']);
    const actions = [
      ...conversationActionProvider.getActions(context),
      ...utilityActionProvider.getActions(context),
    ];

    expect(actions.find((action) => action.id === 'full-ai-summary')).toMatchObject({
      disabled: true,
      premiumFeatureId: 'ai-summaries',
      upgradePrompt: {
        ctaLabel: 'Upgrade for AI summaries',
      },
    });
    expect(actions.find((action) => action.id === 'export-pdf')).toMatchObject({
      disabled: true,
      premiumFeatureId: 'pdf-export',
      upgradePrompt: {
        ctaLabel: 'Upgrade for PDF export',
      },
    });
    expect(actions.find((action) => action.id === 'export-profile-builder')).toMatchObject({
      disabled: true,
      premiumFeatureId: 'saved-export-profiles',
      upgradePrompt: {
        ctaLabel: 'Upgrade for export profiles',
      },
    });
  });

  it('keeps the AI summary teaser available as a free preview', () => {
    const action = conversationActionProvider
      .getActions(createActionContext(['conversation-1']))
      .find((candidate) => candidate.id === 'preview-ai-summary');

    expect(action).toMatchObject({
      disabled: false,
      label: 'Preview AI Summary',
    });
  });
});

function createActionContext(targetIds: readonly string[]): ActionContext {
  return {
    favoriteService: {
      initialize: () => Promise.resolve(),
      isFavorite: () => false,
      listFavorites: () => Promise.resolve([]),
      setFavorite: () => Promise.resolve(),
      toggleFavorite: () => Promise.resolve(false),
    } satisfies FavoriteService,
    targetIds,
    workspace: createWorkspaceState(),
  };
}
