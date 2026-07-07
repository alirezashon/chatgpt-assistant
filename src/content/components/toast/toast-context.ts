import { createContext } from 'react';

import type { ToastContextValue } from '@/content/components/toast/toast-types';

export const ToastContext = createContext<ToastContextValue | null>(null);
