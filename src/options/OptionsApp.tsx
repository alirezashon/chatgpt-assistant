import { useEffect, useMemo, useState } from 'react';

import { APP_NAME, APP_VERSION } from '@/constants/app';
import { DEFAULT_SETTINGS } from '@/constants/settings';
import { STORAGE_KEYS } from '@/constants/storage';
import { ChromeStorageDriver } from '@/storage/chrome-storage-driver';
import type { WorkspaceSettings } from '@/shared/types';

type SaveStatus = 'error' | 'idle' | 'ready' | 'saving';

export function OptionsApp() {
  const storage = useMemo(() => createStorageDriver(), []);
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState<string>('Loading settings...');

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (storage === null) {
        setStatus('error');
        setMessage('Open the built extension options page to manage persisted settings.');
        return;
      }

      try {
        const storedSettings = await storage.get<WorkspaceSettings>(STORAGE_KEYS.settings);

        if (cancelled) {
          return;
        }

        setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
        setStatus('ready');
        setMessage('Settings are stored locally in Chrome.');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to load settings.');
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [storage]);

  async function saveSettings(nextSettings: WorkspaceSettings): Promise<void> {
    setSettings(nextSettings);

    if (storage === null) {
      setStatus('error');
      setMessage('Settings storage is unavailable outside the installed extension.');
      return;
    }

    setStatus('saving');
    setMessage('Saving settings...');

    try {
      await storage.set(STORAGE_KEYS.settings, nextSettings);
      setStatus('ready');
      setMessage('Settings saved.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to save settings.');
    }
  }

  const canPersist = storage !== null;

  return (
    <main aria-label={`${APP_NAME} options`} className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-slate-500">Version {APP_VERSION}</p>
          <h1 className="text-3xl font-semibold tracking-normal">{APP_NAME} Settings</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Manage the local workspace, plan status, privacy defaults, and extension behavior.
          </p>
        </header>

        <section
          aria-labelledby="account-plan-heading"
          className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[220px_1fr]"
        >
          <div>
            <h2 id="account-plan-heading" className="text-base font-semibold">
              Account and Plan
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Current access level.</p>
          </div>
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Current plan</p>
                <p className="mt-1 text-xl font-semibold">Free Local</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Active
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-500"
                disabled
                type="button"
              >
                Sign in
              </button>
              <button
                className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
                disabled
                type="button"
              >
                Upgrade
              </button>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="workspace-heading"
          className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[220px_1fr]"
        >
          <div>
            <h2 id="workspace-heading" className="text-base font-semibold">
              Workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Local extension preferences.</p>
          </div>
          <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Sidebar width</span>
              <div className="flex items-center gap-4">
                <input
                  className="w-full accent-slate-950"
                  disabled={!canPersist}
                  max="520"
                  min="320"
                  step="20"
                  type="range"
                  value={settings.sidebarWidth}
                  onChange={(event) => {
                    void saveSettings({
                      ...settings,
                      sidebarWidth: Number(event.currentTarget.value),
                    });
                  }}
                />
                <span className="w-16 text-right text-sm tabular-nums text-slate-600">
                  {settings.sidebarWidth}px
                </span>
              </div>
            </label>

            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Debug logging</span>
                <span className="block text-sm text-slate-600">Keep disabled for normal use.</span>
              </span>
              <input
                checked={settings.enableDebugLogging}
                className="size-5 accent-slate-950"
                disabled={!canPersist}
                type="checkbox"
                onChange={(event) => {
                  void saveSettings({
                    ...settings,
                    enableDebugLogging: event.currentTarget.checked,
                  });
                }}
              />
            </label>
          </div>
        </section>

        <section
          aria-labelledby="ai-privacy-heading"
          className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[220px_1fr]"
        >
          <div>
            <h2 id="ai-privacy-heading" className="text-base font-semibold">
              AI and Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">External AI is off by default.</p>
          </div>
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Provider calls</p>
                <p className="mt-1 text-sm text-slate-600">No external AI provider is connected.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
                Off
              </span>
            </div>
            <button
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-500"
              disabled
              type="button"
            >
              Configure provider
            </button>
          </div>
        </section>

        <section aria-labelledby="data-heading" className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div>
            <h2 id="data-heading" className="text-base font-semibold">
              Data
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Local workspace controls.</p>
          </div>
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-500"
                disabled
                type="button"
              >
                Export backup
              </button>
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 disabled:text-slate-500"
                disabled={!canPersist || status === 'saving'}
                type="button"
                onClick={() => {
                  void saveSettings(DEFAULT_SETTINGS);
                }}
              >
                Reset settings
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function createStorageDriver(): ChromeStorageDriver | null {
  const globalWithChrome = globalThis as typeof globalThis & {
    readonly chrome?: unknown;
  };

  if (!hasChromeStorage(globalWithChrome.chrome)) {
    return null;
  }

  return new ChromeStorageDriver();
}

interface ChromeStorageRuntime {
  readonly storage: {
    readonly local: chrome.storage.StorageArea;
  };
}

function hasChromeStorage(value: unknown): value is ChromeStorageRuntime {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    readonly storage?: {
      readonly local?: unknown;
    };
  };

  return candidate.storage?.local !== undefined;
}
