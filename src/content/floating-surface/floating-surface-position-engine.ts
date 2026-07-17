import type {
  FloatingSurfacePosition,
  FloatingSurfaceSelection,
  FloatingSurfaceSize,
  FloatingSurfaceViewport,
} from './floating-surface-types';

const DEFAULT_GAP = 10;
const VIEWPORT_PADDING = 8;

/** Pure collision-aware position engine for floating surfaces. */
export class FloatingSurfacePositionEngine {
  /** Computes a safe viewport position for a selection and surface size. */
  public compute(
    selection: FloatingSurfaceSelection,
    size: FloatingSurfaceSize,
    viewport: FloatingSurfaceViewport = readViewport(),
  ): FloatingSurfacePosition {
    const rect = selection.boundingRect;
    const candidates: readonly FloatingSurfacePosition[] = [
      {
        clamped: false,
        placement: 'top',
        x: rect.left + rect.width / 2 - size.width / 2,
        y: rect.top - size.height - DEFAULT_GAP,
      },
      {
        clamped: false,
        placement: 'bottom',
        x: rect.left + rect.width / 2 - size.width / 2,
        y: rect.bottom + DEFAULT_GAP,
      },
      {
        clamped: false,
        placement: 'right',
        x: rect.right + DEFAULT_GAP,
        y: rect.top + rect.height / 2 - size.height / 2,
      },
      {
        clamped: false,
        placement: 'left',
        x: rect.left - size.width - DEFAULT_GAP,
        y: rect.top + rect.height / 2 - size.height / 2,
      },
    ];

    const fitting = candidates.find((candidate) => fits(candidate, size, viewport));

    if (fitting !== undefined) {
      return fitting;
    }

    return clampPosition(
      {
        clamped: false,
        placement: 'top',
        x: rect.left + rect.width / 2 - size.width / 2,
        y: rect.top - size.height - DEFAULT_GAP,
      },
      size,
      viewport,
    );
  }
}

/** Reads current visual viewport dimensions. */
export function readViewport(): FloatingSurfaceViewport {
  const visualViewport = window.visualViewport;

  return {
    height: visualViewport?.height ?? window.innerHeight,
    offsetLeft: visualViewport?.offsetLeft ?? 0,
    offsetTop: visualViewport?.offsetTop ?? 0,
    width: visualViewport?.width ?? window.innerWidth,
  };
}

function fits(
  position: FloatingSurfacePosition,
  size: FloatingSurfaceSize,
  viewport: FloatingSurfaceViewport,
): boolean {
  const minX = viewport.offsetLeft + VIEWPORT_PADDING;
  const minY = viewport.offsetTop + VIEWPORT_PADDING;
  const maxX = viewport.offsetLeft + viewport.width - VIEWPORT_PADDING;
  const maxY = viewport.offsetTop + viewport.height - VIEWPORT_PADDING;

  return (
    position.x >= minX &&
    position.y >= minY &&
    position.x + size.width <= maxX &&
    position.y + size.height <= maxY
  );
}

function clampPosition(
  position: FloatingSurfacePosition,
  size: FloatingSurfaceSize,
  viewport: FloatingSurfaceViewport,
): FloatingSurfacePosition {
  const minX = viewport.offsetLeft + VIEWPORT_PADDING;
  const minY = viewport.offsetTop + VIEWPORT_PADDING;
  const maxX = viewport.offsetLeft + viewport.width - size.width - VIEWPORT_PADDING;
  const maxY = viewport.offsetTop + viewport.height - size.height - VIEWPORT_PADDING;

  return {
    clamped: true,
    placement: position.placement,
    x: clamp(position.x, minX, Math.max(minX, maxX)),
    y: clamp(position.y, minY, Math.max(minY, maxY)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
