import { useRef, type PointerEvent } from 'react';

import { APP_NAME, APP_VERSION } from '@/constants/app';
import { SettingsIcon } from '@/content/components/icons/SettingsIcon';
import { WorkspaceExplorer } from '@/content/components/workspace-explorer/WorkspaceExplorer';
import { openExtensionOptionsPage } from '@/content/open-options-page';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  readonly onResize: (width: number) => void;
  readonly width: number;
}

interface ResizeState {
  readonly pointerId: number;
  readonly startClientX: number;
  readonly startWidth: number;
}

export function WorkspaceSidebar({ isOpen, onClose, onResize, width }: WorkspaceSidebarProps) {
  const resizeStateRef = useRef<ResizeState | null>(null);

  function handleResizeStart(event: PointerEvent<HTMLButtonElement>): void {
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startWidth: width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizeMove(event: PointerEvent<HTMLButtonElement>): void {
    const resizeState = resizeStateRef.current;

    if (resizeState?.pointerId !== event.pointerId) {
      return;
    }

    onResize(resizeState.startWidth + resizeState.startClientX - event.clientX);
  }

  function handleResizeEnd(event: PointerEvent<HTMLButtonElement>): void {
    const resizeState = resizeStateRef.current;

    if (resizeState?.pointerId !== event.pointerId) {
      return;
    }

    resizeStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <aside
      aria-label="ChatGPT Workspace sidebar"
      className={[
        'fixed top-0 right-0 z-[2147483646] flex h-dvh max-w-[calc(100vw-var(--cgw-sidebar-closed-offset))] flex-col rounded-l-[var(--cgw-sidebar-border-radius)] border-l border-[var(--cgw-border)] bg-[var(--cgw-surface)] text-[var(--cgw-text)] shadow-2xl shadow-slate-950/20 ring-1 ring-black/5 transition-transform duration-[var(--cgw-animation-normal)] ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+var(--cgw-sidebar-closed-offset))]',
      ].join(' ')}
      style={{ width }}
    >
      <button
        aria-label="Resize workspace panel"
        className="absolute top-20 left-0 z-10 flex h-[calc(100%-10rem)] w-3 -translate-x-1.5 cursor-ew-resize items-center justify-center rounded-full bg-transparent transition hover:bg-emerald-300/70 focus-visible:bg-emerald-300 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:outline-none"
        title="Drag to resize"
        type="button"
        onPointerCancel={handleResizeEnd}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
      >
        <span className="h-12 w-1 rounded-full bg-slate-300/80" />
      </button>
      <header className="sr-only">
        <h2>{APP_NAME}</h2>
        <p>Version {APP_VERSION}</p>
      </header>

      <WorkspaceExplorer />

      <footer className="grid gap-3 border-t border-[var(--cgw-border)] bg-white px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Tip: drag the round bubble to move it. Drag the left edge to resize this panel.
        </p>
        <div className="flex items-center justify-between">
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
        </div>
      </footer>
    </aside>
  );
}
