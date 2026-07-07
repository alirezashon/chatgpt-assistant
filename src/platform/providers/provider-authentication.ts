import type { ProviderAdapter, ProviderContext } from '@/platform/providers/provider-adapter';
import type { ProviderSession } from '@/platform/providers/provider-types';

export interface ProviderAuthentication {
  authenticate(adapter: ProviderAdapter, context: ProviderContext): Promise<ProviderSession>;
  disconnect(adapter: ProviderAdapter, sessionId: string): Promise<void>;
}

export class DefaultProviderAuthentication implements ProviderAuthentication {
  public async authenticate(
    adapter: ProviderAdapter,
    context: ProviderContext,
  ): Promise<ProviderSession> {
    return await adapter.authenticate(context);
  }

  public async disconnect(adapter: ProviderAdapter, sessionId: string): Promise<void> {
    await adapter.disconnect(sessionId);
  }
}
