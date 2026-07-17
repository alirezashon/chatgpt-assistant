import type { PageContextSnapshot } from '@/features/context';
import type { Disposable } from '@/runtime';

/** Lifecycle state for the contextual floating action surface. */
export type FloatingSurfaceStatus =
  | 'detecting'
  | 'dismissed'
  | 'error'
  | 'executing'
  | 'hidden'
  | 'ready'
  | 'streaming'
  | 'success'
  | 'visible';

/** Display-neutral action category shown by the floating surface. */
export type FloatingSurfaceActionCategory =
  'automation' | 'code' | 'communication' | 'context' | 'research' | 'writing';

/** Permission state for an action candidate. */
export type FloatingSurfacePermissionState = 'allowed' | 'denied' | 'prompt' | 'unknown';

/** Action supplied by Action Intelligence Engine or Command Platform adapters. */
export interface FloatingSurfaceAction {
  /** Stable command/action id. */
  readonly id: string;
  /** User-facing title. */
  readonly title: string;
  /** Semantic icon hint. The renderer maps this to an icon. */
  readonly icon: string;
  /** Optional keyboard shortcut hint. */
  readonly shortcut?: string;
  /** Confidence score from 0 to 1. */
  readonly confidence: number;
  /** Action category for grouping and color semantics. */
  readonly category: FloatingSurfaceActionCategory;
  /** True when action cannot execute. */
  readonly disabled?: boolean;
  /** Optional disabled reason for accessibility and tooltips. */
  readonly disabledReason?: string;
  /** Permission state associated with execution. */
  readonly permission: FloatingSurfacePermissionState;
  /** True while the action is executing. */
  readonly loading?: boolean;
}

/** Normalized text selection consumed by the surface. */
export interface FloatingSurfaceSelection {
  /** Selected text. */
  readonly text: string;
  /** Selection rectangles in viewport coordinates. */
  readonly rects: readonly DOMRectReadOnly[];
  /** Bounding rectangle in viewport coordinates. */
  readonly boundingRect: DOMRectReadOnly;
  /** Whether selection is inside an editable target. */
  readonly editable: boolean;
  /** Whether selection likely represents source code. */
  readonly codeLike: boolean;
}

/** Surface position in viewport coordinates. */
export interface FloatingSurfacePosition {
  /** X coordinate in CSS pixels. */
  readonly x: number;
  /** Y coordinate in CSS pixels. */
  readonly y: number;
  /** Placement chosen by collision detection. */
  readonly placement: 'bottom' | 'left' | 'right' | 'top';
  /** True when clamped to viewport bounds. */
  readonly clamped: boolean;
}

/** Renderer dimensions used by the position engine. */
export interface FloatingSurfaceSize {
  /** Width in CSS pixels. */
  readonly width: number;
  /** Height in CSS pixels. */
  readonly height: number;
}

/** Viewport snapshot used by pure positioning logic. */
export interface FloatingSurfaceViewport {
  /** Viewport width. */
  readonly width: number;
  /** Viewport height. */
  readonly height: number;
  /** Visual viewport offset left. */
  readonly offsetLeft: number;
  /** Visual viewport offset top. */
  readonly offsetTop: number;
}

/** Complete state owned by the state manager, not React components. */
export interface FloatingSurfaceState {
  /** Current lifecycle status. */
  readonly status: FloatingSurfaceStatus;
  /** Current selection, if any. */
  readonly selection: FloatingSurfaceSelection | null;
  /** Current page context. */
  readonly context: PageContextSnapshot | null;
  /** Dynamic action candidates. */
  readonly actions: readonly FloatingSurfaceAction[];
  /** Highlighted action index for keyboard navigation. */
  readonly activeIndex: number;
  /** Current surface position. */
  readonly position: FloatingSurfacePosition | null;
  /** Last safe error message. */
  readonly error: string | null;
  /** True when user intentionally dismissed current selection surface. */
  readonly dismissed: boolean;
}

/** Floating surface state listener. */
export type FloatingSurfaceStateListener = (state: FloatingSurfaceState) => void;

/** Dynamic action provider adapter. */
export interface FloatingSurfaceAdapter {
  /** Gets contextual actions for a normalized selection/context pair. */
  getActions(input: {
    readonly context: PageContextSnapshot;
    readonly selection: FloatingSurfaceSelection;
  }): Promise<readonly FloatingSurfaceAction[]> | readonly FloatingSurfaceAction[];
  /** Executes the selected action. */
  executeAction(input: {
    readonly action: FloatingSurfaceAction;
    readonly context: PageContextSnapshot;
    readonly selection: FloatingSurfaceSelection;
  }): Promise<void> | void;
}

/** Renderer contract used by the runtime. */
export interface FloatingSurfaceRenderer extends Disposable {
  /** Mounts renderer. */
  mount(controller: FloatingSurfaceControllerPort): void;
  /** Receives state updates. */
  render(state: FloatingSurfaceState): void;
}

/** Controller functions exposed to renderer. */
export interface FloatingSurfaceControllerPort {
  /** Executes action by id. */
  execute(actionId: string): void;
  /** Dismisses the surface. */
  dismiss(): void;
  /** Moves highlighted action. */
  moveActive(delta: number): void;
}
