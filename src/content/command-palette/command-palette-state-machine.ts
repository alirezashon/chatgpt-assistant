import { RuntimeError } from '@/runtime';

import type { CommandPaletteState, CommandPaletteStatus } from './command-palette-types';

const ALLOWED_TRANSITIONS: Readonly<Record<CommandPaletteStatus, readonly CommandPaletteStatus[]>> =
  {
    ArgumentsRequired: ['Closing', 'Executing', 'Searching'],
    Closed: ['Opening'],
    Closing: ['Closed'],
    CommandSelected: ['ArgumentsRequired', 'Closing', 'Executing', 'Searching'],
    Error: ['Closing', 'Searching'],
    Executing: ['Error', 'Streaming', 'Success'],
    Loading: ['Error', 'ResultsReady', 'Searching'],
    Opening: ['Loading', 'Searching'],
    ResultsReady: ['Closing', 'CommandSelected', 'Executing', 'Searching'],
    Searching: ['Error', 'ResultsReady'],
    Streaming: ['Error', 'Success'],
    Success: ['Closing', 'Searching'],
  };

/** Explicit state machine for command palette lifecycle. */
export class CommandPaletteStateMachine {
  private state: CommandPaletteState = {
    activeIndex: -1,
    argumentValues: {},
    commands: [],
    context: null,
    error: null,
    favoriteCommandIds: [],
    query: '',
    recentCommandIds: [],
    results: [],
    selectedCommand: null,
    status: 'Closed',
  };

  /** Returns current state. */
  public getSnapshot(): CommandPaletteState {
    return this.state;
  }

  /** Transitions to a new explicit state. */
  public transition(
    status: CommandPaletteStatus,
    patch: Partial<CommandPaletteState> = {},
  ): CommandPaletteState {
    if (!ALLOWED_TRANSITIONS[this.state.status].includes(status)) {
      throw new RuntimeError(
        'INVALID_STATE',
        `Invalid command palette transition ${this.state.status} -> ${status}`,
      );
    }

    this.state = {
      ...this.state,
      ...patch,
      status,
    };

    return this.state;
  }

  /** Replaces state without transition validation for internal initialization. */
  public replace(patch: Partial<CommandPaletteState>): CommandPaletteState {
    this.state = {
      ...this.state,
      ...patch,
    };

    return this.state;
  }
}
