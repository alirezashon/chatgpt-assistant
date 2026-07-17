import { useEffect, useState } from 'react';

import { APP_NAME, APP_VERSION } from '@/constants/app';
import { PRIMARY_WORKSPACE_URL, isSupportedWorkspaceUrl } from '@/constants/supported-sites';

const OPEN_SIDEBAR_MESSAGE = 'chatgpt-workspace:open-sidebar';

type PopupStatus = 'checking' | 'ready' | 'unsupported';

interface ActiveTabState {
  readonly status: PopupStatus;
  readonly url: string | null;
}

const FEATURE_CARDS: readonly (readonly [string, string])[] = [
  ['1. Open', 'Click the panel button on any ChatGPT page.'],
  ['2. Organize', 'Create folders and move the current chat.'],
  ['3. Plan', 'Use Tasks for follow-ups and exports.'],
  ['4. Move', 'Drag the round bubble anywhere.'],
];

export function PopupApp() {
  const [activeTab, setActiveTab] = useState<ActiveTabState>({
    status: 'checking',
    url: null,
  });
  const iconUrl = getExtensionAssetUrl('icons/icon-128.png');

  useEffect(() => {
    let cancelled = false;

    async function checkActiveTab() {
      const tab = await getActiveTab();
      const url = tab?.url ?? null;

      if (cancelled) {
        return;
      }

      setActiveTab({
        status: url !== null && isSupportedWorkspaceUrl(url) ? 'ready' : 'unsupported',
        url,
      });
    }

    void checkActiveTab();

    return () => {
      cancelled = true;
    };
  }, []);

  const isReady = activeTab.status === 'ready';

  return (
    <main
      className="w-[390px] overflow-hidden bg-[#f8fbfa] text-slate-950"
      aria-label={`${APP_NAME} popup`}
    >
      <section className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_56%,#fff7ed_100%)] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,#111827,#0f766e,#f59e0b)] p-2 text-white shadow-lg shadow-emerald-900/15">
              <img alt="" className="h-full w-full rounded-md" src={iconUrl} />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-normal">{APP_NAME}</h1>
              <p className="text-xs font-medium text-slate-600">
                Version {APP_VERSION} - local workspace
              </p>
            </div>
          </div>
          <StatusPill status={activeTab.status} />
        </div>

        <div className="mt-5 rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">
            {activeTab.status === 'checking'
              ? 'Checking the active tab...'
              : isReady
                ? 'Ready. Open the panel, then use the guide at the top.'
                : 'Open ChatGPT first. The workspace panel only runs there.'}
          </p>
          <p className="mt-2 break-all text-xs leading-5 text-slate-500">
            {activeTab.url ?? 'No active tab URL'}
          </p>
        </div>
      </section>

      <section className="grid gap-4 px-5 py-4">
        <div className="grid gap-2">
          <button
            className="h-11 w-full rounded-md bg-[linear-gradient(135deg,#111827,#0f766e)] px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isReady}
            type="button"
            onClick={() => {
              void openWorkspaceSidebar();
            }}
          >
            Open Workspace Panel
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:outline-none"
              type="button"
              onClick={() => {
                void openOptionsPage();
              }}
            >
              Settings
            </button>
            {isReady ? (
              <button
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:outline-none"
                type="button"
                onClick={() => {
                  window.close();
                }}
              >
                Close
              </button>
            ) : (
              <button
                className="h-10 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:outline-none"
                type="button"
                onClick={() => {
                  void openPrimaryWorkspace(activeTab.url);
                }}
              >
                Open ChatGPT
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FEATURE_CARDS.map(([title, body]) => (
            <div key={title} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{body}</p>
            </div>
          ))}
        </div>

        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-800">
          After reloading the extension, refresh open ChatGPT tabs once so the content script
          reconnects.
        </p>
      </section>
    </main>
  );
}

function StatusPill({ status }: { readonly status: PopupStatus }) {
  const ready = status === 'ready';

  return (
    <span
      className={[
        'rounded-md px-2.5 py-1 text-xs font-bold',
        ready
          ? 'bg-emerald-100 text-emerald-800'
          : status === 'checking'
            ? 'bg-slate-100 text-slate-600'
            : 'bg-amber-100 text-amber-800',
      ].join(' ')}
    >
      {ready ? 'Ready' : status === 'checking' ? 'Checking' : 'ChatGPT needed'}
    </span>
  );
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  if (!hasChromeTabs(globalThis.chrome)) {
    return null;
  }

  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0] ?? null;
}

async function openPrimaryWorkspace(currentUrl: string | null): Promise<void> {
  if (hasChromeTabs(globalThis.chrome) && currentUrl !== null) {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTab?.id !== undefined) {
      await chrome.tabs.update(activeTab.id, {
        url: PRIMARY_WORKSPACE_URL,
      });
      window.close();
      return;
    }
  }

  window.open(PRIMARY_WORKSPACE_URL, '_blank', 'noopener,noreferrer');
  window.close();
}

async function openWorkspaceSidebar(): Promise<void> {
  if (!hasChromeTabs(globalThis.chrome)) {
    window.close();
    return;
  }

  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (activeTab?.id !== undefined) {
    try {
      await chrome.tabs.sendMessage(activeTab.id, {
        type: OPEN_SIDEBAR_MESSAGE,
      });
    } catch {
      await chrome.tabs.reload(activeTab.id);
    }
  }

  window.close();
}

async function openOptionsPage(): Promise<void> {
  const chromeGlobal = globalThis.chrome;

  if (hasRuntimeOptions(chromeGlobal)) {
    await chromeGlobal.runtime.openOptionsPage();
    window.close();
    return;
  }

  window.open('options.html', '_blank', 'noopener,noreferrer');
  window.close();
}

function hasChromeTabs(value: unknown): value is typeof chrome {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'tabs' in value;
}

function getExtensionAssetUrl(path: string): string {
  const runtimeGlobal = globalThis as { readonly chrome?: unknown };

  if (hasRuntimeGetUrl(runtimeGlobal.chrome)) {
    return runtimeGlobal.chrome.runtime.getURL(path);
  }

  return path;
}

interface ChromeRuntimeGetUrl {
  readonly runtime: {
    getURL(path: string): string;
  };
}

function hasRuntimeGetUrl(value: unknown): value is ChromeRuntimeGetUrl {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    readonly runtime?: {
      readonly getURL?: unknown;
    };
  };

  return typeof candidate.runtime?.getURL === 'function';
}

interface ChromeRuntimeOptions {
  readonly runtime: {
    openOptionsPage(): Promise<void>;
  };
}

function hasRuntimeOptions(value: unknown): value is ChromeRuntimeOptions {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    readonly runtime?: {
      readonly openOptionsPage?: unknown;
    };
  };

  return typeof candidate.runtime?.openOptionsPage === 'function';
}
