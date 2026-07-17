import { Shield, SlidersHorizontal } from 'lucide-react';

import { APP_NAME, APP_VERSION } from '@/constants';
import { runtimeConfig } from '@/lib/config/runtime-config';

export function OptionsApp() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto grid w-full max-w-3xl gap-8 px-6 py-10">
        <header className="border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium text-zinc-500">Version {APP_VERSION}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">{APP_NAME}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Minimal extension-level configuration belongs here. Product workflows should live in
            contextual surfaces, not in a settings dashboard.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4" />
              Privacy Baseline
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Page content is captured only after user interaction. Future provider calls should
              flow through the background worker and the typed command contracts.
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Runtime
            </div>
            <dl className="mt-3 grid gap-2 text-sm text-zinc-600">
              <div className="flex justify-between gap-4">
                <dt>Environment</dt>
                <dd className="font-medium text-zinc-950">{runtimeConfig.appEnvironment}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>AI base URL</dt>
                <dd className="font-medium text-zinc-950">
                  {runtimeConfig.aiApiBaseUrl.length > 0 ? 'configured' : 'not configured'}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
