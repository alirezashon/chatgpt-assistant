import { describe, expect, it } from 'vitest';

import { CommandPaletteStateMachine } from './command-palette-state-machine';

describe('CommandPaletteStateMachine', () => {
  it('enforces explicit transitions', () => {
    const machine = new CommandPaletteStateMachine();

    machine.transition('Opening');
    machine.transition('Loading');
    machine.transition('ResultsReady');

    expect(machine.getSnapshot().status).toBe('ResultsReady');
    expect(() => {
      machine.transition('Streaming');
    }).toThrow('Invalid command palette transition');
  });
});
