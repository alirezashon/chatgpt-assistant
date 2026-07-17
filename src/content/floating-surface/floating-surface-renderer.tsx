import { createRoot, type Root } from 'react-dom/client';

import { FloatingSurfaceAccessibility } from './floating-surface-accessibility';
import { FloatingSurfaceAnimationManager } from './floating-surface-animation-manager';
import type {
  FloatingSurfaceControllerPort,
  FloatingSurfaceRenderer as FloatingSurfaceRendererContract,
  FloatingSurfaceState,
} from './floating-surface-types';
import { FloatingSurfaceView } from './floating-surface-view';

const HOST_ID = 'ai-productivity-floating-surface-root';

/** React/Shadow DOM renderer for the contextual floating action surface. */
export class ReactFloatingSurfaceRenderer implements FloatingSurfaceRendererContract {
  private readonly accessibility = new FloatingSurfaceAccessibility();
  private readonly animation = new FloatingSurfaceAnimationManager();
  private host: HTMLElement | null = null;
  private mountElement: HTMLElement | null = null;
  private root: Root | null = null;
  private controller: FloatingSurfaceControllerPort | null = null;

  /** Mounts the renderer into an isolated Shadow DOM host. */
  public mount(controller: FloatingSurfaceControllerPort): void {
    this.controller = controller;

    const existing = document.getElementById(HOST_ID);

    if (existing !== null) {
      existing.remove();
    }

    this.host = document.createElement('div');
    this.host.id = HOST_ID;
    this.host.style.position = 'fixed';
    this.host.style.left = '0';
    this.host.style.top = '0';
    this.host.style.zIndex = '2147483647';
    this.host.style.pointerEvents = 'none';

    const shadowRoot = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    this.mountElement = document.createElement('div');
    shadowRoot.append(style, this.mountElement);
    document.documentElement.append(this.host);
    this.root = createRoot(this.mountElement);
  }

  /** Renders the current state. */
  public render(state: FloatingSurfaceState): void {
    if (this.root === null || this.controller === null) {
      return;
    }

    this.root.render(
      <FloatingSurfaceView
        accessibility={this.accessibility}
        controller={this.controller}
        motionState={this.animation.getMotionState()}
        state={state}
      />,
    );
  }

  /** Unmounts and removes the isolated host. */
  public dispose(): void {
    this.root?.unmount();
    this.host?.remove();
    this.root = null;
    this.host = null;
    this.mountElement = null;
  }
}

const SHADOW_CSS = `
  :host {
    all: initial;
    color-scheme: light dark;
    --ds-color-surface: rgba(18, 18, 21, 0.92);
    --ds-color-border: rgba(255, 255, 255, 0.14);
    --ds-color-text: rgba(255, 255, 255, 0.96);
    --ds-color-text-muted: rgba(255, 255, 255, 0.5);
    --ds-color-hover: rgba(255, 255, 255, 0.1);
    --ds-color-focus: rgba(125, 211, 252, 0.95);
    --ds-color-danger: rgb(255, 196, 196);
    --ds-radius-sm: 5px;
    --ds-radius-md: 9px;
    --ds-radius-lg: 14px;
    --ds-space-1: 4px;
    --ds-space-2: 8px;
    --ds-shadow-floating: 0 24px 80px rgba(0, 0, 0, 0.34), 0 1px 0 rgba(255, 255, 255, 0.08) inset;
    --ds-blur-panel: 18px;
    --ds-duration-fast: 100ms;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .surface {
    position: fixed;
    pointer-events: auto;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-color-surface);
    color: var(--ds-color-text);
    box-shadow: var(--ds-shadow-floating);
    -webkit-backdrop-filter: blur(var(--ds-blur-panel));
    backdrop-filter: blur(var(--ds-blur-panel));
    padding: 6px;
    outline: none;
  }

  .actionRow {
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
    min-height: 38px;
    overflow: hidden;
  }

  .actionButton {
    appearance: none;
    min-width: 0;
    height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: rgba(255, 255, 255, 0.82);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 560;
    line-height: 1;
    padding: 0 9px;
    transition:
      background var(--ds-duration-fast) ease,
      color var(--ds-duration-fast) ease,
      transform 80ms ease;
  }

  .actionButton:hover,
  .actionButton.active {
    background: var(--ds-color-hover);
    color: var(--ds-color-text);
  }

  .actionButton:focus-visible {
    outline: 2px solid var(--ds-color-focus);
    outline-offset: 2px;
  }

  .actionButton:active {
    transform: translateY(1px);
  }

  .actionButton:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .iconWrap {
    display: inline-flex;
    flex: 0 0 auto;
  }

  .label {
    display: block;
    min-width: 0;
    max-width: 94px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kbd {
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-sm);
    color: var(--ds-color-text-muted);
    font-size: 10px;
    line-height: 1;
    padding: 2px 4px;
  }

  .errorText {
    width: 100%;
    color: var(--ds-color-danger);
    font-size: 12px;
    font-weight: 520;
    padding: 8px 10px;
  }

  .spin {
    animation: spin 800ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .surface,
    .actionButton,
    .spin {
      animation: none;
      transition: none;
    }
  }

  @media (prefers-contrast: more) {
    .surface {
      border-color: white;
      background: black;
    }
  }
`;
