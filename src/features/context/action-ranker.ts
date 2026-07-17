import {
  ActionContextResolver,
  FIRST_PARTY_ACTIONS,
  type ProductAction,
} from '@/features/actions';

import type { ContextActionCandidate, PageContextSnapshot } from './context-types';

/** Ranks actions using adapter signals, context fit, and product popularity. */
export class ContextActionRanker {
  private readonly resolver = new ActionContextResolver();

  /** Returns ranked action candidates for the context. */
  public rank(input: {
    readonly adapterActions: readonly ContextActionCandidate[];
    readonly context: Omit<PageContextSnapshot, 'availableActions'>;
    readonly now?: Date;
  }): readonly ContextActionCandidate[] {
    const adapterScores = new Map(
      input.adapterActions.map((candidate) => [candidate.actionId, candidate] as const),
    );
    const resolved = this.resolver.resolve({
      actions: FIRST_PARTY_ACTIONS,
      context: {
        ...input.context,
        availableActions: [],
      },
    });
    const candidates = new Map<string, ContextActionCandidate>();

    for (const entry of resolved) {
      const adapterCandidate = adapterScores.get(entry.action.id);
      const timeBoost = getTimeBoost(entry.action, input.now ?? new Date());
      const score = Math.min(
        0.99,
        entry.confidence * 0.58 + (adapterCandidate?.confidence ?? 0) * 0.34 + timeBoost,
      );

      candidates.set(entry.action.id, {
        actionId: entry.action.id,
        confidence: score,
        reason: adapterCandidate?.reason ?? readableReason(entry.action),
      });
    }

    for (const candidate of input.adapterActions) {
      if (!candidates.has(candidate.actionId)) {
        candidates.set(candidate.actionId, candidate);
      }
    }

    return [...candidates.values()]
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, 8);
  }
}

function getTimeBoost(action: ProductAction, now: Date): number {
  const hour = now.getHours();

  if (action.category === 'email' && hour >= 8 && hour <= 18) {
    return 0.04;
  }

  if (action.category === 'learning' && (hour < 8 || hour > 18)) {
    return 0.03;
  }

  return 0;
}

function readableReason(action: ProductAction): string {
  return `${action.category} context`;
}
