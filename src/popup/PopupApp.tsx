import { APP_NAME, APP_VERSION } from '@/constants/app';

export function PopupApp() {
  return (
    <main className="flex min-h-40 w-72 flex-col justify-center gap-2 bg-white px-5 py-6 text-slate-950">
      <h1 className="text-lg font-semibold tracking-normal">{APP_NAME}</h1>
      <p className="text-sm text-slate-600">Version {APP_VERSION}</p>
    </main>
  );
}
