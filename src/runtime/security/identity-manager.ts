import type {
  IdentityContext,
  IdentityType,
  SecurityIdentity,
  SecurityPrincipal,
  SecuritySession,
  SecurityValue,
  TrustLevel,
} from './security-types';
import { SecurityRuntimeError } from './security-types';

/** Creates and validates identities, principals, actors, and sessions. */
export class IdentityManager {
  private readonly identities = new Map<string, SecurityIdentity>();
  private readonly sessions = new Map<string, SecuritySession>();

  /** Creates an identity. */
  public createIdentity(input: {
    readonly displayName: string;
    readonly metadata?: Readonly<Record<string, SecurityValue>>;
    readonly ownerId?: string;
    readonly trustLevel?: TrustLevel;
    readonly type: IdentityType;
  }): SecurityIdentity {
    const now = Date.now();
    const identity: SecurityIdentity = {
      createdAt: now,
      displayName: input.displayName,
      id: crypto.randomUUID(),
      metadata: input.metadata ?? {},
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      trustLevel: input.trustLevel ?? 'unknown',
      type: input.type,
    };
    this.identities.set(identity.id, identity);
    return identity;
  }

  /** Updates trust level. */
  public setTrustLevel(identityId: string, trustLevel: TrustLevel): SecurityIdentity {
    const identity = this.requireIdentity(identityId);
    const next = { ...identity, trustLevel };
    this.identities.set(identityId, next);
    return next;
  }

  /** Disables an identity and revokes its sessions. */
  public disable(identityId: string): SecurityIdentity {
    const identity = this.requireIdentity(identityId);
    const next = { ...identity, disabledAt: Date.now() };
    this.identities.set(identityId, next);

    for (const session of this.sessions.values()) {
      if (session.principal.identityId === identityId && session.revokedAt === undefined) {
        this.sessions.set(session.id, { ...session, revokedAt: Date.now() });
      }
    }

    return next;
  }

  /** Starts a session for an identity. */
  public startSession(identityId: string, ttlMs = 60 * 60 * 1000): SecuritySession {
    const identity = this.requireIdentity(identityId);

    if (identity.disabledAt !== undefined) {
      throw new SecurityRuntimeError('SECURITY_SESSION_INVALID', 'Identity is disabled.', {
        identityId,
      });
    }

    const principal: SecurityPrincipal = {
      displayName: identity.displayName,
      id: `principal-${identity.id}`,
      identityId: identity.id,
      trustLevel: identity.trustLevel,
      type: identity.type,
    };
    const session: SecuritySession = {
      expiresAt: Date.now() + ttlMs,
      id: crypto.randomUUID(),
      principal,
      startedAt: Date.now(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  /** Revokes a session. */
  public revokeSession(sessionId: string): SecuritySession {
    const session = this.requireSession(sessionId);
    const next = { ...session, revokedAt: Date.now() };
    this.sessions.set(sessionId, next);
    return next;
  }

  /** Creates an action identity context from an active session. */
  public context(sessionId: string): IdentityContext {
    const session = this.requireActiveSession(sessionId);

    return {
      actor: {
        principal: session.principal,
        sessionId,
      },
      requestId: crypto.randomUUID(),
      session,
    };
  }

  /** Returns one identity. */
  public getIdentity(identityId: string): SecurityIdentity | undefined {
    return this.identities.get(identityId);
  }

  private requireIdentity(identityId: string): SecurityIdentity {
    const identity = this.identities.get(identityId);

    if (identity === undefined) {
      throw new SecurityRuntimeError('SECURITY_IDENTITY_NOT_FOUND', `Identity not found: ${identityId}`);
    }

    return identity;
  }

  private requireSession(sessionId: string): SecuritySession {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      throw new SecurityRuntimeError('SECURITY_SESSION_INVALID', `Session not found: ${sessionId}`);
    }

    return session;
  }

  private requireActiveSession(sessionId: string): SecuritySession {
    const session = this.requireSession(sessionId);

    if (session.revokedAt !== undefined || session.expiresAt <= Date.now()) {
      throw new SecurityRuntimeError('SECURITY_SESSION_INVALID', `Session is not active: ${sessionId}`);
    }

    return session;
  }
}
