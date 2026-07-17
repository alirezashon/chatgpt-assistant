import type { LearningDeployment, LearningRecommendation } from './learning-types';
import type { LearningStore } from './learning-store';

/** Deploys learned recommendations as reversible policy versions. */
export class LearningDeploymentManager {
  public constructor(private readonly store: LearningStore) {}

  public deploy(recommendationId: string, approved = false): LearningDeployment {
    const recommendation = this.store.getRecommendation(recommendationId);

    if (recommendation === undefined) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }

    const blocked = recommendation.requiresApproval && !approved;
    const version = this.nextVersion(recommendation);
    const deployment: LearningDeployment = {
      change: recommendation.proposedChange,
      confidence: recommendation.confidence,
      deployedAt: Date.now(),
      domain: recommendation.domain,
      id: `deployment_${crypto.randomUUID()}`,
      recommendationId,
      reason: blocked ? 'Approval required before deploying learned behavior.' : 'Recommendation deployed.',
      ...(version > 1 ? { rollbackToVersion: version - 1 } : {}),
      status: blocked ? 'blocked' : 'active',
      subjectId: recommendation.subjectId,
      version,
    };
    this.store.writeDeployment(deployment);
    this.store.writeRecommendation({
      ...recommendation,
      status: blocked ? recommendation.status : 'deployed',
    });
    this.audit(blocked ? 'deployment.blocked' : 'deployment.active', deployment);
    return deployment;
  }

  public rollback(deploymentId: string): LearningDeployment {
    const deployment = this.store.getDeployments().find((candidate) => candidate.id === deploymentId);

    if (deployment === undefined) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const rolledBack: LearningDeployment = {
      ...deployment,
      deployedAt: Date.now(),
      id: `deployment_${crypto.randomUUID()}`,
      reason: `Rolled back deployment ${deployment.id}.`,
      status: 'rolled-back',
    };
    const recommendation = this.store.getRecommendation(deployment.recommendationId);

    if (recommendation !== undefined) {
      this.store.writeRecommendation({
        ...recommendation,
        status: 'rolled-back',
      });
    }

    this.store.writeDeployment(rolledBack);
    this.audit('deployment.rolled-back', rolledBack);
    return rolledBack;
  }

  private nextVersion(recommendation: LearningRecommendation): number {
    return (
      this.store
        .getDeployments()
        .filter((deployment) => deployment.domain === recommendation.domain && deployment.subjectId === recommendation.subjectId)
        .reduce((max, deployment) => Math.max(max, deployment.version), 0) + 1
    );
  }

  private audit(message: string, deployment: LearningDeployment): void {
    this.store.writeAudit({
      attributes: {
        deploymentId: deployment.id,
        domain: deployment.domain,
        recommendationId: deployment.recommendationId,
        status: deployment.status,
        version: deployment.version,
      },
      id: `audit_${crypto.randomUUID()}`,
      message,
      timestamp: Date.now(),
      type: deployment.status === 'rolled-back' ? 'rollback' : 'deployment',
    });
  }
}
