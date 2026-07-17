import { describe, expect, it } from 'vitest';

import { CommandFavoriteManager } from './command-favorite-manager';
import { CommandHistoryManager } from './command-history-manager';
import { CommandRankingEngine } from './command-ranking-engine';
import { TEST_COMMANDS } from './command-palette-fixtures';

describe('CommandRankingEngine', () => {
  it('returns bounded deterministic scores with reasons', () => {
    const command = TEST_COMMANDS.find((candidate) => candidate.id === 'core.code.debug');

    if (command === undefined) {
      throw new Error('Missing test command.');
    }

    const favorites = new CommandFavoriteManager();
    const history = new CommandHistoryManager();
    favorites.add('core.code.debug');
    history.record('core.code.debug', true, Date.now());

    const result = new CommandRankingEngine().rank({
      command,
      context: null,
      favorites,
      history,
      query: 'debug',
      textScore: 1,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.reasons).toContain('favorite');
  });
});
