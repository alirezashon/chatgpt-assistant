import { describe, expect, it } from 'vitest';

import { FloatingSurfaceController } from './floating-surface-controller';
import type {
  FloatingSurfaceAction,
  FloatingSurfaceAdapter,
  FloatingSurfaceSelection,
} from './floating-surface-types';

const actions: readonly FloatingSurfaceAction[] = [
  {
    category: 'writing',
    confidence: 0.92,
    icon: 'write',
    id: 'test.rewrite',
    permission: 'allowed',
    title: 'Rewrite',
  },
  {
    category: 'research',
    confidence: 0.84,
    icon: 'document',
    id: 'test.summarize',
    permission: 'allowed',
    title: 'Summarize',
  },
];

describe('FloatingSurfaceController', () => {
  it('loads dynamic actions and supports active navigation', async () => {
    const controller = new FloatingSurfaceController(createAdapter());

    await controller.handleSelection(createSelection());

    expect(controller.getSnapshot().actions).toEqual(actions);
    expect(controller.getSnapshot().status).toBe('visible');

    controller.moveActive(1);

    expect(controller.getSnapshot().activeIndex).toBe(1);
  });

  it('delegates action execution to the adapter', async () => {
    let resolveExecution: (value: string) => void = () => undefined;
    const executed = new Promise<string>((resolve) => {
      resolveExecution = resolve;
    });
    const controller = new FloatingSurfaceController(
      createAdapter((action) => {
        resolveExecution(action.id);
      }),
    );

    await controller.handleSelection(createSelection());
    controller.execute('test.rewrite');
    await expect(executed).resolves.toBe('test.rewrite');
  });
});

function createAdapter(
  onExecute?: (action: FloatingSurfaceAction) => void,
): FloatingSurfaceAdapter {
  return {
    executeAction: ({ action }) => {
      onExecute?.(action);
    },
    getActions: () => actions,
  };
}

function createSelection(): FloatingSurfaceSelection {
  const boundingRect = DOMRectReadOnly.fromRect({
    height: 20,
    width: 100,
    x: 100,
    y: 100,
  });

  return {
    boundingRect,
    codeLike: false,
    editable: false,
    rects: [boundingRect],
    text: 'hello world',
  };
}
