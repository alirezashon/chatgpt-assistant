import type {
  FloatingSurfaceAction,
  FloatingSurfacePosition,
  FloatingSurfaceSelection,
  FloatingSurfaceState,
  FloatingSurfaceStateListener,
  FloatingSurfaceStatus,
} from './floating-surface-types';
import type { PageContextSnapshot } from '@/features/context';

const INITIAL_STATE: FloatingSurfaceState = {
  actions: [],
  activeIndex: 0,
  context: null,
  dismissed: false,
  error: null,
  position: null,
  selection: null,
  status: 'hidden',
};

/** Owns floating surface business state outside React components. */
export class FloatingSurfaceStateManager {
  private readonly listeners = new Set<FloatingSurfaceStateListener>();
  private state: FloatingSurfaceState = INITIAL_STATE;

  /** Returns current state snapshot. */
  public getSnapshot(): FloatingSurfaceState {
    return this.state;
  }

  /** Subscribes to state changes. */
  public subscribe(listener: FloatingSurfaceStateListener) {
    this.listeners.add(listener);
    listener(this.state);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /** Applies a partial state update. */
  public update(patch: Partial<FloatingSurfaceState>): void {
    this.state = {
      ...this.state,
      ...patch,
    };
    this.emit();
  }

  /** Sets lifecycle status. */
  public setStatus(status: FloatingSurfaceStatus): void {
    this.update({ status });
  }

  /** Sets selection and context. */
  public setSelection(selection: FloatingSurfaceSelection, context: PageContextSnapshot): void {
    this.update({
      activeIndex: 0,
      context,
      dismissed: false,
      error: null,
      selection,
      status: 'detecting',
    });
  }

  /** Clears selection and hides surface. */
  public clearSelection(): void {
    this.update({
      actions: [],
      activeIndex: 0,
      context: null,
      error: null,
      position: null,
      selection: null,
      status: 'hidden',
    });
  }

  /** Sets dynamic action candidates. */
  public setActions(actions: readonly FloatingSurfaceAction[]): void {
    this.update({
      actions,
      activeIndex: actions.length === 0 ? -1 : 0,
      status: actions.length === 0 ? 'ready' : 'visible',
    });
  }

  /** Sets current viewport position. */
  public setPosition(position: FloatingSurfacePosition): void {
    this.update({ position });
  }

  /** Moves active index, wrapping around available actions. */
  public moveActive(delta: number): void {
    const actionCount = this.state.actions.length;

    if (actionCount === 0) {
      return;
    }

    const next = (this.state.activeIndex + delta + actionCount) % actionCount;
    this.update({ activeIndex: next });
  }

  /** Marks current selection as dismissed. */
  public dismiss(): void {
    this.update({
      dismissed: true,
      status: 'dismissed',
    });
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
