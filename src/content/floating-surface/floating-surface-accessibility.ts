import type { FloatingSurfaceState } from './floating-surface-types';

/** Computes ARIA labels and keyboard semantics for the floating surface. */
export class FloatingSurfaceAccessibility {
  /** Returns root ARIA label for the current state. */
  public getLabel(state: FloatingSurfaceState): string {
    if (state.status === 'executing' || state.status === 'streaming') {
      return 'AI action is running';
    }

    if (state.actions.length === 0) {
      return 'No contextual actions available';
    }

    return `${state.actions.length.toString()} contextual actions available`;
  }

  /** Returns the id for the active descendant if available. */
  public getActiveDescendantId(state: FloatingSurfaceState): string | undefined {
    const action = state.actions[state.activeIndex];

    return action === undefined ? undefined : getActionElementId(action.id);
  }
}

/** Creates a stable DOM id for an action row. */
export function getActionElementId(actionId: string): string {
  return `ai-floating-action-${actionId.replaceAll(/[^a-zA-Z0-9_-]/g, '-')}`;
}
