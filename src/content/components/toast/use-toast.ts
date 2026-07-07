import { useContext } from 'react';

import { ToastContext } from '@/content/components/toast/toast-context';
import type { ToastContextValue } from '@/content/components/toast/toast-types';

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);

  if (value === null) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return value;
}
