/** Motion state classes used by the renderer. */
export interface FloatingSurfaceMotionState {
  /** True when motion should be minimized. */
  readonly reducedMotion: boolean;
  /** Initial animation scale. */
  readonly initialScale: number;
  /** Enter duration in seconds. */
  readonly enterDuration: number;
  /** Exit duration in seconds. */
  readonly exitDuration: number;
}

/** Owns animation policy and reduced-motion behavior. */
export class FloatingSurfaceAnimationManager {
  /** Returns motion settings derived from user preferences. */
  public getMotionState(): FloatingSurfaceMotionState {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      enterDuration: reducedMotion ? 0.01 : 0.14,
      exitDuration: reducedMotion ? 0.01 : 0.1,
      initialScale: reducedMotion ? 1 : 0.98,
      reducedMotion,
    };
  }
}
