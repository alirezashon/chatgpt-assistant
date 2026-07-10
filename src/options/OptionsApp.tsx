import { useEffect, useMemo, useRef, useState } from 'react';

import { APP_NAME, APP_VERSION } from '@/constants/app';
import { KEYBOARD_SHORTCUTS } from '@/constants/keyboard-shortcuts';
import { PRIVACY_PROMISES } from '@/constants/privacy-promises';
import { RELEASE_NOTES } from '@/constants/release-notes';
import { DEFAULT_SETTINGS } from '@/constants/settings';
import { STORAGE_KEYS } from '@/constants/storage';
import { SUPPORT_LINKS } from '@/constants/support-links';
import {
  AI_PRIVACY_COPY,
  StorageAIRepository,
  clearLocalAICache,
  inspectLocalAICache,
  type AICacheInspection,
} from '@/features/ai';
import {
  createSignedInStateFromSubscription,
  createWorkspaceBackendClientFromEnv,
} from '@/features/billing';
import {
  clearLocalErrorReports,
  createLocalDiagnosticBundle,
  readLocalErrorReports,
  stringifyLocalDiagnosticBundle,
  type LocalErrorReport,
} from '@/features/diagnostics';
import {
  DEFAULT_ENTITLEMENT_STATE,
  PREMIUM_FEATURES,
  createSignedOutEntitlementState,
  getFeatureDefinition,
  getPlanDefinition,
  requiresSignInForFeature,
  type EntitlementState,
} from '@/features/entitlements';
import {
  ChromeStorageDriver,
  createLocalWorkspaceBackup,
  migrateStorage,
  parseLocalWorkspaceBackupText,
  restoreLocalWorkspaceBackup,
  stringifyLocalWorkspaceBackup,
} from '@/storage';
import type { WorkspaceSettings } from '@/shared/types';

type SaveStatus =
  | 'clearing-diagnostics'
  | 'clearing-ai-cache'
  | 'error'
  | 'exporting'
  | 'exporting-diagnostics'
  | 'idle'
  | 'importing'
  | 'inspecting-ai-cache'
  | 'opening-billing'
  | 'ready'
  | 'refreshing-subscription'
  | 'saving'
  | 'signing-in'
  | 'signing-out';

