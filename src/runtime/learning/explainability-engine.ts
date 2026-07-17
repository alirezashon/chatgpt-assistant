import type { LearningExplanation } from './learning-types';
import type { LearningStore } from './learning-store';

/** Produces human-readable explanations for learned behavior. */
export class ExplainabilityEngine {
  public constructor(private readonly store: LearningStore) {}

  public explainRecommendation(recommendationId: string): LearningExplanation {
    const recommendation = this.store.getRecommendation(recommendationId);

    if (recommendation === undefined) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }

    return {
      confidence: recommendation.confidence,
      evidence: recommendation.evidence,
      learnedAt: recommendation.createdAt,
      reversible: recommendation.reversible,
      rollbackPath: recommendation.reversible
        ? `Rollback deployment for recommendation ${recommendation.id}.`
        : 'No rollback path is available.',
      targetId: recommendation.id,
      whatChanged: `${recommendation.action} for ${recommendation.domain}.`,
      why: recommendation.evidence.summary,
    };
  }

  public explainDeployment(deploymentId: string): LearningExplanation {
    const deployment = this.store.getDeployments().find((candidate) => candidate.id === deploymentId);

    if (deployment === undefined) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const recommendation = this.store.getRecommendation(deployment.recommendationId);

    if (recommendation === undefined) {
      throw new Error(`Recommendation not found: ${deployment.recommendationId}`);
    }

    return {
      confidence: deployment.confidence,
      evidence: recommendation.evidence,
      learnedAt: deployment.deployedAt,
      reversible: recommendation.reversible,
      rollbackPath:
        deployment.rollbackToVersion === undefined
          ? 'Deactivate this deployment to return to default behavior.'
          : `Rollback to version ${deployment.rollbackToVersion.toString()}.`,
      targetId: deployment.id,
      whatChanged: `Deployed version ${deployment.version.toString()} for ${deployment.domain}.`,
      why: recommendation.evidence.summary,
    };
  }
}
