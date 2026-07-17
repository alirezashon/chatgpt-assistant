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
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .surface {
    position: fixed;
    pointer-events: auto;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    background: rgba(18, 18, 21, 0.92);
    color: rgba(255, 255, 255, 0.96);
    box-shadow:
      0 24px 80px rgba(0, 0, 0, 0.34),
      0 1px 0 rgba(255, 255, 255, 0.08) inset;
    -webkit-backdrop-filter: blur(18px);
    backdrop-filter: blur(18px);
    padding: 6px;
    outline: none;
  }

  .actionRow {
    display: flex;
    align-items: center;
    gap: 4px;
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
    border-radius: 9px;
    background: transparent;
    color: rgba(255, 255, 255, 0.82);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 560;
    line-height: 1;
    padding: 0 9px;
    transition:
      background 100ms ease,
      color 100ms ease,
      transform 80ms ease;
  }

  .actionButton:hover,
  .actionButton.active {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.98);
  }

  .actionButton:focus-visible {
    outline: 2px solid rgba(125, 168, 255, 0.95);
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
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 5px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 10px;
    line-height: 1;
    padding: 2px 4px;
  }

  .errorText {
    width: 100%;
    color: rgb(255, 196, 196);
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
