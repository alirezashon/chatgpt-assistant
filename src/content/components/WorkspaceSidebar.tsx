import { APP_NAME, APP_VERSION } from '@/constants/app';
import { SettingsIcon } from '@/content/components/icons/SettingsIcon';
import { WorkspaceExplorer } from '@/content/components/workspace-explorer/WorkspaceExplorer';
import { openExtensionOptionsPage } from '@/content/open-options-page';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceSidebar({ isOpen, onClose }: WorkspaceSidebarProps) {
  return (
    <aside
      aria-label="ChatGPT Workspace sidebar"
      className={[
        'fixed top-0 right-0 z-[2147483646] flex h-dvh w-[var(--cgw-sidebar-width)] max-w-[calc(100vw-var(--cgw-sidebar-closed-offset))] flex-col rounded-l-[var(--cgw-sidebar-border-radius)] border-l border-[var(--cgw-border)] bg-[var(--cgw-surface)] text-[var(--cgw-text)] shadow-2xl shadow-slate-950/20 transition-transform duration-[var(--cgw-animation-normal)] ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+var(--cgw-sidebar-closed-offset))]',
      ].join(' ')}
    >
      <header className="sr-only">
        <h2>{APP_NAME}</h2>
        <p>Version {APP_VERSION}</p>
      </header>

      <WorkspaceExplorer />

      <footer className="flex items-center justify-between border-t border-[var(--cgw-border)] bg-[var(--cgw-muted)]/60 px-6 py-4">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-[var(--cgw-text)]/75 transition hover:bg-[var(--cgw-muted)] hover:text-[var(--cgw-text)] focus-visible:ring-4 focus-visible:ring-[var(--cgw-border)] focus-visible:outline-none"
          type="button"
          onClick={openExtensionOptionsPage}
        >
          <SettingsIcon />
          <span>Settings</span>
        </button>
        <button
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-[var(--cgw-text)]/75 transition duration-200 ease-out hover:bg-[var(--cgw-muted)] hover:text-[var(--cgw-text)] focus-visible:ring-4 focus-visible:ring-[var(--cgw-border)] focus-visible:outline-none"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </footer>
    </aside>
  );
}
