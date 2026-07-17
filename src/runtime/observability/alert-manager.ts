import type {
  Alert,
  AlertChannel,
  Anomaly,
  DiagnosticFinding,
  ObservabilitySeverity,
  ObservedSubsystem,
} from './observability-types';
import type { TelemetryStorage } from './telemetry-storage';

/** Alert routing policy. */
export interface AlertRoute {
  readonly channel: AlertChannel;
  readonly minimumSeverity: Exclude<ObservabilitySeverity, 'debug' | 'info'>;
  readonly subsystem?: ObservedSubsystem;
}

const SEVERITY_RANK: Readonly<Record<Exclude<ObservabilitySeverity, 'debug' | 'info'>, number>> = {
  critical: 3,
  error: 2,
  warn: 1,
};

/** Routes incidents to alert channels and keeps delivery history. */
export class AlertManager {
  private readonly routes: AlertRoute[] = [
    { channel: 'pagerduty', minimumSeverity: 'critical' },
    { channel: 'slack', minimumSeverity: 'warn' },
  ];

  public constructor(private readonly storage: TelemetryStorage) {}

  public register(route: AlertRoute): void {
    this.routes.push(route);
  }

  public alertFinding(finding: DiagnosticFinding): readonly Alert[] {
    return this.dispatch(finding.subsystem, finding.severity, finding.summary, finding.evidence.join('; '));
  }

  public alertAnomaly(anomaly: Anomaly): readonly Alert[] {
    return this.dispatch(
      anomaly.subsystem ?? 'workflow',
      anomaly.severity,
      `${anomaly.type} detected for ${anomaly.metric}`,
      `observed=${anomaly.observed.toString()} expected=${anomaly.expected.toString()}`,
    );
  }

  private dispatch(
    subsystem: ObservedSubsystem,
    severity: Exclude<ObservabilitySeverity, 'debug' | 'info'>,
    title: string,
    message: string,
  ): readonly Alert[] {
    const alerts = this.routes
      .filter((route) => this.matches(route, subsystem, severity))
      .map((route): Alert => ({
        channel: route.channel,
        id: `alert_${crypto.randomUUID()}`,
        message,
        severity,
        subsystem,
        timestamp: Date.now(),
        title,
      }));

    for (const alert of alerts) {
      this.storage.writeAlert(alert);
    }

    return alerts;
  }

  private matches(
    route: AlertRoute,
    subsystem: ObservedSubsystem,
    severity: Exclude<ObservabilitySeverity, 'debug' | 'info'>,
  ): boolean {
    return (
      (route.subsystem === undefined || route.subsystem === subsystem) &&
      SEVERITY_RANK[severity] >= SEVERITY_RANK[route.minimumSeverity]
    );
  }
}
