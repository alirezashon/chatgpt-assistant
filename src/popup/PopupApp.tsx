import { useEffect, useState } from 'react';

import { APP_NAME, APP_VERSION } from '@/constants/app';
import { PRIMARY_WORKSPACE_URL, isSupportedWorkspaceUrl } from '@/constants/supported-sites';

type PopupStatus = 'checking' | 'ready' | 'unsupported';

interface ActiveTabState {
  readonly status: PopupStatus;
  readonly url: string | null;
}

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
      dir="rtl"
      className="w-80 overflow-hidden bg-slate-950 text-white"
      aria-label={`${APP_NAME} popup`}
    >
      <section className="relative isolate px-5 py-5">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,#22d3ee_0,#2563eb_34%,#0f172a_72%)]" />
        <div className="absolute top-4 left-4 -z-10 h-20 w-20 rounded-full bg-white/15 blur-2xl" />

        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-cyan-50 backdrop-blur">
            v{APP_VERSION}
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/15 p-1.5 shadow-lg shadow-slate-950/20 backdrop-blur">
            <img alt="" className="h-full w-full rounded-xl" src={iconUrl} />
          </span>
        </div>

        <div className="mt-5">
          <h1 className="text-xl font-bold tracking-normal">{APP_NAME}</h1>
          <p className="mt-2 text-sm leading-6 text-cyan-50/90">
            {activeTab.status === 'checking'
              ? 'در حال بررسی صفحه فعلی...'
              : isReady
                ? 'افزونه روی همین صفحه فعال است. از دکمه شناور داخل ChatGPT استفاده کنید.'
                : 'این افزونه فعلا فقط روی ChatGPT فعال می‌شود.'}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-cyan-50/80">وضعیت دامنه</span>
            <span
              className={[
                'rounded-full px-2.5 py-1 text-[11px] font-bold',
                isReady ? 'bg-emerald-300 text-emerald-950' : 'bg-amber-300 text-amber-950',
              ].join(' ')}
            >
              {isReady ? 'آماده' : 'نیاز به انتقال'}
            </span>
          </div>
          <p className="mt-3 break-all text-left text-[11px] leading-5 text-cyan-50/75" dir="ltr">
            {activeTab.url ?? 'No active tab URL'}
          </p>
        </div>

        {isReady ? (
          <button
            className="mt-5 h-11 w-full rounded-xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-50 focus-visible:ring-4 focus-visible:ring-white/35 focus-visible:outline-none"
            type="button"
            onClick={() => {
              window.close();
            }}
          >
            بستن
          </button>
        ) : (
          <button
            className="mt-5 h-11 w-full rounded-xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-50 focus-visible:ring-4 focus-visible:ring-white/35 focus-visible:outline-none"
            type="button"
            onClick={() => {
              void openPrimaryWorkspace(activeTab.url);
            }}
          >
            رفتن به ChatGPT
          </button>
        )}
      </section>
    </main>
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
