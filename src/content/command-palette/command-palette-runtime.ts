import { DisposableStore, type Disposable } from '@/runtime';

import { CommandPaletteController } from './command-palette-controller';
import { CommandExecutionManager } from './command-execution-bridge';
import { ReactCommandPaletteRenderer } from './command-palette-renderer';
import { FirstPartyCommandSource } from './first-party-command-source';
import type {
  CommandPaletteCommandSource,
  CommandPaletteExecutionBridge,
} from './command-palette-types';

/** Runtime installer for the universal command palette surface. */
export class CommandPaletteRuntime implements Disposable {
  private readonly disposables = new DisposableStore();
  private readonly controller: CommandPaletteController;
  private readonly renderer = new ReactCommandPaletteRenderer();

  public constructor(
    source: CommandPaletteCommandSource = new FirstPartyCommandSource(),
    execution: CommandPaletteExecutionBridge = new CommandExecutionManager(),
  ) {
    this.controller = new CommandPaletteController(source, execution);
  }

  /** Installs renderer and state subscription. */
  public install(): void {
    this.renderer.mount(this.controller);
    this.disposables.add(this.renderer);
    this.disposables.add(
      this.controller.subscribe((state) => {
        this.renderer.render(state);
      }),
    );
  }

  /** Opens the palette. */
  public open(query = ''): void {
    void this.controller.open(query);
  }

  /** Disposes runtime resources. */
  public async dispose(): Promise<void> {
    await this.disposables.dispose();
    this.controller.dispose();
  }
}
