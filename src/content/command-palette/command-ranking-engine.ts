import type { PageContextSnapshot } from '@/features/context';

import type { CommandFavoriteManager } from './command-favorite-manager';
import type { CommandHistoryManager } from './command-history-manager';
import type { PaletteCommand, PaletteCommandResult } from './command-palette-types';

/** Score input for command ranking. */
export interface CommandRankingInput {
  /** Query text. */
  readonly query: string;
  /** Candidate command. */
  readonly command: PaletteCommand;
  /** Text relevance score from search engine. */
  readonly textScore: number;
  /** Active context. */
  readonly context: PageContextSnapshot | null;
  /** History manager. */
  readonly history: CommandHistoryManager;
  /** Favorites manager. */
  readonly favorites: CommandFavoriteManager;
}

/** Deterministic command ranking engine. */
export class CommandRankingEngine {
  /** Ranks a command candidate. */
  public rank(input: CommandRankingInput): PaletteCommandResult {
    const reasons: string[] = [];
    const history = input.history.get(input.command.id);
    const favoriteBoost = input.favorites.has(input.command.id) ? 0.14 : 0;
    const frequencyBoost = normalize(history?.count ?? 0, 20) * 0.1;
    const recencyBoost = history === undefined ? 0 : getRecencyBoost(history.lastUsedAt);
    const contextBoost = getContextBoost(input.command, input.context);
    const shortcutBoost = input.command.shortcut === undefined ? 0 : 0.04;
    const permissionPenalty = input.command.permission === 'allowed' ? 0 : -0.2;
    const latencyPenalty = normalize(input.command.latencyMs, 5000) * -0.05;
    const confidenceBoost = input.command.confidence * 0.08;
    const popularityBoost = input.command.popularity * 0.05;
    const usageBoost = normalize(input.command.usageCount, 20) * 0.06;

    if (favoriteBoost > 0) {
      reasons.push('favorite');
    }

    if (frequencyBoost > 0) {
      reasons.push('frequent');
    }

    if (recencyBoost > 0) {
      reasons.push('recent');
    }

    if (contextBoost > 0) {
      reasons.push('context');
    }

    const score =
      input.textScore * 0.56 +
      favoriteBoost +
      frequencyBoost +
      recencyBoost +
      contextBoost +
      shortcutBoost +
      permissionPenalty +
      latencyPenalty +
      confidenceBoost +
      popularityBoost +
      usageBoost;

    return {
      command: input.command,
      reasons,
      score: clamp01(score),
    };
  }
}

function getContextBoost(command: PaletteCommand, context: PageContextSnapshot | null): number {
  if (context === null) {
    return 0;
  }

  if (
    command.keywords.includes(context.pageKind) ||
    command.tags.includes(context.pageKind) ||
    command.category === categoryForPageKind(context.pageKind)
  ) {
    return 0.12;
  }

  if (
    command.requiredContext?.hostIncludes?.some((fragment) =>
      context.hostname.includes(fragment),
    ) === true
  ) {
    return 0.16;
  }

  return 0;
}

function categoryForPageKind(pageKind: PageContextSnapshot['pageKind']) {
  switch (pageKind) {
    case 'code':
      return 'coding';
    case 'email':
      return 'writing';
    case 'article':
    case 'document':
    case 'pdf':
    case 'video':
      return 'research';
    default:
      return 'writing';
  }
}

function getRecencyBoost(lastUsedAt: number): number {
  const ageMs = Date.now() - lastUsedAt;
  const dayMs = 86_400_000;

  return Math.max(0, 0.08 * (1 - Math.min(ageMs / (dayMs * 14), 1)));
}

function normalize(value: number, max: number): number {
  return clamp01(value / max);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
