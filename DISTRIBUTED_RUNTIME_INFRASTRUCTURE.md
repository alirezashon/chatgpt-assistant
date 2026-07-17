# Distributed Runtime Infrastructure

The Distributed Runtime is the platform nervous system. It lets services communicate through
versioned events, execute background jobs, schedule recurring work, checkpoint long-running tasks,
publish realtime updates, and replay/audit distributed execution.

## Core Pipeline

Publisher -> Event Registry -> Security Check -> Event Log -> Router -> Consumer -> Ack/Retry ->
Dead Letter/Replay.

## Core Systems

- `DistributedEventBus`
- `DistributedEventRegistry`
- `EventSecurityManager`
- `DistributedStateStore`
- `JobRuntime`
- `WorkerPool`
- `DistributedScheduler`
- `RealtimeHub`
- `DistributedTraceRecorder`

## Delivery Semantics

- `at-most-once` for fire-and-forget updates.
- `at-least-once` for default durable delivery with retry.
- `exactly-once` using idempotency keys where required.

## Platform Events

The runtime supports browser, AI, agent, memory, workflow, security, enterprise, marketplace, and API
events while keeping schemas versioned and migratable.
