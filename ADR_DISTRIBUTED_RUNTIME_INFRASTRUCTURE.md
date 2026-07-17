# ADR: Distributed Event Bus And Cloud Runtime Infrastructure

## Status

Accepted

## Context

The platform now has agents, memory, knowledge, workflows, security, enterprise, marketplace, AI, and
API gateway systems. Direct service calls would create tight coupling, fragile recovery, poor replay,
and unclear ownership. The platform needs a distributed nervous system for events, async execution,
background work, scheduling, workers, state, realtime updates, and observability.

## Architectures Considered

### 1. REST Only Communication

Simple and familiar, but poor for fan-out, retries, replay, background processing, and realtime
state propagation. Rejected as the internal nervous system.

### 2. GraphQL Federation

Strong for composed reads, weak for durable async execution and fault tolerance. Rejected for core
runtime communication.

### 3. Message Queue Architecture

Good for background jobs and retries, but too narrow for schema evolution, replay, realtime,
stateful workers, and event contracts. Accepted as one subsystem.

### 4. Event Driven Architecture

Best fit for decoupled platform services, triggers, fan-out, replay, observability, and integration.
Accepted.

### 5. Event Sourcing

Excellent audit and replay model, but expensive if every domain object is event-sourced immediately.
Accepted for event log and selected state recovery, not required for every service.

### 6. Actor Model

Useful for isolated workers and agent execution, but not the whole product contract. Deferred behind
worker runtime abstractions.

### 7. Workflow Orchestration

Strong for long-running business processes, but the platform already has a workflow runtime. Accepted
as a consumer of the event/job layer.

### 8. Serverless Event Runtime

Good deployment target, but local/runtime code should not depend on one cloud vendor. Deferred as an
adapter.

### 9. Hybrid Event + API Architecture

Best balance: APIs for external synchronous boundaries, events/jobs for internal async platform
coordination. Accepted.

## Decision

Implement a hybrid event + job + state runtime:

- events are immutable versioned envelopes with actor, organization, security, metadata, and schema.
- event registry tracks schemas, compatibility, deprecation, and migration.
- event bus supports at-most-once, at-least-once, and exactly-once delivery where idempotency keys
  are available.
- retries, acknowledgements, dead-letter queues, and replay are built in.
- job runtime supports priority queues, immediate/delayed/recurring/event-triggered work, worker
  health, retries, recovery, and resource limits.
- state store supports checkpoint, resume, recovery, and versioning.
- realtime hub supports subscriptions and presence.
- observability records event paths, job timelines, failures, latency, and dependency traces.

## Consequences

- Services can communicate without direct dependencies.
- Events can live for years through schema versioning and migration.
- Failed tasks can recover or move to dead letter queues.
- Realtime product surfaces can subscribe without polling domain services.
- Cloud/serverless/queue adapters can replace in-memory stores later.

## Future Migration Plan

- Add persistent event store and outbox drivers.
- Add cloud adapters for Kafka, Pub/Sub, SQS, Durable Objects, and WebSocket gateways.
- Add partitioning by organization and event type.
- Add distributed worker leases and heartbeats backed by shared storage.
- Add OpenTelemetry export adapters.
