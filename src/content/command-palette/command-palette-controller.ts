import type { Disposable } from '@/runtime';

import { CommandArgumentResolver } from './command-argument-resolver';
import { CommandContextProvider } from './command-context-provider';
import { CommandFavoriteManager } from './command-favorite-manager';
import { CommandHistoryManager } from './command-history-manager';
import {
  loadCommandPaletteState,
  saveCommandFavorites,
  saveCommandHistory,
} from './command-persistence';
import { CommandRecentManager } from './command-recent-manager';
import { CommandSearchEngine } from './command-search-engine';
import { NoopCommandExecutionBridge } from './command-execution-bridge';
import { CommandPaletteStateMachine } from './command-palette-state-machine';
import type {
  CommandPaletteCommandSource,
  CommandPaletteControllerPort,
  CommandPaletteExecutionBridge,
  CommandPaletteState,
  CommandPaletteStateListener,
  PaletteCommand,
} from './command-palette-types';

/** Headless controller for command palette behavior. */
export class CommandPaletteController implements CommandPaletteControllerPort, Disposable {
  private readonly stateMachine = new CommandPaletteStateMachine();
  private readonly search = new CommandSearchEngine();
  private readonly history = new CommandHistoryManager();
  private readonly favorites = new CommandFavoriteManager();
  private readonly recent = new CommandRecentManager(this.history);
  private readonly arguments = new CommandArgumentResolver();
  private readonly contextProvider = new CommandContextProvider();
  private readonly listeners = new Set<CommandPaletteStateListener>();
  private disposed = false;
  private hydrated = false;

  public constructor(
    private readonly source: CommandPaletteCommandSource,
    private readonly execution: CommandPaletteExecutionBridge = new NoopCommandExecutionBridge(),
  ) {}

  /** Opens and loads commands for current context. */
  public async open(initialQuery = ''): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.transition('Opening', { query: initialQuery });
    this.transition('Loading');
    await this.hydrate();
    const context = this.contextProvider.getCurrentContext();
    const commands = enrichWithUsage(await this.source.getCommands(context), this.history);
    this.stateMachine.replace({
      commands,
      context,
      favoriteCommandIds: this.favorites.all(),
      recentCommandIds: this.recent.ids(),
    });
    this.searchAndPublish(initialQuery);
  }

  /** Returns current state snapshot. */
  public getSnapshot(): CommandPaletteState {
    return this.stateMachine.getSnapshot();
  }

  /** Updates search query. */
  public setQuery(query: string): void {
    if (this.stateMachine.getSnapshot().status === 'Closed') {
      return;
    }

    this.searchAndPublish(query);
  }

  /** Moves active result. */
  public moveActive(delta: number): void {
    const state = this.stateMachine.getSnapshot();

    if (state.results.length === 0) {
      return;
    }

    const activeIndex = (state.activeIndex + delta + state.results.length) % state.results.length;
    this.stateMachine.replace({ activeIndex });
    this.emit();
  }

  /** Selects active command or executes if ready. */
  public confirm(): void {
    void this.confirmInternal();
  }

  /** Executes a visible command by id. */
  public execute(commandId: string): void {
    const state = this.stateMachine.getSnapshot();
    const result = state.results.find((candidate) => candidate.command.id === commandId);

    if (result === undefined) {
      return;
    }

    this.stateMachine.replace({
      activeIndex: state.results.indexOf(result),
    });
    this.emit();
    void this.executeCommand(result.command);
  }

  /** Closes palette. */
  public close(): void {
    const status = this.stateMachine.getSnapshot().status;

    if (status === 'Closed' || status === 'Closing') {
      return;
    }

    this.transition('Closing');
    this.transition('Closed', {
      activeIndex: -1,
      argumentValues: {},
      error: null,
      query: '',
      results: [],
      selectedCommand: null,
    });
  }

  /** Sets an argument value. */
  public setArgument(id: string, value: unknown): void {
    const state = this.stateMachine.getSnapshot();
    this.stateMachine.replace({
      argumentValues: {
        ...state.argumentValues,
        [id]: value,
      },
    });
    this.emit();
  }

  /** Toggles a favorite command. */
  public toggleFavorite(commandId: string): void {
    this.favorites.toggle(commandId);
    this.stateMachine.replace({
      favoriteCommandIds: this.favorites.all(),
    });
    this.searchAndPublish(this.stateMachine.getSnapshot().query);
    void saveCommandFavorites(this.favorites.all());
  }

  /** Subscribes to palette state. */
  public subscribe(listener: CommandPaletteStateListener): Disposable {
    this.listeners.add(listener);
    listener(this.stateMachine.getSnapshot());

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /** Adds a command to favorites. */
  public addFavorite(commandId: string): void {
    this.favorites.add(commandId);
    this.stateMachine.replace({
      favoriteCommandIds: this.favorites.all(),
    });
    this.searchAndPublish(this.stateMachine.getSnapshot().query);
    void saveCommandFavorites(this.favorites.all());
  }

  /** Disposes controller resources. */
  public dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  private searchAndPublish(query: string): void {
    this.transition('Searching', { query });
    const state = this.stateMachine.getSnapshot();
    const results = this.search.search({
      commands: state.commands,
      context: state.context,
      favorites: this.favorites,
      history: this.history,
      query,
    });
    this.transition('ResultsReady', {
      activeIndex: results.length === 0 ? -1 : 0,
      results,
    });
  }

  private async confirmInternal(): Promise<void> {
    const state = this.stateMachine.getSnapshot();
    const result = state.results[state.activeIndex];

    if (result === undefined) {
      return;
    }

    const command = result.command;
    const missing = this.arguments.getMissingArguments(command, state.argumentValues);

    if (missing.length > 0) {
      this.transition('CommandSelected', { selectedCommand: command });
      this.transition('ArgumentsRequired');
      return;
    }

    await this.executeCommand(command);
  }

  private async executeCommand(command: PaletteCommand): Promise<void> {
    const state = this.stateMachine.getSnapshot();

    this.transition('CommandSelected', { selectedCommand: command });
    this.transition('Executing');

    try {
      await this.execution.execute({
        arguments: state.argumentValues,
        command,
        context: state.context,
      });
      this.history.record(command.id, true);
      await saveCommandHistory(this.history.all());
      this.transition('Success');
      this.close();
    } catch (error) {
      this.history.record(command.id, false);
      await saveCommandHistory(this.history.all());
      this.transition('Error', {
        error: error instanceof Error ? error.message : 'Command failed.',
      });
    }
  }

  private async hydrate(): Promise<void> {
    if (this.hydrated) {
      return;
    }

    const persisted = await loadCommandPaletteState();
    this.history.replace(persisted.history);
    this.favorites.replace(persisted.favorites);
    this.hydrated = true;
  }

  private transition(
    status: Parameters<CommandPaletteStateMachine['transition']>[0],
    patch: Partial<CommandPaletteState> = {},
  ): void {
    this.stateMachine.transition(status, patch);
    this.emit();
  }

  private emit(): void {
    const state = this.stateMachine.getSnapshot();

    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

function enrichWithUsage(
  commands: readonly PaletteCommand[],
  history: CommandHistoryManager,
): readonly PaletteCommand[] {
  return commands.map((command) => ({
    ...command,
    usageCount: history.get(command.id)?.count ?? command.usageCount,
  }));
}
