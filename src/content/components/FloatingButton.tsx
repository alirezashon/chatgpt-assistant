import { WorkspaceIcon } from '@/content/components/WorkspaceIcon';

interface FloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function FloatingButton({ isOpen, onClick }: FloatingButtonProps) {
  return (
    <button
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Close ChatGPT Workspace' : 'Open ChatGPT Workspace'}
      className="fixed right-[var(--cgw-edge-offset)] bottom-[var(--cgw-edge-offset)] z-[2147483647] flex h-[var(--cgw-floating-button-size)] w-[var(--cgw-floating-button-size)] items-center justify-center rounded-full bg-[var(--cgw-button)] text-[var(--cgw-button-text)] shadow-lg shadow-slate-950/20 transition duration-[var(--cgw-animation-fast)] ease-out hover:-translate-y-0.5 hover:scale-105 focus-visible:ring-4 focus-visible:ring-[var(--cgw-accent)] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 active:scale-100"
      type="button"
      onClick={onClick}
    >
      <WorkspaceIcon />
    </button>
  );
}
