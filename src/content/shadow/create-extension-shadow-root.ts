import { ANIMATION_DURATIONS, UI_CSS_VARIABLES, UI_DIMENSIONS } from '@/constants/ui';
import { DEFAULT_SETTINGS } from '@/constants/settings';
import { getWorkspaceThemePreset } from '@/constants/theme-presets';
import type { WorkspaceSettings } from '@/shared/types';

const HOST_ID = 'chatgpt-workspace-root';
const MOUNT_ID = 'chatgpt-workspace-app';

interface ExtensionShadowRoot {
  hostElement: HTMLDivElement;
  mountElement: HTMLDivElement;
  shadowRoot: ShadowRoot;
}

export function createExtensionShadowRoot(styles: string): ExtensionShadowRoot {
  const existingHost = document.getElementById(HOST_ID);
  existingHost?.remove();

  const hostElement = document.createElement('div');
  hostElement.id = HOST_ID;
  applyDesignTokens(hostElement);
  document.documentElement.append(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;

  const mountElement = document.createElement('div');
  mountElement.id = MOUNT_ID;

  shadowRoot.append(styleElement, mountElement);

  return {
    hostElement,
    mountElement,
    shadowRoot,
  };
}

export function applyWorkspaceThemeTokens(
  hostElement: HTMLElement,
  settings: WorkspaceSettings = DEFAULT_SETTINGS,
): void {
  const preset = getWorkspaceThemePreset(settings.themePreset);

  hostElement.style.setProperty(UI_CSS_VARIABLES.accent, preset.accent);
  hostElement.style.setProperty(UI_CSS_VARIABLES.border, preset.border);
  hostElement.style.setProperty(UI_CSS_VARIABLES.button, preset.button);
  hostElement.style.setProperty(UI_CSS_VARIABLES.buttonText, preset.buttonText);
  hostElement.style.setProperty(UI_CSS_VARIABLES.muted, preset.muted);
  hostElement.style.setProperty(UI_CSS_VARIABLES.surface, preset.surface);
  hostElement.style.setProperty(UI_CSS_VARIABLES.text, preset.text);
  hostElement.style.setProperty(UI_CSS_VARIABLES.sidebarWidth, toPixels(settings.sidebarWidth));
}

function applyDesignTokens(hostElement: HTMLElement): void {
  hostElement.style.setProperty(
    UI_CSS_VARIABLES.animationFast,
    toMilliseconds(ANIMATION_DURATIONS.fast),
  );
  hostElement.style.setProperty(
    UI_CSS_VARIABLES.animationNormal,
    toMilliseconds(ANIMATION_DURATIONS.normal),
  );
  hostElement.style.setProperty(UI_CSS_VARIABLES.edgeOffset, toPixels(UI_DIMENSIONS.edgeOffset));
  hostElement.style.setProperty(
    UI_CSS_VARIABLES.floatingButtonSize,
    toPixels(UI_DIMENSIONS.floatingButtonSize),
  );
  hostElement.style.setProperty(
    UI_CSS_VARIABLES.sidebarBorderRadius,
    toPixels(UI_DIMENSIONS.sidebarBorderRadius),
  );
  hostElement.style.setProperty(
    UI_CSS_VARIABLES.sidebarClosedOffset,
    toPixels(UI_DIMENSIONS.sidebarClosedOffset),
  );
  applyWorkspaceThemeTokens(hostElement);
}

function toMilliseconds(value: number): string {
  return value.toString().concat('ms');
}

function toPixels(value: number): string {
  return value.toString().concat('px');
}
