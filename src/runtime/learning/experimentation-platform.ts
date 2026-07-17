import type { ExperimentOutcome, LearningExperiment } from './learning-types';
import type { LearningStore } from './learning-store';

/** Experimentation platform for flags, shadow evaluation, canaries, A/B tests, and rollback. */
export class ExperimentationPlatform {
  public constructor(private readonly store: LearningStore) {}

  public register(input: Omit<LearningExperiment, 'createdAt' | 'id' | 'status'>): LearningExperiment {
    const experiment: LearningExperiment = {
      ...input,
      createdAt: Date.now(),
      id: `experiment_${crypto.randomUUID()}`,
      status: 'active',
    };
    this.store.writeExperiment(experiment);
    this.audit('experiment.created', { experimentId: experiment.id, strategy: experiment.strategy });
    return experiment;
  }

  public record(outcome: ExperimentOutcome): ExperimentOutcome {
    this.store.writeOutcome(outcome);
    return outcome;
  }

  public evaluate(experimentId: string): LearningExperiment {
    const experiment = this.store.getExperiment(experimentId);

    if (experiment === undefined) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    const outcomes = this.store.getOutcomes(experimentId);
    const rollbackValues = outcomes.filter((outcome) => outcome.metric === experiment.rollbackMetric);
    const successValues = outcomes.filter((outcome) => outcome.metric === experiment.successMetric);
    const hasRegression = rollbackValues.some((outcome) => outcome.value < 0);
    const hasPromotionEvidence = successValues.length >= 2 && successValues.every((outcome) => outcome.value > 0);
    const next: LearningExperiment = {
      ...experiment,
      status: hasRegression ? 'rolled-back' : hasPromotionEvidence ? 'promoted' : experiment.status,
    };
    this.store.writeExperiment(next);
    this.audit(`experiment.${next.status}`, { experimentId });
    return next;
  }

  public flagEnabled(experimentId: string, subjectKey: string): boolean {
    const experiment = this.store.getExperiment(experimentId);

    if (experiment === undefined || experiment.status !== 'active') {
      return false;
    }

    const bucket = this.bucket(subjectKey);
    return bucket < experiment.rolloutPercent;
  }

  private bucket(subjectKey: string): number {
    let hash = 0;

    for (const character of subjectKey) {
      hash += character.charCodeAt(0);
    }

    return hash % 100;
  }

  private audit(message: string, attributes: Readonly<Record<string, string>>): void {
    this.store.writeAudit({
      attributes,
      id: `audit_${crypto.randomUUID()}`,
      message,
      timestamp: Date.now(),
      type: 'experiment',
    });
  }
}
