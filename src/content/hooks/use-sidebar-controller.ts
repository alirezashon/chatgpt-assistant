import { useCallback, useEffect } from 'react';

import { useSyncActions, useUiPreferences } from '@/app/synchronization';
import type { UiPosition } from '@/app/synchronization';

const OPEN_SIDEBAR_MESSAGE = 'chatgpt-workspace:open-sidebar';
const MAX_SIDEBAR_WIDTH = 560;
const MIN_SIDEBAR_WIDTH = 320;

export function useSidebarController() {
  const { setFloatingButtonPosition, setSidebarOpen, setSidebarWidth } = useSyncActions();
  const { floatingButtonPosition, sidebarOpen, sidebarWidth } = useUiPreferences();

  const close = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  const toggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [setSidebarOpen, sidebarOpen]);

  const resize = useCallback(
    (nextWidth: number) => {
      setSidebarWidth(clampSidebarWidth(nextWidth));
    },
    [setSidebarWidth],
  );

  const moveFloatingButton = useCallback(
    (position: UiPosition) => {
      setFloatingButtonPosition(position);
    },
    [setFloatingButtonPosition],
  );

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, sidebarOpen]);

  useEffect(() => {
    const chromeGlobal = globalThis.chrome;

    if (!hasRuntimeMessages(chromeGlobal)) {
      return undefined;
    }

    const handleMessage = (message: unknown) => {
      if (isOpenSidebarMessage(message)) {
        setSidebarOpen(true);
      }
    };

    chromeGlobal.runtime.onMessage.addListener(handleMessage);

    return () => {
      chromeGlobal.runtime.onMessage.removeListener(handleMessage);
    };
  }, [setSidebarOpen]);

  return {
    close,
    floatingButtonPosition,
    isOpen: sidebarOpen,
    moveFloatingButton,
    resize,
    sidebarWidth: clampSidebarWidth(sidebarWidth),
    toggle,
  };
}

function clampSidebarWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, Math.round(width)));
}

interface ChromeRuntimeMessages {
  readonly runtime: {
    readonly onMessage: {
      addListener(listener: (message: unknown) => void): void;
      removeListener(listener: (message: unknown) => void): void;
    };
  };
}

function hasRuntimeMessages(value: unknown): value is ChromeRuntimeMessages {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    readonly runtime?: {
      readonly onMessage?: {
        readonly addListener?: unknown;
        readonly removeListener?: unknown;
      };
    };
  };

  return (
    typeof candidate.runtime?.onMessage?.addListener === 'function' &&
    typeof candidate.runtime.onMessage.removeListener === 'function'
  );
}

function isOpenSidebarMessage(
  value: unknown,
): value is { readonly type: typeof OPEN_SIDEBAR_MESSAGE } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return (value as Readonly<Record<string, unknown>>)['type'] === OPEN_SIDEBAR_MESSAGE;
}
