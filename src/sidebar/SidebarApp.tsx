import { Command, Layers } from 'lucide-react';

import { APP_NAME } from '@/constants';

export function SidebarApp() {
  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-50">
      <header className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4" />
          {APP_NAME}
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Sidebar foundation for longer contextual workflows.
        </p>
      </header>

      <section className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Command className="h-4 w-4" />
          Workflow Surface
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Future prompts can attach command results, page summaries, citations, and multi-step task
          flows here without changing the extension shell.
        </p>
      </section>
    </main>
  );
}
