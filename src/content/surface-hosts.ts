const HOST_ID = 'ai-productivity-layer-root';
const SLOT_IDS = [
  'command-palette',
  'floating-toolbar',
  'selection-toolbar',
  'inline-result',
] as const;

export function installSurfaceHosts(): ShadowRoot {
  const existingHost = document.getElementById(HOST_ID);

  if (existingHost?.shadowRoot !== null && existingHost?.shadowRoot !== undefined) {
    return existingHost.shadowRoot;
  }

  const host = document.createElement('div');

  host.id = HOST_ID;
  host.style.all = 'initial';
  host.style.position = 'relative';
  host.style.zIndex = '2147483647';

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');

  style.textContent = `
    :host {
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    [data-extension-slot] {
      all: initial;
      box-sizing: border-box;
      font-family: inherit;
    }
  `;

  shadowRoot.append(style);

  for (const slotId of SLOT_IDS) {
    const slot = document.createElement('div');

    slot.dataset['extensionSlot'] = slotId;
    shadowRoot.append(slot);
  }

  document.documentElement.append(host);

  return shadowRoot;
}
