import { useCallback, useEffect } from 'react';

import { useSyncActions, useUiPreferences } from '@/app/synchronization';

export function useSidebarController() {
  const { setSidebarOpen } = useSyncActions();
  const { sidebarOpen } = useUiPreferences();

  const close = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  const toggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [setSidebarOpen, sidebarOpen]);

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

  return {
    close,
    isOpen: sidebarOpen,
    toggle,
  };
}
