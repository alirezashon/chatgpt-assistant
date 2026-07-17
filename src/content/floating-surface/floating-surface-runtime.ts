import { DisposableStore, debounce, type Disposable } from '@/runtime';

import { EmptyFloatingSurfaceAdapter } from './floating-surface-adapter';
import { FloatingSurfaceController } from './floating-surface-controller';
import { ReactFloatingSurfaceRenderer } from './floating-surface-renderer';
import { readCurrentSelection } from './floating-surface-selection';
import type { FloatingSurfaceAdapter } from './floating-surface-types';

const SELECTION_DEBOUNCE_MS = 90;

/** Runtime installer for the contextual floating action surface. */
export class FloatingSurfaceRuntime implements Disposable {
  private readonly disposables = new DisposableStore();
  private readonly controller: FloatingSurfaceController;
  private readonly renderer: ReactFloatingSurfaceRenderer;

  public constructor(adapter: FloatingSurfaceAdapter = new EmptyFloatingSurfaceAdapter()) {
    this.controller = new FloatingSurfaceController(adapter);
    this.renderer = new ReactFloatingSurfaceRenderer();
  }

  /** Installs DOM listeners and mounts the isolated renderer. */
  public install(): void {
    this.renderer.mount(this.controller);
    this.disposables.add(this.renderer);
    this.disposables.add(
      this.controller.subscribe((state) => {
        this.renderer.render(state);
      }),
    );

    const detectSelection = debounce(() => {
      void this.refreshSelection();
    }, SELECTION_DEBOUNCE_MS);

    document.addEventListener('selectionchange', detectSelection, { passive: true });
    document.addEventListener('keyup', detectSelection, { passive: true });
    window.addEventListener('scroll', this.handleReposition, { passive: true });
    window.addEventListener('resize', this.handleReposition, { passive: true });
    window.visualViewport?.addEventListener('resize', this.handleReposition, { passive: true });
    window.visualViewport?.addEventListener('scroll', this.handleReposition, { passive: true });

    this.disposables.add({
      dispose: () => {
        document.removeEventListener('selectionchange', detectSelection);
        document.removeEventListener('keyup', detectSelection);
        window.removeEventListener('scroll', this.handleReposition);
        window.removeEventListener('resize', this.handleReposition);
        window.visualViewport?.removeEventListener('resize', this.handleReposition);
        window.visualViewport?.removeEventListener('scroll', this.handleReposition);
      },
    });
  }

  /** Disposes listeners and renderer. */
  public async dispose(): Promise<void> {
    await this.disposables.dispose();
    this.controller.dispose();
  }

  private readonly handleReposition = () => {
    this.controller.reposition();
  };

  private async refreshSelection(): Promise<void> {
    const selection = readCurrentSelection();

    if (selection === null) {
      await this.controller.clearSelection('selection cleared');
      return;
    }

    await this.controller.handleSelection(selection);
  }
}
