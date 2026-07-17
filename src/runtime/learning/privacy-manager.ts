import type {
  LearningDomain,
  LearningPrivacySettings,
  LearningScope,
  LearningSignal,
  LearningValue,
} from './learning-types';
import type { LearningStore } from './learning-store';

/** Privacy manager for opt-in learning, retention, export, deletion, and minimization. */
export class LearningPrivacyManager {
  public constructor(private readonly store: LearningStore) {}

  public configure(settings: LearningPrivacySettings): LearningPrivacySettings {
    this.store.writePrivacy(settings);
    this.audit('privacy.settings.updated', {
      enabled: settings.enabled,
      onDeviceOnly: settings.onDeviceOnly,
      scope: settings.scope,
      subjectId: settings.subjectId,
    });
    return settings;
  }

  public enabled(scope: LearningScope, subjectId: string, domain: LearningDomain): boolean {
    const settings = this.store.getPrivacy(scope, subjectId);
    return settings?.enabled === true && settings.allowedDomains.includes(domain);
  }

  public minimize(signal: LearningSignal): LearningSignal {
    const metadata = Object.fromEntries(
      Object.entries(signal.metadata).filter(([key]) => !this.isSensitiveKey(key)),
    );
    return {
      ...signal,
      metadata,
      value: this.minimizeValue(signal.value),
    };
  }

  public exportSubject(subjectId: string): Readonly<Record<string, LearningValue>> {
    return {
      deployments: this.store.getDeployments().filter((deployment) => deployment.subjectId === subjectId).length,
      features: this.store.getFeatures().filter((feature) => feature.subjectId === subjectId).length,
      profiles: this.store.getProfiles().filter((profile) => profile.subjectId === subjectId).length,
      recommendations: this.store.getRecommendations().filter((recommendation) => recommendation.subjectId === subjectId)
        .length,
      signals: this.store.getSignals().filter((signal) => signal.subjectId === subjectId).length,
    };
  }

  public deleteSubject(subjectId: string): void {
    this.store.deleteSubject(subjectId);
    this.audit('privacy.subject.deleted', { subjectId });
  }

  public pruneExpired(now = Date.now()): number {
    const expiredSubjects = new Set<string>();

    for (const signal of this.store.getSignals()) {
      const settings = this.store.getPrivacy(signal.scope, signal.subjectId);

      if (settings !== undefined && signal.timestamp + settings.retentionMs < now) {
        expiredSubjects.add(signal.subjectId);
      }
    }

    for (const subjectId of expiredSubjects) {
      this.deleteSubject(subjectId);
    }

    return expiredSubjects.size;
  }

  private minimizeValue(value: LearningValue): LearningValue {
    if (this.isArray(value)) {
      return value.map((entry) => this.minimizeValue(entry));
    }

    if (this.isRecord(value)) {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !this.isSensitiveKey(key))
          .map(([key, entry]) => [key, this.minimizeValue(entry)]),
      );
    }

    return value;
  }

  private isArray(value: LearningValue): value is readonly LearningValue[] {
    return Array.isArray(value);
  }

  private isRecord(value: LearningValue): value is Readonly<Record<string, LearningValue>> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isSensitiveKey(key: string): boolean {
    return ['apikey', 'authorization', 'cookie', 'password', 'secret', 'token'].includes(key.toLowerCase());
  }

  private audit(message: string, attributes: Readonly<Record<string, LearningValue>>): void {
    this.store.writeAudit({
      attributes,
      id: `audit_${crypto.randomUUID()}`,
      message,
      timestamp: Date.now(),
      type: 'privacy',
    });
  }
}
