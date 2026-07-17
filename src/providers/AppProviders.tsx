import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';

import { createExtensionQueryClient } from './query-client';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createExtensionQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-center" toastOptions={{ duration: 2400 }} />
    </QueryClientProvider>
  );
}