export function OptionsApp() {
  const storage = useMemo(() => createStorageDriver(), []);
  const aiRepository = useMemo(
    () => (storage === null ? null : new StorageAIRepository(storage)),
    [storage],
  );
  const backendClient = useMemo(() => createWorkspaceBackendClientFromEnv(), []);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [aiCacheInspection, setAICacheInspection] = useState<AICacheInspection | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementState>(DEFAULT_ENTITLEMENT_STATE);
  const [diagnostics, setDiagnostics] = useState<readonly LocalErrorReport[]>([]);
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
        await migrateStorage(storage);
        const [storedSettings, storedEntitlements, storedDiagnostics, storedAICacheInspection] =
          await Promise.all([
            storage.get<WorkspaceSettings>(STORAGE_KEYS.settings),
            storage.get<EntitlementState>(STORAGE_KEYS.entitlements),
            readLocalErrorReports(storage),
            aiRepository === null ? Promise.resolve(null) : inspectLocalAICache(aiRepository),
          ]);

        if (cancelled) {
          return;
        }

        setEntitlements({ ...DEFAULT_ENTITLEMENT_STATE, ...storedEntitlements });
        setAICacheInspection(storedAICacheInspection);
        setDiagnostics(storedDiagnostics);
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
  }, [aiRepository, storage]);

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

  async function saveEntitlements(nextEntitlements: EntitlementState): Promise<void> {
    setEntitlements(nextEntitlements);

    if (storage === null) {
      setStatus('error');
      setMessage('Account storage is unavailable outside the installed extension.');
      return;
    }

    await storage.set(STORAGE_KEYS.entitlements, nextEntitlements);
  }

  async function reloadLocalState(): Promise<void> {
    if (storage === null) {
      return;
    }

    const [storedSettings, storedEntitlements, storedDiagnostics] = await Promise.all([
      storage.get<WorkspaceSettings>(STORAGE_KEYS.settings),
      storage.get<EntitlementState>(STORAGE_KEYS.entitlements),
      readLocalErrorReports(storage),
    ]);

    setEntitlements({ ...DEFAULT_ENTITLEMENT_STATE, ...storedEntitlements });
    setDiagnostics(storedDiagnostics);
    setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
  }

  async function exportBackup(): Promise<void> {
    if (storage === null) {
      setStatus('error');
      setMessage('Settings storage is unavailable outside the installed extension.');
      return;
    }

    setStatus('exporting');
    setMessage('Preparing local backup...');

    try {
      await migrateStorage(storage);
      const backup = await createLocalWorkspaceBackup(storage);
      downloadTextFile(
        stringifyLocalWorkspaceBackup(backup),
        `chatgpt-workspace-backup-${backup.exportedAt.slice(0, 10)}.json`,
      );
      setStatus('ready');
      setMessage('Backup downloaded.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to export backup.');
    }
  }

  async function importBackup(file: File): Promise<void> {
    if (storage === null) {
      setStatus('error');
      setMessage('Settings storage is unavailable outside the installed extension.');
      return;
    }

    setStatus('importing');
    setMessage('Importing local backup...');

    try {
      const backup = parseLocalWorkspaceBackupText(await file.text());

      await restoreLocalWorkspaceBackup(storage, backup);
      await reloadLocalState();
      setStatus('ready');
      setMessage('Backup imported. Reload any open ChatGPT tabs to refresh the sidebar.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to import backup.');
    } finally {
      if (backupInputRef.current !== null) {
        backupInputRef.current.value = '';
      }
    }
  }

  async function exportDiagnostics(): Promise<void> {
    if (storage === null) {
      setStatus('error');
      setMessage('Diagnostics are unavailable outside the installed extension.');
      return;
    }

    setStatus('exporting-diagnostics');
    setMessage('Preparing local diagnostics...');

    try {
      const bundle = await createLocalDiagnosticBundle(storage);
      downloadTextFile(
        stringifyLocalDiagnosticBundle(bundle),
        `chatgpt-workspace-diagnostics-${bundle.exportedAt.slice(0, 10)}.json`,
        'application/json',
      );
      setDiagnostics(bundle.reports);
      setStatus('ready');
      setMessage('Diagnostics downloaded. Review the file before sharing it.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to export diagnostics.');
    }
  }

  async function clearDiagnostics(): Promise<void> {
    if (storage === null) {
      setStatus('error');
      setMessage('Diagnostics are unavailable outside the installed extension.');
      return;
    }

    setStatus('clearing-diagnostics');
    setMessage('Clearing local diagnostics...');

    try {
      await clearLocalErrorReports(storage);
      setDiagnostics([]);
      setStatus('ready');
      setMessage('Local diagnostics cleared.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to clear diagnostics.');
    }
  }

  async function inspectAICache(): Promise<void> {
    if (aiRepository === null) {
      setStatus('error');
      setMessage('AI cache is unavailable outside the installed extension.');
      return;
    }

    setStatus('inspecting-ai-cache');
    setMessage('Inspecting local AI cache...');

    try {
      setAICacheInspection(await inspectLocalAICache(aiRepository));
      setStatus('ready');
      setMessage('AI cache inspected.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to inspect AI cache.');
    }
  }

  async function clearAICache(): Promise<void> {
    if (aiRepository === null) {
      setStatus('error');
      setMessage('AI cache is unavailable outside the installed extension.');
      return;
    }

    setStatus('clearing-ai-cache');
    setMessage('Clearing local AI cache...');

    try {
      setAICacheInspection(await clearLocalAICache(aiRepository));
      setStatus('ready');
      setMessage('Local AI cache cleared.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to clear AI cache.');
    }
  }

  async function signIn(): Promise<void> {
    if (backendClient === null) {
      setStatus('error');
      setMessage('Set VITE_WORKSPACE_API_BASE_URL to enable account sign-in.');
      return;
    }

    setStatus('signing-in');
    setMessage('Opening secure sign-in...');

    try {
      const session = await backendClient.createLoginSession();

      window.open(session.loginUrl, '_blank', 'noopener,noreferrer');
      setStatus('ready');
      setMessage('Sign-in opened. Return here after completing account connection.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to start sign-in.');
    }
  }

  async function signOut(): Promise<void> {
    setStatus('signing-out');
    setMessage('Signing out...');

    try {
      if (backendClient !== null && entitlements.accountId !== null) {
        await backendClient.logout(entitlements.accountId);
      }

      await saveEntitlements(createSignedOutEntitlementState());
      setStatus('ready');
      setMessage('Signed out. Free Local remains available.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to sign out.');
    }
  }

  async function refreshSubscription(): Promise<void> {
    if (backendClient === null) {
      setStatus('error');
      setMessage('Set VITE_WORKSPACE_API_BASE_URL to refresh subscription status.');
      return;
    }

    if (entitlements.accountId === null) {
      setStatus('error');
      setMessage('Sign in before refreshing subscription status.');
      return;
    }

    setStatus('refreshing-subscription');
    setMessage('Refreshing subscription status...');

    try {
      const subscription = await backendClient.getSubscriptionStatus(entitlements.accountId);

      await saveEntitlements(createSignedInStateFromSubscription(entitlements, subscription));
      setStatus('ready');
      setMessage(`Subscription status refreshed: ${subscription.status}.`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to refresh subscription.');
    }
  }

  async function openBillingPortal(): Promise<void> {
    if (!entitlements.signedIn || entitlements.accountId === null) {
      setStatus('error');
      setMessage('Sign in before opening the billing portal.');
      return;
    }

    setStatus('opening-billing');
    setMessage('Opening billing portal...');

    try {
      let portalUrl = entitlements.billingPortalUrl;

      if (portalUrl === null) {
        if (backendClient === null) {
          throw new Error('Set VITE_WORKSPACE_API_BASE_URL to open the billing portal.');
        }

        const session = await backendClient.createBillingPortalSession(entitlements.accountId);
        portalUrl = session.url;
        await saveEntitlements({
          ...entitlements,
          billingPortalUrl: portalUrl,
        });
      }

      window.open(portalUrl, '_blank', 'noopener,noreferrer');
      setStatus('ready');
      setMessage('Billing portal opened.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to open billing portal.');
    }
  }

  const canPersist = storage !== null;
  const accountControlsDisabled =
    !canPersist ||
    status === 'signing-in' ||
    status === 'signing-out' ||
    status === 'refreshing-subscription' ||
    status === 'opening-billing';
  const currentPlan = getPlanDefinition(entitlements.planId);
  const dataControlsDisabled = !canPersist || status === 'exporting' || status === 'importing';
  const diagnosticsControlsDisabled =
    !canPersist || status === 'exporting-diagnostics' || status === 'clearing-diagnostics';
  const aiCacheControlsDisabled =
    !canPersist || status === 'inspecting-ai-cache' || status === 'clearing-ai-cache';
  const freePlan = getPlanDefinition('free-local');
  const freePreviewItems = freePlan.features.slice(0, 5);
  const latestReleaseNote = RELEASE_NOTES[0];
  const proPlan = getPlanDefinition('pro');
  const premiumPreviewItems = PREMIUM_FEATURES.slice(0, 5);

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
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="grid gap-5 border-b border-slate-200 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-5 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                      No account required
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                      Local-first
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-normal">
                    Start organizing without signing up
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Your current workspace runs on the {currentPlan.name} plan. Folders, search,
                    local export, backup, and local storage stay available without an account.
                  </p>
                </div>
                <div className="rounded-md border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Current plan
                  </p>
                  <p className="mt-1 text-xl font-semibold">{currentPlan.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{currentPlan.description}</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Account
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {entitlements.signedIn
                      ? (entitlements.accountEmail ?? 'Connected account')
                      : 'Not signed in'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Subscription: {entitlements.subscriptionStatus}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-950">Free Local</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        Built for private, account-free daily use.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      Active
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-emerald-900">
                    {freePreviewItems.map((featureId) => (
                      <li key={featureId} className="flex gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 rounded-full bg-emerald-600"
                        />
                        <span>{getFeatureDefinition(featureId).name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-950 p-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{proPlan.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{proPlan.description}</p>
                    </div>
                    <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-slate-950">
                      Paid
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-slate-200">
                    {premiumPreviewItems.slice(0, 4).map((featureId) => (
                      <li key={featureId} className="flex gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 rounded-full bg-cyan-300"
                        />
                        <span>{getFeatureDefinition(featureId).name}</span>
                      </li>
                    ))}
                  </ul>
                  {entitlements.signedIn ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <button
                        className="h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 disabled:opacity-70"
                        disabled={accountControlsDisabled}
                        type="button"
                        onClick={() => {
                          void refreshSubscription();
                        }}
                      >
                        Refresh status
                      </button>
                      <button
                        className="h-10 rounded-md border border-white/30 px-4 text-sm font-semibold text-white disabled:opacity-70"
                        disabled={accountControlsDisabled}
                        type="button"
                        onClick={() => {
                          void openBillingPortal();
                        }}
                      >
                        Billing portal
                      </button>
                      <button
                        className="h-10 rounded-md border border-white/30 px-4 text-sm font-semibold text-white disabled:opacity-70"
                        disabled={accountControlsDisabled}
                        type="button"
                        onClick={() => {
                          void signOut();
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        className="h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 disabled:opacity-70"
                        disabled={accountControlsDisabled}
                        type="button"
                        onClick={() => {
                          void signIn();
                        }}
                      >
                        Sign in to upgrade
                      </button>
                      <button
                        className="h-10 rounded-md border border-white/30 px-4 text-sm font-semibold text-white disabled:opacity-70"
                        disabled
                        type="button"
                      >
                        Compare plans
                      </button>
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    {backendClient === null
                      ? 'Backend URL is not configured yet. Free Local keeps working.'
                      : 'Sign-in is only needed for paid features, cloud sync, billing, and external AI usage.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
              {premiumPreviewItems.slice(0, 3).map((featureId) => (
                <div key={featureId} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium">{getFeatureDefinition(featureId).name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {requiresSignInForFeature(featureId)
                      ? 'Pro feature. Sign in only when you upgrade.'
                      : 'Available without sign-in.'}
                  </p>
                </div>
              ))}
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

        {latestReleaseNote === undefined ? null : (
          <section
            aria-labelledby="release-notes-heading"
            className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[220px_1fr]"
          >
            <div>
              <h2 id="release-notes-heading" className="text-base font-semibold">
                Release Notes
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Current build highlights.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      v{latestReleaseNote.version}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {latestReleaseNote.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {latestReleaseNote.summary}
                  </p>
                </div>
                <time
                  className="text-sm font-medium text-slate-500"
                  dateTime={latestReleaseNote.date}
                >
                  {latestReleaseNote.date}
                </time>
              </div>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                {latestReleaseNote.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

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
                <p className="mt-1 text-sm text-slate-600">{AI_PRIVACY_COPY.consent}</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
                Off
              </span>
            </div>
            <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p>{AI_PRIVACY_COPY.localDefault}</p>
              <p>{AI_PRIVACY_COPY.providerKeys}</p>
            </div>
            <button
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-500"
              disabled
              type="button"
            >
              Configure provider
            </button>
            <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-950">Local AI cache</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {aiCacheInspection === null
                      ? 'Cache has not been inspected yet.'
                      : `${aiCacheInspection.entryCount.toString()} entries across ${aiCacheInspection.taskTypes.length.toString()} task types.`}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
                    disabled={aiCacheControlsDisabled}
                    type="button"
                    onClick={() => {
                      void inspectAICache();
                    }}
                  >
                    Inspect cache
                  </button>
                  <button
                    className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
                    disabled={aiCacheControlsDisabled || aiCacheInspection?.entryCount === 0}
                    type="button"
                    onClick={() => {
                      void clearAICache();
                    }}
                  >
                    Clear cache
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 border-t border-slate-100 pt-4">
              {PRIVACY_PROMISES.map((promise) => (
                <div
                  key={promise.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-950">{promise.title}</p>
                    <span
                      className={[
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        promise.status === 'local-now'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600',
                      ].join(' ')}
                    >
                      {promise.status === 'local-now' ? 'Active now' : 'Future opt-in'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{promise.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="diagnostics-heading"
          className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[220px_1fr]"
        >
          <div>
            <h2 id="diagnostics-heading" className="text-base font-semibold">
              Diagnostics
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Local error reporting.</p>
          </div>
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Local error reports</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Error reports stay in Chrome storage and are never uploaded automatically.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
                {diagnostics.length} saved
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
                disabled={diagnosticsControlsDisabled}
                type="button"
                onClick={() => {
                  void exportDiagnostics();
                }}
              >
                Export diagnostics
              </button>
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
                disabled={diagnosticsControlsDisabled || diagnostics.length === 0}
                type="button"
                onClick={() => {
                  void clearDiagnostics();
                }}
              >
                Clear diagnostics
              </button>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="premium-prompts-heading"
          className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[220px_1fr]"
        >
          <div>
            <h2 id="premium-prompts-heading" className="text-base font-semibold">
              Premium Prompts
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Paid prompts appear only around paid features.
            </p>
          </div>
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Pro previews are ready</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Free Local stays account-free. Upgrade prompts are reserved for AI, sync, and
                  advanced export actions.
                </p>
              </div>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                Soft gate
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  feature: 'AI summaries',
                  message: 'Summarize long work threads when Pro is connected.',
                },
                {
                  feature: 'Cloud sync',
                  message: 'Sign in only when cross-device backup is enabled.',
                },
                {
                  feature: 'PDF exports',
                  message: 'Keep Markdown local, offer polished exports as Pro.',
                },
              ].map((item) => (
                <div
                  key={item.feature}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.feature}</p>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Pro
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.message}</p>
                </div>
              ))}
            </div>
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
              <input
                ref={backupInputRef}
                accept="application/json,.json"
                className="hidden"
                type="file"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];

                  if (file !== undefined) {
                    void importBackup(file);
                  }
                }}
              />
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
                disabled={dataControlsDisabled}
                type="button"
                onClick={() => {
                  void exportBackup();
                }}
              >
                Export backup
              </button>
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
                disabled={dataControlsDisabled}
                type="button"
                onClick={() => {
                  backupInputRef.current?.click();
                }}
              >
                Import backup
              </button>
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500 sm:col-span-2"
                disabled={dataControlsDisabled || status === 'saving'}
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

        <section
          aria-labelledby="keyboard-shortcuts-heading"
          className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-[220px_1fr]"
        >
          <div>
            <h2 id="keyboard-shortcuts-heading" className="text-base font-semibold">
              Keyboard Shortcuts
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Workspace controls.</p>
          </div>
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div
                key={`${shortcut.scope}-${shortcut.keys.join('-')}`}
                className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium text-slate-950">{shortcut.description}</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">{shortcut.scope}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="support-heading" className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div>
            <h2 id="support-heading" className="text-base font-semibold">
              Support
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Help and release documents.</p>
          </div>
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
            {SUPPORT_LINKS.map((link) => (
              <a
                key={link.label}
                className="rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
                href={link.href}
                rel="noreferrer"
                target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              >
                <span className="block text-sm font-medium text-slate-950">{link.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  {link.description}
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function downloadTextFile(text: string, filename: string, type = 'application/json'): void {
  const blob = new Blob([text], {
    type,
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
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
