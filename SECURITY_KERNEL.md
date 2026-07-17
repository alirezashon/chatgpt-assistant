# Security Kernel

The Security Kernel is the trust foundation for the AI browser platform. Every agent, plugin,
workflow, command, browser action, memory read, network call, and AI request should enter through the
kernel before execution.

## Authorization Path

Identity -> Capability -> Policy -> Risk -> Approval -> Execution -> Audit.

## Core Services

- `IdentityManager` creates principals and active sessions for humans, agents, plugins, workflows,
  commands, and external services.
- `CapabilityManager` grants, checks, and revokes scoped capabilities.
- `PolicyEngine` evaluates user, enterprise, plugin, agent, and workflow policies.
- `RiskEngine` calculates low, medium, high, or critical risk.
- `ApprovalManager` creates, approves, rejects, modifies, and expires human approval requests.
- `SecurityAuditLogger` stores who, what, when, why, decision, result, and safe details.
- `ThreatDetector` detects prompt injection, sensitive pages, suspicious behavior, and abuse.
- `DataGovernanceManager` classifies data with owner, origin, retention, permissions, and access
  history.

## Default Security Posture

- deny by default.
- explicit scoped capabilities only.
- deny policies win over allow policies.
- high and critical risk require approval or denial.
- all authorization decisions are audited.
- prompt injection content is isolated as untrusted data, never instructions.
