import type {
  CapabilityGrant,
  CapabilityScope,
  SecurityCapability,
  SecurityResource,
} from './security-types';

/** Manages explicit, scoped, revocable capabilities. */
export class CapabilityManager {
  private readonly grants = new Map<string, CapabilityGrant>();

  /** Grants a scoped capability to a principal. */
  public grant(input: {
    readonly capability: SecurityCapability;
    readonly principalId: string;
    readonly reason: string;
    readonly scope?: CapabilityScope;
  }): CapabilityGrant {
    const grant: CapabilityGrant = {
      capability: input.capability,
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      principalId: input.principalId,
      reason: input.reason,
      scope: input.scope ?? {},
    };
    this.grants.set(grant.id, grant);
    return grant;
  }

  /** Revokes one grant. */
  public revoke(grantId: string): CapabilityGrant | undefined {
    const grant = this.grants.get(grantId);

    if (grant === undefined) {
      return undefined;
    }

    const next = { ...grant, revokedAt: Date.now() };
    this.grants.set(grantId, next);
    return next;
  }

  /** Revokes all capabilities for a principal. */
  public revokePrincipal(principalId: string): number {
    let count = 0;

    for (const grant of this.grants.values()) {
      if (grant.principalId === principalId && grant.revokedAt === undefined) {
        this.grants.set(grant.id, { ...grant, revokedAt: Date.now() });
        count += 1;
      }
    }

    return count;
  }

  /** Returns active grants. */
  public activeGrants(principalId: string): readonly CapabilityGrant[] {
    return [...this.grants.values()].filter(
      (grant) =>
        grant.principalId === principalId &&
        grant.revokedAt === undefined &&
        (grant.scope.expiresAt === undefined || grant.scope.expiresAt > Date.now()),
    );
  }

  /** Checks whether a principal has a scoped capability for a resource. */
  public hasCapability(
    principalId: string,
    capability: SecurityCapability,
    resource: SecurityResource,
  ): boolean {
    return this.activeGrants(principalId).some(
      (grant) =>
        grant.capability === capability &&
        matchesList(grant.scope.resourceTypes, resource.type) &&
        matchesList(grant.scope.resourceIds, resource.id) &&
        matchesList(grant.scope.dataClassifications, resource.classification) &&
        matchesOrigin(grant.scope.origins, resource.origin),
    );
  }
}

function matchesList(values: readonly string[] | undefined, candidate: string): boolean {
  return values === undefined || values.includes(candidate);
}

function matchesOrigin(patterns: readonly string[] | undefined, origin: string | undefined): boolean {
  if (patterns === undefined) {
    return true;
  }

  if (origin === undefined) {
    return false;
  }

  return patterns.some((pattern) => pattern === origin || (pattern.endsWith('*') && origin.startsWith(pattern.slice(0, -1))));
}
