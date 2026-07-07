import type { ProviderAdapter, ProviderContext } from '@/platform/providers/provider-adapter';
import type { ProviderAuthentication } from '@/platform/providers/provider-authentication';
import type { ProviderEvents } from '@/platform/providers/provider-events';
import type { ProviderSessionStore } from '@/platform/providers/provider-session';

export class ProviderLifecycle {
  private readonly authentication: ProviderAuthentication;
  private readonly events: ProviderEvents;
  private readonly sessions: ProviderSessionStore;

  public constructor(
    authentication: ProviderAuthentication,
    sessions: ProviderSessionStore,
    events: ProviderEvents,
  ) {
    this.authentication = authentication;
    this.events = events;
    this.sessions = sessions;
  }

  public async connect(adapter: ProviderAdapter, context: ProviderContext): Promise<void> {
    const session = await this.authentication.authenticate(adapter, context);

    this.sessions.upsert(session);
    this.events.emit('providerConnected', {
      session,
    });
  }

  public async disconnect(adapter: ProviderAdapter): Promise<void> {
    const session = this.sessions.getByProvider(adapter.identity.id);

    if (session === null) {
      return;
    }

    await this.authentication.disconnect(adapter, session.id);
    this.sessions.remove(session.id);
    this.events.emit('providerDisconnected', {
      providerId: adapter.identity.id,
      sessionId: session.id,
    });
  }
}
