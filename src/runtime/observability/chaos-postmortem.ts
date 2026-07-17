import type { ObservedSubsystem, Postmortem } from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Controlled chaos experiment definition. */
export interface ChaosExperiment {
  readonly blastRadius: 'local' | 'organization' | 'subsystem';
  readonly id: string;
  readonly name: string;
  readonly subsystem: ObservedSubsystem;
  readonly fault: 'dependency-timeout' | 'queue-backlog' | 'service-down' | 'tool-failure';
}

/** Chaos and incident review utilities. */
export class ChaosPostmortemService {
  public constructor(private readonly storage: TelemetryStorage) {}

  public inject(experiment: ChaosExperiment): string {
    const event = `chaos:${experiment.id}:${experiment.subsystem}:${experiment.fault}:${experiment.blastRadius}`;
    return event;
  }

  public createPostmortem(title: string): Postmortem {
    const findings = this.storage.getFindings();
    const anomalies = this.storage.getAnomalies();
    const recoveries = this.storage.getRecoveries();
    const alerts = this.storage.getAlerts();
    const rootCause = findings[0]?.summary ?? anomalies[0]?.type ?? 'No automated root cause found.';
    const recovery = recoveries.map((record) => `${record.action}:${record.status}`).join(', ') || 'No recovery recorded.';
    const timeline = [
      ...alerts.map((alert) => `Alert ${alert.title} sent to ${alert.channel}`),
      ...findings.map((finding) => `Finding ${finding.type}: ${finding.summary}`),
      ...recoveries.map((record) => `Recovery ${record.action}: ${record.status}`),
    ];
    const postmortem: Postmortem = {
      correctiveActions: [
        'Add a regression test for the triggering condition.',
        'Review alert thresholds against current production traffic.',
        'Confirm recovery policies have the minimum required permission.',
      ],
      createdAt: Date.now(),
      id: `postmortem_${crypto.randomUUID()}`,
      impact: `${alerts.length.toString()} alerts, ${findings.length.toString()} findings, ${anomalies.length.toString()} anomalies.`,
      recovery,
      rootCause,
      timeline,
      title,
    };
    this.storage.writePostmortem(postmortem);
    return postmortem;
  }
}
