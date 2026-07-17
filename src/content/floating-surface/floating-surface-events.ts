import type { EventMap } from '@/runtime';

import type {
  FloatingSurfaceAction,
  FloatingSurfaceSelection,
  FloatingSurfaceStatus,
} from './floating-surface-types';

/** String event names emitted by the floating surface runtime. */
export type FloatingSurfaceEventType = keyof FloatingSurfaceEventMap;

/** Typed event map emitted by the floating surface runtime. */
export interface FloatingSurfaceEventMap extends EventMap {
  /** Selection became valid for the surface. */
  readonly 'floating.selection.changed': { readonly selection: FloatingSurfaceSelection };
  /** Selection was cleared or became invalid. */
  readonly 'floating.selection.cleared': { readonly reason: string };
  /** Surface lifecycle state changed. */
  readonly 'floating.state.changed': {
    readonly next: FloatingSurfaceStatus;
    readonly previous: FloatingSurfaceStatus;
  };
  /** Action execution started. */
  readonly 'floating.action.started': { readonly action: FloatingSurfaceAction };
  /** Action execution completed. */
  readonly 'floating.action.completed': { readonly action: FloatingSurfaceAction };
  /** Action execution failed. */
  readonly 'floating.action.failed': {
    readonly action: FloatingSurfaceAction;
    readonly error: string;
  };
}
