import type { PageContextSnapshot } from '@/features/context';

import type { CommandFavoriteManager } from './command-favorite-manager';
import type { CommandHistoryManager } from './command-history-manager';
import { CommandRankingEngine } from './command-ranking-engine';
import type { PaletteCommand, PaletteCommandResult } from './command-palette-types';

const MAX_RESULTS = 80;

/** Production command search engine with exact, prefix, fuzzy, alias, keyword, and category search. */
export class CommandSearchEngine {
  private readonly ranking = new CommandRankingEngine();

  /** Searches and ranks commands deterministically. */
  public search(input: {
    readonly commands: readonly PaletteCommand[];
    readonly context: PageContextSnapshot | null;
    readonly favorites: CommandFavoriteManager;
    readonly history: CommandHistoryManager;
    readonly query: string;
  }): readonly PaletteCommandResult[] {
    const query = normalizeText(input.query);
    const results = input.commands
      .map((command) => {
        const textScore =
          query.length === 0
            ? getEmptyQueryScore(command, input.history, input.favorites)
            : scoreText(command, query);

        if (textScore <= 0) {
          return null;
        }

        return this.ranking.rank({
          command,
          context: input.context,
          favorites: input.favorites,
          history: input.history,
          query,
          textScore,
        });
      })
      .filter((result): result is PaletteCommandResult => result !== null)
      .sort(compareResults);

    return results.slice(0, MAX_RESULTS);
  }
}

function scoreText(command: PaletteCommand, query: string): number {
  const fields = [
    command.title,
    command.description,
    command.namespace,
    command.category,
    command.provider,
    ...command.aliases,
    ...command.keywords,
  ].map(normalizeText);

  let best = 0;

  for (const field of fields) {
    if (field === query) {
      best = Math.max(best, 1);
    } else if (field.startsWith(query)) {
      best = Math.max(best, 0.86);
    } else if (field.includes(query)) {
      best = Math.max(best, 0.68);
    } else {
      best = Math.max(best, fuzzyScore(field, query));
    }
  }

  return best;
}

function getEmptyQueryScore(
  command: PaletteCommand,
  history: CommandHistoryManager,
  favorites: CommandFavoriteManager,
): number {
  if (favorites.has(command.id)) {
    return 0.8;
  }

  if (history.get(command.id) !== undefined) {
    return 0.65;
  }

  return command.confidence * 0.45;
}

function fuzzyScore(field: string, query: string): number {
  if (query.length === 0) {
    return 0;
  }

  let fieldIndex = 0;
  let matched = 0;

  for (const character of query) {
    const foundAt = field.indexOf(character, fieldIndex);

    if (foundAt === -1) {
      continue;
    }

    matched += 1;
    fieldIndex = foundAt + 1;
  }

  const ratio = matched / query.length;

  return ratio >= 0.72 ? ratio * 0.5 : 0;
}

function compareResults(left: PaletteCommandResult, right: PaletteCommandResult): number {
  return (
    right.score - left.score ||
    left.command.category.localeCompare(right.command.category) ||
    left.command.title.localeCompare(right.command.title) ||
    left.command.id.localeCompare(right.command.id)
  );
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}
