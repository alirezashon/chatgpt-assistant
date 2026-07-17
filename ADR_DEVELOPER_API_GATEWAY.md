# ADR: Developer API Gateway And External Integration Platform

## Status

Accepted

## Context

External applications, developers, enterprise systems, third-party services, and internal tools need
a safe public operating interface into agents, workflows, knowledge, memory, automation, plugins,
AI, and enterprise services. This cannot be direct service access or a simple REST proxy.

## Architectures Considered

### 1. Direct Service APIs

Fast to expose, but creates inconsistent auth, versioning, rate limits, audit, and developer
experience. Rejected.

### 2. API Gateway Pattern

Strong central security, routing, rate limiting, validation, logging, analytics, and versioning.
Accepted.

### 3. Backend For Frontend

Useful for dedicated UIs, but not sufficient as a public developer platform. Rejected for core.

### 4. GraphQL Federation

Great for typed graph queries and composed data, but weaker for webhooks, realtime events, and
simple automation triggers. Accepted as one protocol.

### 5. Event API Architecture

Excellent for workflow and automation integrations. Accepted.

### 6. Webhook First Architecture

Essential for outbound notifications and external automation, but incomplete for synchronous APIs.
Accepted.

### 7. Function As A Service Integration

Flexible but too execution-centric and harder to govern. Deferred.

### 8. API Mesh

Powerful for large service estates, but too complex for the first runtime. Deferred.

### 9. Hybrid REST + GraphQL + Event API

Best developer experience and enterprise fit: REST for resources, GraphQL for composed reads, event
APIs for subscriptions, and webhooks for delivery. Accepted.

## Decision

Implement a hybrid API Gateway runtime:

- every request authenticates through API keys, OAuth/JWT/service-account-compatible credentials,
  or future enterprise identity adapters.
- every application has scoped capabilities such as `agent.execute`, `workflow.execute`,
  `knowledge.search`, `memory.read`, `plugin.install`, and `enterprise.manage`.
- routes are versioned and protocol-aware.
- gateway handles routing, auth, authorization, rate limiting, validation, transformation, logging,
  analytics, and compatibility.
- webhook engine signs deliveries, retries failures, records delivery logs, and blocks replay.
- SDK generator emits typed client skeletons for TypeScript, Python, Java, Go, and C#.

## Consequences

- External developers can integrate without internal service access.
- API keys alone are not security; scopes, revocation, rotation, rate limits, validation, and audit
  all apply.
- Webhooks can recover from failures and provide replay protection.
- Enterprise/private APIs can be scoped by environment and organization.

## Future Migration Plan

- Add persistent credential storage with encrypted secret material.
- Add OAuth authorization code and client credentials grant adapters.
- Add OpenAPI/GraphQL schema exporters.
- Add edge gateway deployment and regional data residency routing.
- Add async queue-backed webhook delivery.
