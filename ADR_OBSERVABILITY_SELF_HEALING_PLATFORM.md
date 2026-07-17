# ADR: Observability, Diagnostics, Telemetry And Self-Healing Platform

## Status

Accepted

## Context

The platform now includes AI, agents, knowledge, memory, workflows, plugins, security, marketplace,
API gateway, browser/hybrid runtime, distributed runtime, and enterprise systems. Logging alone is
not enough. Every action must be observable, every failure traceable, every anomaly measurable, and
safe recovery should be automatic.

## Architectures Considered

### 1. Logging Only

Simple and cheap, but cannot support distributed tracing, SLOs, anomaly detection, capacity
planning, or self-healing. Rejected.

### 2. Metrics First

Good for dashboards and alerts, but poor for root-cause analysis without correlated logs and traces.
Rejected as the sole model.

### 3. OpenTelemetry-Style Signals

Best common model for logs, metrics, traces, events, profiles, and resource attributes. Accepted.

### 4. APM Platform Model

Strong for service latency and errors, but incomplete for AI-specific KPIs, browser runtime, and
self-healing. Accepted as inspiration.

### 5. Autonomous SRE Runtime

Best fit for diagnostics, anomaly detection, health, alerts, postmortems, and policy-gated recovery.
Accepted.

### 6. Event-Sourced Reliability

Excellent auditability and replay, but too heavy for every signal. Accepted for telemetry storage and
recovery history, not every dashboard calculation.

## Decision

Implement an observability and self-healing runtime:

- telemetry SDK emits structured logs, metrics, traces, events, profiles, health, business KPIs, and
  AI KPIs.
- collector normalizes and redacts sensitive data.
- storage keeps queryable telemetry records in memory behind replaceable interfaces.
- query engine supports logs/metrics/traces/events search.
- health engine tracks liveness, readiness, dependencies, and degraded modes.
- diagnostics engine detects regressions, memory leaks, retry storms, queue congestion, workflow
  stalls, and agent loops.
- anomaly detector flags traffic, latency, cost, security, AI behavior, plugin abuse, and resource
  exhaustion anomalies.
- self-healing engine applies safe recovery policies: retry, circuit break, graceful degradation,
  provider failover, queue draining, worker replacement, and restart. Destructive actions are never
  retried without approval.
- alert manager routes threshold, anomaly, SLO, security, AI quality, and enterprise policy alerts.
- postmortem generator summarizes timeline, root cause, impact, recovery, and corrective actions.

## Consequences

- All major platform systems can be observed through one runtime.
- Logs, metrics, and traces share correlation IDs.
- AI cost and quality can be monitored continuously.
- Recovery is auditable and policy-controlled.
- Production dashboards and SLOs can be generated from common telemetry.

## Future Migration Plan

- Add OpenTelemetry export adapters.
- Add persistent telemetry store and retention tiers.
- Add external alert sinks for Slack, email, webhooks, and PagerDuty.
- Add ML-based anomaly forecasting.
- Add flamegraph/profile visualization.
