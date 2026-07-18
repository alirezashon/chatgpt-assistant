import { normalizeError } from '@/lib/errors';

interface ChromeRuntimeLike {
  readonly runtime?: typeof chrome.runtime;
}

interface ChromeTabsLike {
  readonly tabs?: typeof chrome.tabs;
}

interface ChromeContextMenusLike {
  readonly contextMenus?: typeof chrome.contextMenus;
}

interface ChromeSidePanelOptions {
  readonly enabled?: boolean;
  readonly path?: string;
  readonly tabId?: number;
}

interface ChromeSidePanelLike {
  readonly sidePanel?: {
    open(input: { readonly windowId?: number }): Promise<void>;
    setOptions(input: ChromeSidePanelOptions): Promise<void>;
  };
}

interface ChromePermissionsLike {
  readonly permissions?: typeof chrome.permissions;
}

interface ChromeScriptingLike {
  readonly scripting?: typeof chrome.scripting;
}

export function hasChromeRuntime(): boolean {
  const candidate = globalThis.chrome as ChromeRuntimeLike | undefined;

  return candidate?.runtime?.id !== undefined;
}

export function getExtensionUrl(path: string): string {
  const candidate = globalThis.chrome as ChromeRuntimeLike | undefined;

  return candidate?.runtime?.getURL(path) ?? path;
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const candidate = globalThis.chrome as ChromeTabsLike | undefined;

  if (candidate?.tabs === undefined) {
    return null;
  }

  const tabs = await candidate.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0] ?? null;
}

export async function getTab(tabId: number): Promise<chrome.tabs.Tab | null> {
  const candidate = globalThis.chrome as ChromeTabsLike | undefined;

  if (candidate?.tabs === undefined) {
    return null;
  }

  return candidate.tabs.get(tabId);
}

export async function sendRuntimeMessage<Response>(message: unknown): Promise<Response> {
  const chromeGlobal = (globalThis as { readonly chrome?: unknown }).chrome;

  if (typeof chromeGlobal !== 'object' || chromeGlobal === null) {
    throw new Error('Chrome runtime is unavailable.');
  }

  const candidate = chromeGlobal as {
    readonly runtime?: {
      readonly sendMessage?: unknown;
    };
  };

  if (typeof candidate.runtime?.sendMessage !== 'function') {
    throw new Error('Chrome runtime messaging is unavailable.');
  }

  const response = await (candidate.runtime.sendMessage as (input: unknown) => Promise<unknown>)(
    message,
  );

  return response as Response;
}

export async function sendTabMessage<Response>(tabId: number, message: unknown): Promise<Response> {
  const chromeGlobal = (globalThis as { readonly chrome?: unknown }).chrome;

  if (typeof chromeGlobal !== 'object' || chromeGlobal === null) {
    throw new Error('Chrome tabs API is unavailable.');
  }

  const candidate = chromeGlobal as {
    readonly tabs?: {
      readonly sendMessage?: unknown;
    };
  };

  if (typeof candidate.tabs?.sendMessage !== 'function') {
    throw new Error('Chrome tab messaging is unavailable.');
  }

  const response = await (
    candidate.tabs.sendMessage as (targetTabId: number, input: unknown) => Promise<unknown>
  )(tabId, message);

  return response as Response;
}

export async function containsPermissions(input: chrome.permissions.Permissions): Promise<boolean> {
  const candidate = globalThis.chrome as ChromePermissionsLike | undefined;

  if (candidate?.permissions === undefined) {
    return true;
  }

  return candidate.permissions.contains(input);
}

export async function requestPermissions(input: chrome.permissions.Permissions): Promise<boolean> {
  const candidate = globalThis.chrome as ChromePermissionsLike | undefined;

  if (candidate?.permissions === undefined) {
    return true;
  }

  return candidate.permissions.request(input);
}

export async function executeScript<Args extends unknown[], Result>(
  input: chrome.scripting.ScriptInjection<Args, Result>,
): Promise<readonly chrome.scripting.InjectionResult<Awaited<Result>>[]> {
  const candidate = globalThis.chrome as ChromeScriptingLike | undefined;

  if (candidate?.scripting === undefined) {
    throw new Error('Chrome scripting API is unavailable.');
  }

  const results = await candidate.scripting.executeScript(input);

  return results as readonly chrome.scripting.InjectionResult<Awaited<Result>>[];
}

export async function openOptionsPage(): Promise<void> {
  const candidate = globalThis.chrome as ChromeRuntimeLike | undefined;

  if (candidate?.runtime?.openOptionsPage === undefined) {
    throw new Error('Chrome options page API is unavailable.');
  }

  await candidate.runtime.openOptionsPage();
}

export async function openTab(url: string): Promise<void> {
  const candidate = globalThis.chrome as ChromeTabsLike | undefined;

  if (candidate?.tabs === undefined) {
    throw new Error('Chrome tabs API is unavailable.');
  }

  await candidate.tabs.create({ url });
}

export async function activateTab(tabId: number): Promise<void> {
  const candidate = globalThis.chrome as ChromeTabsLike | undefined;

  if (candidate?.tabs === undefined) {
    return;
  }

  await candidate.tabs.update(tabId, { active: true });
}

export function createContextMenu(input: chrome.contextMenus.CreateProperties): void {
  const candidate = globalThis.chrome as ChromeContextMenusLike | undefined;

  if (candidate?.contextMenus === undefined) {
    return;
  }

  candidate.contextMenus.create(input, () => {
    const message = chrome.runtime.lastError?.message;

    if (message !== undefined && !message.includes('duplicate id')) {
      console.warn('Failed to create context menu:', message);
    }
  });
}

export async function configureSidePanel(input: ChromeSidePanelOptions): Promise<void> {
  const candidate = globalThis.chrome as ChromeSidePanelLike | undefined;

  if (candidate?.sidePanel === undefined) {
    return;
  }

  await candidate.sidePanel.setOptions(input);
}

export async function openSidePanel(windowId?: number): Promise<void> {
  const candidate = globalThis.chrome as ChromeSidePanelLike | undefined;

  if (candidate?.sidePanel === undefined) {
    return;
  }

  await candidate.sidePanel.open(windowId === undefined ? {} : { windowId });
}

export function reportChromeApiError(error: unknown): void {
  const normalized = normalizeError(error);

  console.error(`[Chrome API] ${normalized.name}: ${normalized.message}`);
}
