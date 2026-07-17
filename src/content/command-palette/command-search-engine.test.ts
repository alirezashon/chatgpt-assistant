import { describe, expect, it } from 'vitest';

import { CommandFavoriteManager } from './command-favorite-manager';
import { CommandHistoryManager } from './command-history-manager';
import { CommandSearchEngine } from './command-search-engine';
import { TEST_COMMANDS } from './command-palette-fixtures';

describe('CommandSearchEngine', () => {
  it('finds commands by alias and ranks deterministically', () => {
    const search = new CommandSearchEngine();
    const results = search.search({
      commands: TEST_COMMANDS,
      context: null,
      favorites: new CommandFavoriteManager(),
      history: new CommandHistoryManager(),
      query: 'fix bug',
    });

    expect(results[0]?.command.id).toBe('core.code.debug');
  });

  it('boosts favorite commands for empty query', () => {
    const favorites = new CommandFavoriteManager();
    favorites.add('core.page.summarize');

    const results = new CommandSearchEngine().search({
      commands: TEST_COMMANDS,
      context: null,
      favorites,
      history: new CommandHistoryManager(),
      query: '',
    });

    expect(results[0]?.command.id).toBe('core.page.summarize');
  });
});
