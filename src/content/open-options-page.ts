export function openExtensionOptionsPage(): void {
  const runtime = getExtensionRuntime();

  if (runtime === null) {
    window.open('/options.html', '_blank', 'noopener,noreferrer');
    return;
  }

  if (typeof runtime.openOptionsPage === 'function') {
    void runtime.openOptionsPage();
    return;
  }

  window.open(runtime.getURL('options.html'), '_blank', 'noopener,noreferrer');
}

interface ExtensionRuntime {
  readonly getURL: typeof chrome.runtime.getURL;
  readonly openOptionsPage?: typeof chrome.runtime.openOptionsPage;
}

function getExtensionRuntime(): ExtensionRuntime | null {
  const globalWithChrome = globalThis as unknown as {
    readonly chrome?: {
      readonly runtime?: ExtensionRuntime;
    };
  };

  return globalWithChrome.chrome?.runtime ?? null;
}
