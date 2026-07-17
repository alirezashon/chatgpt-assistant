import { QueryClient } from '@tanstack/react-query';

export function createExtensionQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 1000 * 30,
      },
    },
  });
}
