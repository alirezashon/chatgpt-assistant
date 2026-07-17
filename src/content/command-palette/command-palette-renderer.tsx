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
    --ds-color-background: #09090b;
    --ds-color-surface: rgba(18, 18, 21, 0.94);
    --ds-color-panel: rgba(255, 255, 255, 0.06);
    --ds-color-border: rgba(255, 255, 255, 0.13);
    --ds-color-border-muted: rgba(255, 255, 255, 0.08);
    --ds-color-text: rgba(255, 255, 255, 0.96);
    --ds-color-text-muted: rgba(255, 255, 255, 0.52);
    --ds-color-text-subtle: rgba(255, 255, 255, 0.38);
    --ds-color-hover: rgba(255, 255, 255, 0.1);
    --ds-color-overlay: rgba(0, 0, 0, 0.18);
    --ds-color-focus: rgba(125, 211, 252, 0.95);
    --ds-radius-sm: 6px;
    --ds-radius-md: 10px;
    --ds-radius-lg: 16px;
    --ds-space-2: 8px;
    --ds-space-3: 12px;
    --ds-space-4: 16px;
    --ds-shadow-floating: 0 32px 120px rgba(0, 0, 0, 0.44), 0 1px 0 rgba(255, 255, 255, 0.08) inset;
    --ds-blur-panel: 22px;
    --ds-duration-fast: 120ms;
    --ds-ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
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
    background: var(--ds-color-overlay);
    pointer-events: auto;
  }

  .palette {
    width: min(720px, calc(100vw - 32px));
    overflow: hidden;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-color-surface);
    color: var(--ds-color-text);
    box-shadow: var(--ds-shadow-floating);
    -webkit-backdrop-filter: blur(var(--ds-blur-panel));
    backdrop-filter: blur(var(--ds-blur-panel));
    transform-origin: top center;
  }

  .searchRow {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--ds-space-3);
    border-bottom: 1px solid var(--ds-color-border-muted);
    padding: 14px var(--ds-space-4);
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
    color: var(--ds-color-text-subtle);
  }

  .results {
    max-height: min(58vh, 520px);
    overflow: auto;
    padding: var(--ds-space-2);
    scrollbar-width: thin;
  }

  .section {
    padding: 4px 0 8px;
  }

  .section + .section {
    border-top: 1px solid var(--ds-color-border-muted);
    padding-top: 10px;
  }

  .sectionHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 8px 8px;
    color: var(--ds-color-text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .sectionRows {
    display: grid;
    gap: 2px;
  }

  .row {
    width: 100%;
    border: 0;
    appearance: none;
    cursor: default;
    display: grid;
    grid-template-columns: 36px 1fr auto;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    border-radius: var(--ds-radius-md);
    background: transparent;
    padding: 7px 9px;
    color: rgba(255, 255, 255, 0.74);
    font: inherit;
    text-align: left;
    transition:
      background var(--ds-duration-fast) var(--ds-ease-standard),
      color var(--ds-duration-fast) var(--ds-ease-standard),
      transform var(--ds-duration-fast) var(--ds-ease-standard);
  }

  .row.active {
    background: linear-gradient(135deg, rgba(125, 211, 252, 0.14), rgba(255, 255, 255, 0.08));
    color: var(--ds-color-text);
    box-shadow: 0 0 0 1px rgba(125, 211, 252, 0.24) inset;
  }

  .row:hover {
    background: var(--ds-color-hover);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--ds-color-panel);
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
    color: var(--ds-color-text-muted);
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
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-sm);
    color: var(--ds-color-text-muted);
    font-size: 10px;
    line-height: 1;
    padding: 3px 5px;
  }

  .favorite {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-sm);
    background: rgba(255, 255, 255, 0.04);
    color: var(--ds-color-text-subtle);
  }

  .favorite:hover,
  .activeFavorite {
    color: rgba(250, 204, 21, 0.95);
    border-color: rgba(250, 204, 21, 0.28);
    background: rgba(250, 204, 21, 0.08);
  }

  .empty {
    color: var(--ds-color-text-muted);
    font-size: 13px;
    padding: 28px 16px;
    text-align: center;
  }

  .footerHints {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    border-top: 1px solid var(--ds-color-border-muted);
    padding: 9px 12px 11px;
    color: var(--ds-color-text-subtle);
    font-size: 11px;
  }

  .footerHints span {
    border: 1px solid var(--ds-color-border-muted);
    border-radius: var(--ds-radius-sm);
    padding: 3px 6px;
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
