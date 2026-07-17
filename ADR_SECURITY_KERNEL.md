# ADR: Trust, Security And Permission Operating System

## Status

Accepted

## Context

The AI browser platform executes actions on behalf of humans, agents, plugins, workflows, commands,
AI providers, memory systems, and external services. None of those actors can be trusted by default.
Every sensitive action must be evaluated through identity, capability, permission, policy, execution
boundary, approval, and audit.

## Architectures Considered

### 1. Role Based Access Control

Simple and familiar, but too coarse for scoped browser actions, page origins, data sensitivity, and
temporary access. Rejected as the primary model.

### 2. Attribute Based Access Control

Flexible and enterprise-ready. Strong for policy rules over trust, actor type, resource origin, and
data classification. Accepted as part of policy evaluation.

### 3. Capability Based Security

Excellent for explicit, scoped, revocable authority. Accepted as the core permission primitive.

### 4. Zero Trust Architecture

Correct operating posture for AI agents, plugins, web pages, external APIs, and model outputs.
Accepted as the system principle.

### 5. Sandbox Security Model

Required for plugin and browser isolation, but not enough to express business policy and approval
gates. Accepted as an execution boundary.

### 6. Policy Engine Architecture

Strong for user, enterprise, plugin, agent, and workflow policies. Accepted.

### 7. OS Kernel Permission Model

Good mental model for a central mediation layer. Accepted as the runtime shape.

### 8. Hybrid Capability + Policy System

Best blend of explicit authority, enterprise flexibility, auditability, revocation, and browser
performance. Accepted as the final architecture.

## Decision

Implement a security kernel that authorizes every action through:

1. identity context and active session.
2. explicit scoped capability grant.
3. deny-first policy evaluation.
4. risk scoring from actor trust, action type, data sensitivity, website trust, and behavior.
5. approval gates for high-risk actions.
6. audit logging for every decision.
7. threat detection for prompt injection, sensitive pages, anomalous behavior, and abuse.

## Trade-Offs

- More implementation surface than simple permission checks.
- Policies need discipline to keep developer experience pleasant.
- Approval gates can add friction, but only for risky actions.
- In-memory stores keep the foundation local and testable; persistence can be added behind the same
  service boundaries.

## Consequences

- AI actions cannot bypass the kernel without being visible in tests and architecture review.
- Capabilities are scoped, revocable, auditable, and temporary when needed.
- Plugins and agents cannot gain unlimited access by declaring broad intent.
- Users and enterprise admins can understand why an action was allowed, denied, or held for approval.

## Future Migration Plan

- Persist audit logs, identity sessions, policies, and grants to encrypted storage.
- Add enterprise policy sync and admin-managed policy bundles.
- Add sandbox adapters for extension isolated worlds, offscreen documents, and plugin processes.
- Add compliance export, SSO identity binding, and organization/team policy layers.
