import type { ProviderSession } from '@/platform/providers/provider-types';

export class ProviderSessionStore {
  private readonly sessions = new Map<string, ProviderSession>();

  public getByProvider(providerId: string): ProviderSession | null {
    return [...this.sessions.values()].find((session) => session.providerId === providerId) ?? null;
  }

  public remove(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  public upsert(session: ProviderSession): void {
    this.sessions.set(session.id, session);
  }

  public values(): readonly ProviderSession[] {
    return [...this.sessions.values()];
  }
}
