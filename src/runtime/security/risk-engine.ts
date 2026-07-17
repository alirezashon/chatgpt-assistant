import type { AuthorizationRequest, RiskAssessment, TrustLevel } from './security-types';

const TRUST_PENALTY: Readonly<Record<TrustLevel, number>> = {
  'enterprise-approved': 0,
  limited: 18,
  trusted: 4,
  unknown: 30,
  verified: 10,
};

/** Calculates contextual action risk from actor, action, data, website, and behavior signals. */
export class RiskEngine {
  private readonly deniedByPrincipal = new Map<string, number>();

  /** Records denied behavior for anomaly scoring. */
  public recordDenied(principalId: string): void {
    this.deniedByPrincipal.set(principalId, (this.deniedByPrincipal.get(principalId) ?? 0) + 1);
  }

  /** Assesses risk. */
  public assess(request: AuthorizationRequest): RiskAssessment {
    const factors: string[] = [];
    let score = TRUST_PENALTY[request.context.actor.principal.trustLevel];

    if (['filesystem.write', 'plugin.install', 'browser.navigate'].includes(request.capability)) {
      score += 20;
      factors.push('mutating-capability');
    }

    if (request.resource.classification === 'sensitive') {
      score += 25;
      factors.push('sensitive-data');
    }

    if (request.resource.classification === 'restricted') {
      score += 40;
      factors.push('restricted-data');
    }

    if (request.resource.origin !== undefined && isSensitiveOrigin(request.resource.origin)) {
      score += 35;
      factors.push('sensitive-origin');
    }

    const deniedCount = this.deniedByPrincipal.get(request.context.actor.principal.id) ?? 0;
    if (deniedCount >= 3) {
      score += 20;
      factors.push('previous-denials');
    }

    return {
      factors,
      level: toRiskLevel(score),
      score: Math.min(100, score),
    };
  }
}

function isSensitiveOrigin(origin: string): boolean {
  const lower = origin.toLowerCase();
  return ['bank', 'paypal', 'stripe', 'health', 'medical', 'admin'].some((term) => lower.includes(term));
}

function toRiskLevel(score: number): RiskAssessment['level'] {
  if (score >= 75) {
    return 'critical';
  }

  if (score >= 50) {
    return 'high';
  }

  if (score >= 25) {
    return 'medium';
  }

  return 'low';
}
