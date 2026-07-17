import { createRoot, type Root } from 'react-dom/client';

import type {
  CommandPaletteControllerPort,
  CommandPaletteRenderer as CommandPaletteRendererContract,
  CommandPaletteState,
} from './command-palette-types';
import { CommandPaletteView } from './command-palette-view';

const HOST_ID = 'ai-productivity-command-palette-root';

/** Shadow DOM React renderer for the command palette. */
export class ReactCommandPaletteRenderer implements CommandPaletteRendererContract {
  private host: HTMLElement | null = null;
  private mountElement: HTMLElement | null = null;
  private root: Root | null = null;
  private controller: CommandPaletteControllerPort | null = null;

  /** Mounts renderer in an isolated Shadow DOM host. */
  public mount(controller: CommandPaletteControllerPort): void {
    this.controller = controller;

    document.getElementById(HOST_ID)?.remove();

    this.host = document.createElement('div');
    this.host.id = HOST_ID;
    this.host.style.position = 'fixed';
    this.host.style.inset = '0';
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

  /** Renders state. */
  public render(state: CommandPaletteState): void {
    if (this.root === null || this.controller === null) {
      return;
    }

    this.root.render(<CommandPaletteView controller={this.controller} state={state} />);
  }

  /** Disposes renderer. */
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

  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: start center;
    padding-top: min(14vh, 116px);
    background: rgba(0, 0, 0, 0.18);
    pointer-events: auto;
  }

  .palette {
    width: min(720px, calc(100vw - 32px));
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 16px;
    background: rgba(18, 18, 21, 0.94);
    color: rgba(255, 255, 255, 0.96);
    box-shadow:
      0 32px 120px rgba(0, 0, 0, 0.44),
      0 1px 0 rgba(255, 255, 255, 0.08) inset;
    -webkit-backdrop-filter: blur(22px);
    backdrop-filter: blur(22px);
  }

  .searchRow {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 14px 16px;
  }

  input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 15px;
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.38);
  }

  .results {
    max-height: min(58vh, 520px);
    overflow: auto;
    padding: 8px;
  }

  .row {
    display: grid;
    grid-template-columns: 36px 1fr auto;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    border-radius: 10px;
    padding: 7px 9px;
    color: rgba(255, 255, 255, 0.74);
  }

  .row.active {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.98);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.08);
  }

  .copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .title,
  .description {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title {
    font-size: 13px;
    font-weight: 620;
  }

  .description {
    color: rgba(255, 255, 255, 0.45);
    font-size: 12px;
  }

  .meta {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .badge,
  .confidence,
  kbd {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.52);
    font-size: 10px;
    line-height: 1;
    padding: 3px 5px;
  }

  .empty {
    color: rgba(255, 255, 255, 0.48);
    font-size: 13px;
    padding: 28px 16px;
    text-align: center;
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
    .palette,
    .overlay,
    .spin {
      animation: none;
      transition: none;
    }
  }
`;
