import type {
  ExperimentOutcome,
  LearningAuditEvent,
  LearningDeployment,
  LearningExperiment,
  LearningFeature,
  LearningPrivacySettings,
  LearningRecommendation,
  PreferenceProfile,
  ValidatedLearningSignal,
} from './learning-types';

/** In-memory learning store with immutable append paths and reversible records. */
export class LearningStore {
  private readonly auditEvents: LearningAuditEvent[] = [];
  private readonly deployments: LearningDeployment[] = [];
  private readonly experiments = new Map<string, LearningExperiment>();
  private readonly features: LearningFeature[] = [];
  private readonly outcomes: ExperimentOutcome[] = [];
  private readonly privacySettings = new Map<string, LearningPrivacySettings>();
  private readonly profiles = new Map<string, PreferenceProfile>();
  private readonly recommendations = new Map<string, LearningRecommendation>();
  private readonly signals: ValidatedLearningSignal[] = [];

  public writeSignal(signal: ValidatedLearningSignal): void {
    this.signals.push(signal);
  }

  public writeFeature(feature: LearningFeature): void {
    this.features.push(feature);
  }

  public writeRecommendation(recommendation: LearningRecommendation): void {
    this.recommendations.set(recommendation.id, recommendation);
  }

  public writeProfile(profile: PreferenceProfile): void {
    this.profiles.set(profile.id, profile);
  }

  public writePrivacy(settings: LearningPrivacySettings): void {
    this.privacySettings.set(this.scopeKey(settings.scope, settings.subjectId), settings);
  }

  public writeExperiment(experiment: LearningExperiment): void {
    this.experiments.set(experiment.id, experiment);
  }

  public writeOutcome(outcome: ExperimentOutcome): void {
    this.outcomes.push(outcome);
  }

  public writeDeployment(deployment: LearningDeployment): void {
    this.deployments.push(deployment);
  }

  public writeAudit(event: LearningAuditEvent): void {
    this.auditEvents.push(event);
  }

  public getSignals(): readonly ValidatedLearningSignal[] {
    return this.signals;
  }

  public getFeatures(): readonly LearningFeature[] {
    return this.features;
  }

  public getRecommendations(): readonly LearningRecommendation[] {
    return [...this.recommendations.values()];
  }

  public getRecommendation(id: string): LearningRecommendation | undefined {
    return this.recommendations.get(id);
  }

  public getProfile(id: string): PreferenceProfile | undefined {
    return this.profiles.get(id);
  }

  public getProfiles(): readonly PreferenceProfile[] {
    return [...this.profiles.values()];
  }

  public getPrivacy(scope: string, subjectId: string): LearningPrivacySettings | undefined {
    return this.privacySettings.get(this.scopeKey(scope, subjectId));
  }

  public getExperiments(): readonly LearningExperiment[] {
    return [...this.experiments.values()];
  }

  public getExperiment(id: string): LearningExperiment | undefined {
    return this.experiments.get(id);
  }

  public getOutcomes(experimentId?: string): readonly ExperimentOutcome[] {
    return experimentId === undefined
      ? this.outcomes
      : this.outcomes.filter((outcome) => outcome.experimentId === experimentId);
  }

  public getDeployments(): readonly LearningDeployment[] {
    return this.deployments;
  }

  public getAuditEvents(): readonly LearningAuditEvent[] {
    return this.auditEvents;
  }

  public deleteSubject(subjectId: string): void {
    this.removeWhere(this.signals, (signal) => signal.subjectId === subjectId);
    this.removeWhere(this.features, (feature) => feature.subjectId === subjectId);
    this.removeWhere(this.deployments, (deployment) => deployment.subjectId === subjectId);

    for (const profile of this.profiles.values()) {
      if (profile.subjectId === subjectId) {
        this.profiles.delete(profile.id);
      }
    }

    for (const recommendation of this.recommendations.values()) {
      if (recommendation.subjectId === subjectId) {
        this.recommendations.delete(recommendation.id);
      }
    }

    for (const experiment of this.experiments.values()) {
      if (experiment.subjectId === subjectId) {
        this.experiments.delete(experiment.id);
      }
    }
  }

  private scopeKey(scope: string, subjectId: string): string {
    return `${scope}:${subjectId}`;
  }

  private removeWhere<T>(items: T[], predicate: (item: T) => boolean): void {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      const item = items[index];

      if (item !== undefined && predicate(item)) {
        items.splice(index, 1);
      }
    }
  }
}
