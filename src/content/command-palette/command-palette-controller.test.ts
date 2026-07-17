import { describe, expect, it } from 'vitest';

import { FunctionCommandExecutionBridge } from './command-execution-bridge';
import { CommandPaletteController } from './command-palette-controller';
import { StaticCommandSource } from './static-command-source';
import { TEST_COMMANDS } from './command-palette-fixtures';

describe('CommandPaletteController', () => {
  it('opens, searches, and executes through the bridge', async () => {
    let executed = '';
    const controller = new CommandPaletteController(
      new StaticCommandSource(TEST_COMMANDS),
      new FunctionCommandExecutionBridge({
        'core.code.debug': (command) => {
          executed = command.id;
        },
      }),
    );
    const success = new Promise<void>((resolve) => {
      controller.subscribe((state) => {
        if (state.status === 'Success') {
          resolve();
        }
      });
    });

    await controller.open('debug');
    controller.confirm();
    await success;

    expect(executed).toBe('core.code.debug');
    expect(controller.getSnapshot().status).toBe('Success');
  });

  it('moves to ArgumentsRequired when required arguments are missing', async () => {
    const states: string[] = [];
    const controller = new CommandPaletteController(new StaticCommandSource(TEST_COMMANDS));
    controller.subscribe((state) => {
      states.push(state.status);
    });

    await controller.open('rewrite');
    controller.confirm();

    expect(states).toContain('ArgumentsRequired');
  });
});
