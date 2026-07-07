import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ToastContext } from '@/content/components/toast/toast-context';
import type { Toast, ToastTone } from '@/content/components/toast/toast-types';

interface ToastProviderProps {
  readonly children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const timeoutIdsRef = useRef<ReadonlySet<number>>(new Set());

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutIdsRef.current) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = crypto.randomUUID();

    setToasts((currentToasts) => [...currentToasts, { id, message, tone }]);

    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = removeTimeoutId(timeoutIdsRef.current, timeoutId);
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 3200);

    timeoutIdsRef.current = new Set([...timeoutIdsRef.current, timeoutId]);
  }, []);

  const value = useMemo(
    () => ({
      notify,
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-5 bottom-24 z-[2147483647] flex w-72 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'cgw-menu-in rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur',
              toast.tone === 'success'
                ? 'border-emerald-200 bg-white/95 text-emerald-800'
                : 'border-red-200 bg-white/95 text-red-700',
            ].join(' ')}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function removeTimeoutId(timeoutIds: ReadonlySet<number>, timeoutId: number): ReadonlySet<number> {
  const nextTimeoutIds = new Set(timeoutIds);

  nextTimeoutIds.delete(timeoutId);

  return nextTimeoutIds;
}
