import { describe, expect, it } from 'vitest';

import { FloatingSurfacePositionEngine } from './floating-surface-position-engine';
import type { FloatingSurfaceSelection } from './floating-surface-types';

describe('FloatingSurfacePositionEngine', () => {
  it('places the surface above a centered selection when space allows', () => {
    const engine = new FloatingSurfacePositionEngine();
    const position = engine.compute(
      createSelection(rect(300, 300, 120, 20)),
      {
        height: 48,
        width: 240,
      },
      {
        height: 800,
        offsetLeft: 0,
        offsetTop: 0,
        width: 1000,
      },
    );

    expect(position.placement).toBe('top');
    expect(position.clamped).toBe(false);
    expect(position.x).toBe(240);
    expect(position.y).toBe(242);
  });

  it('clamps the surface inside viewport boundaries', () => {
    const engine = new FloatingSurfacePositionEngine();
    const position = engine.compute(
      createSelection(rect(4, 4, 20, 12)),
      {
        height: 80,
        width: 300,
      },
      {
        height: 200,
        offsetLeft: 0,
        offsetTop: 0,
        width: 320,
      },
    );

    expect(position.clamped).toBe(true);
    expect(position.x).toBeGreaterThanOrEqual(8);
    expect(position.y).toBeGreaterThanOrEqual(8);
  });
});

function createSelection(boundingRect: DOMRectReadOnly): FloatingSurfaceSelection {
  return {
    boundingRect,
    codeLike: false,
    editable: false,
    rects: [boundingRect],
    text: 'Selected text',
  };
}

function rect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return DOMRectReadOnly.fromRect({ height, width, x, y });
}
