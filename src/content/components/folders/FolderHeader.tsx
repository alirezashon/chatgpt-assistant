import { APP_NAME, APP_VERSION } from '@/constants/app';

export function FolderHeader() {
  return (
    <header className="px-6 pt-5 pb-4">
      <h2 className="text-lg font-semibold tracking-normal">{APP_NAME}</h2>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
        Version {APP_VERSION}
      </p>
      <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
        Folders
      </h3>
    </header>
  );
}
