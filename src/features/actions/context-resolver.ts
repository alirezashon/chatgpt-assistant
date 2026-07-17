import type { PageContextSnapshot } from '@/features/context';

import type { ActionSupportedContext, ProductAction, ResolvedAction } from './action-types';

/** Resolves user-goal actions for the current browser context. */
export class ActionContextResolver {
  /** Returns context-relevant actions ordered by confidence. */
  public resolve(input: {
    readonly actions: readonly ProductAction[];
    readonly context: PageContextSnapshot | null;
  }): readonly ResolvedAction[] {
    return input.actions
      .map((action) => resolveAction(action, input.context))
      .filter((resolved): resolved is ResolvedAction => resolved !== null)
      .sort(
        (left, right) =>
          right.confidence - left.confidence ||
          right.action.popularity - left.action.popularity ||
          left.action.title.localeCompare(right.action.title),
      );
  }
}

function resolveAction(
  action: ProductAction,
  context: PageContextSnapshot | null,
): ResolvedAction | null {
  const contexts =
    action.supportedContexts.length === 0 ? [{} satisfies ActionSupportedContext] : action.supportedContexts;
  let best: ResolvedAction | null = null;

  for (const supportedContext of contexts) {
    const score = scoreSupportedContext(supportedContext, context);

    if (score === null) {
      continue;
    }

    const adapterCandidate = context?.availableActions.find(
      (candidate) => candidate.actionId === action.id,
    );
    const resolved = {
      action,
      confidence: Math.min(
        0.99,
        action.popularity * 0.25 +
          score.confidence +
          (adapterCandidate?.confidence ?? 0) * 0.22,
      ),
      reasons:
        adapterCandidate === undefined
          ? score.reasons
          : [...score.reasons, adapterCandidate.reason],
    } satisfies ResolvedAction;

    if (best === null || resolved.confidence > best.confidence) {
      best = resolved;
    }
  }

  return best;
}

function scoreSupportedContext(
  supportedContext: ActionSupportedContext,
  context: PageContextSnapshot | null,
): { readonly confidence: number; readonly reasons: readonly string[] } | null {
  const reasons: string[] = [];
  let confidence = 0.45;

  if (supportedContext.requiresSelection === true) {
    if (context?.selectedText === undefined) {
      return null;
    }

    confidence += 0.18;
    reasons.push('selection');
  }

  if (supportedContext.requiresEditableTarget === true) {
    if (context?.focusedElement?.isEditable !== true) {
      return null;
    }

    confidence += 0.18;
    reasons.push('editable');
  }

  if (supportedContext.pageKinds !== undefined) {
    if (context === null || !supportedContext.pageKinds.includes(context.pageKind)) {
      return null;
    }

    confidence += 0.2;
    reasons.push(context.pageKind);
  }

  if (supportedContext.hostIncludes !== undefined) {
    if (
      context === null ||
      !supportedContext.hostIncludes.some((fragment) => context.hostname.includes(fragment))
    ) {
      return null;
    }

    confidence += 0.26;
    reasons.push(context.hostname);
  }

  return {
    confidence,
    reasons,
  };
}
