import { extractPageContext } from '@/features/context';
import { EventBus, type Disposable, type RuntimeEvent } from '@/runtime';

import type { FloatingSurfaceEventMap } from './floating-surface-events';
import { FloatingSurfacePositionEngine, readViewport } from './floating-surface-position-engine';
import type {
  FloatingSurfaceAdapter,
  FloatingSurfaceControllerPort,
  FloatingSurfaceSelection,
  FloatingSurfaceSize,
  FloatingSurfaceState,
  FloatingSurfaceStateListener,
  FloatingSurfaceStatus,
} from './floating-surface-types';
import type { FloatingSurfaceEventType } from './floating-surface-events';
import { FloatingSurfaceStateManager } from './floating-surface-state-manager';

const DEFAULT_SURFACE_SIZE: FloatingSurfaceSize = {
  height: 48,
  width: 420,
};

/** Coordinates selection, actions, positioning, execution, and state transitions. */
export class FloatingSurfaceController implements FloatingSurfaceControllerPort, Disposable {
  private readonly state = new FloatingSurfaceStateManager();
  private readonly positionEngine = new FloatingSurfacePositionEngine();
  private disposed = false;
  private surfaceSize = DEFAULT_SURFACE_SIZE;

  public constructor(
    private readonly adapter: FloatingSurfaceAdapter,
    private readonly events = new EventBus<FloatingSurfaceEventMap>(),
  ) {}

  /** Subscribes to controller state. */
  public subscribe(listener: FloatingSurfaceStateListener): Disposable {
    return this.state.subscribe(listener);
  }

  /** Returns current state snapshot. */
  public getSnapshot(): FloatingSurfaceState {
    return this.state.getSnapshot();
  }

  /** Updates measured rendered surface size. */
  public setSurfaceSize(size: FloatingSurfaceSize): void {
    this.surfaceSize = size;
    this.reposition();
  }

  /** Handles a newly detected selection. */
  public async handleSelection(selection: FloatingSurfaceSelection): Promise<void> {
    if (this.disposed) {
      return;
    }

    const context = extractPageContext(selection.text);
    this.state.setSelection(selection, context);
    await this.events.emit('floating.selection.changed', { selection });
    this.reposition();

    try {
      const actions = await this.adapter.getActions({ context, selection });
      this.state.setActions(actions);
      this.reposition();
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to load contextual actions.');
    }
  }

  /** Handles selection clearing. */
  public async clearSelection(reason: string): Promise<void> {
    this.state.clearSelection();
    await this.events.emit('floating.selection.cleared', { reason });
  }

  /** Executes an action by id. */
  public execute(actionId: string): void {
    void this.executeInternal(actionId);
  }

  /** Dismisses the surface for the current selection. */
  public dismiss(): void {
    const previous = this.state.getSnapshot().status;
    this.state.dismiss();
    void this.emitStatus(previous, 'dismissed');
  }

  /** Moves active action for keyboard navigation. */
  public moveActive(delta: number): void {
    this.state.moveActive(delta);
  }

  /** Recomputes current position. */
  public reposition(): void {
    const snapshot = this.state.getSnapshot();

    if (snapshot.selection === null) {
      return;
    }

    this.state.setPosition(
      this.positionEngine.compute(snapshot.selection, this.surfaceSize, readViewport()),
    );
  }

  /** Disposes runtime state. */
  public dispose(): void {
    this.disposed = true;
  }

  private async executeInternal(actionId: string): Promise<void> {
    const snapshot = this.state.getSnapshot();
    const action = snapshot.actions.find((candidate) => candidate.id === actionId);

    if (
      action === undefined ||
      snapshot.context === null ||
      snapshot.selection === null ||
      action.disabled === true
    ) {
      return;
    }

    const previous = snapshot.status;
    this.state.update({ status: 'executing' });
    await this.emitStatus(previous, 'executing');
    await this.events.emit('floating.action.started', { action });

    try {
      await this.adapter.executeAction({
        action,
        context: snapshot.context,
        selection: snapshot.selection,
      });
      this.state.update({ status: 'success' });
      await this.events.emit('floating.action.completed', { action });
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Action failed.');
      await this.events.emit('floating.action.failed', {
        action,
        error: error instanceof Error ? error.message : 'Action failed.',
      });
    }
  }

  private setError(message: string): void {
    this.state.update({
      error: message,
      status: 'error',
    });
  }

  private async emitStatus(
    previous: FloatingSurfaceStatus,
    next: FloatingSurfaceStatus,
  ): Promise<void> {
    await this.events.emit('floating.state.changed', { next, previous });
  }

  /** Subscribes to floating surface events. */
  public onEvent<Type extends FloatingSurfaceEventType>(
    type: Type,
    listener: (event: RuntimeEvent<Type, FloatingSurfaceEventMap[Type]>) => void | Promise<void>,
  ): Disposable {
    return this.events.on(type, listener);
  }
}
