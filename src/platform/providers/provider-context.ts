import type { ProviderContext } from '@/platform/providers/provider-adapter';

export function createProviderContext(workspaceId: string): ProviderContext {
  return {
    permissions: [],
    workspaceId,
  };
}
