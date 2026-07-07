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
