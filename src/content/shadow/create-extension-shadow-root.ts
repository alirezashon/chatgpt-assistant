import { ANIMATION_DURATIONS, UI_CSS_VARIABLES, UI_DIMENSIONS } from '@/constants/ui';

const HOST_ID = 'chatgpt-workspace-root';
const MOUNT_ID = 'chatgpt-workspace-app';

interface ExtensionShadowRoot {
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
    mountElement,
    shadowRoot,
  };
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
  hostElement.style.setProperty(
    UI_CSS_VARIABLES.sidebarWidth,
    toPixels(UI_DIMENSIONS.sidebarWidth),
  );
}

function toMilliseconds(value: number): string {
  return value.toString().concat('ms');
}

function toPixels(value: number): string {
  return value.toString().concat('px');
}
