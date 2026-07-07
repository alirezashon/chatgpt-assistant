import { APP_NAME, APP_VERSION } from '@/constants/app';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceSidebar({ isOpen, onClose }: WorkspaceSidebarProps) {
  return (
    <aside
      aria-label="ChatGPT Workspace sidebar"
      className={[
        'fixed top-0 right-0 z-[2147483646] flex h-dvh w-[380px] max-w-[calc(100vw-24px)] flex-col rounded-l-2xl bg-white text-slate-950 shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]',
      ].join(' ')}
    >
      <header className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold tracking-normal">{APP_NAME}</h2>
        <p className="mt-1 text-sm text-slate-500">Version {APP_VERSION}</p>
      </header>

      <div className="flex-1 px-6 py-5">
        <p className="text-sm leading-6 text-slate-700">
          This is the beginning of something awesome.
        </p>
      </div>

      <footer className="border-t border-slate-200 px-6 py-4">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition duration-200 ease-out hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </footer>
    </aside>
  );
}
