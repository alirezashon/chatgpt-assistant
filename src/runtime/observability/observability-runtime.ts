import { AlertManager } from './alert-manager';
import { AnomalyDetector } from './anomaly-detector';
import { ChaosPostmortemService } from './chaos-postmortem';
import { DiagnosticsEngine } from './diagnostics-engine';
import { HealthEngine } from './health-engine';
import { SLODashboardService } from './slo-dashboard';
import { SelfHealingRuntime } from './self-healing-runtime';
import { TelemetryCollector, type TelemetryCollectorOptions } from './telemetry-collector';
import { TelemetryQueryEngine } from './query-engine';
import { TelemetrySDK } from './telemetry-sdk';
import { TelemetryStorage } from './telemetry-storage';
import type { Alert, Anomaly, DiagnosticFinding, RecoveryRecord } from './observability-types';

/** Observability runtime dependencies. */
export interface ObservabilityRuntimeDependencies {
  readonly collectorOptions?: TelemetryCollectorOptions;
  readonly storage?: TelemetryStorage;
}

/** Complete observability, diagnostics, telemetry, and self-healing platform. */
export class ObservabilityRuntime {
  public readonly alerts: AlertManager;
  public readonly anomalies: AnomalyDetector;
  public readonly chaos: ChaosPostmortemService;
  public readonly collector: TelemetryCollector;
  public readonly diagnostics: DiagnosticsEngine;
  public readonly health: HealthEngine;
  public readonly query: TelemetryQueryEngine;
  public readonly selfHealing: SelfHealingRuntime;
  public readonly sdk: TelemetrySDK;
  public readonly slo: SLODashboardService;
  public readonly storage: TelemetryStorage;

  public constructor(dependencies: ObservabilityRuntimeDependencies = {}) {
    this.storage = dependencies.storage ?? new TelemetryStorage();
    this.collector = new TelemetryCollector(this.storage, dependencies.collectorOptions);
    this.sdk = new TelemetrySDK(this.collector);
    this.query = new TelemetryQueryEngine(this.storage);
    this.health = new HealthEngine(this.storage);
    this.diagnostics = new DiagnosticsEngine(this.storage);
    this.anomalies = new AnomalyDetector(this.storage);
    this.alerts = new AlertManager(this.storage);
    this.selfHealing = new SelfHealingRuntime(this.storage);
    this.slo = new SLODashboardService(this.storage);
    this.chaos = new ChaosPostmortemService(this.storage);
  }

  public evaluateAndRecover(): {
    readonly alerts: readonly Alert[];
    readonly anomalies: readonly Anomaly[];
    readonly findings: readonly DiagnosticFinding[];
    readonly recoveries: readonly RecoveryRecord[];
  } {
    const findings = this.diagnostics.analyze();
    const anomalies = this.anomalies.detect();
    const alerts = [
      ...findings.flatMap((finding) => this.alerts.alertFinding(finding)),
      ...anomalies.flatMap((anomaly) => this.alerts.alertAnomaly(anomaly)),
    ];
    const recoveries = [
      ...findings.flatMap((finding) => this.selfHealing.recover({ signal: finding })),
      ...anomalies.flatMap((anomaly) => this.selfHealing.recover({ signal: anomaly })),
      ...this.storage.getHealthChecks().flatMap((check) => this.selfHealing.recover({ signal: check })),
    ];

    return {
      alerts,
      anomalies,
      findings,
      recoveries,
    };
  }
}
