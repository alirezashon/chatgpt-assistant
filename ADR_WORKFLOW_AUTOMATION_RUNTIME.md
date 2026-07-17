# ADR: AI Workflow Automation Runtime

## Status

Accepted

## Context

The extension needs a workflow automation runtime that can compose triggers, context, conditions,
commands, AI reasoning, actions, human approval, and integrations. It must sit above the plugin
runtime, AI runtime, command platform, and context engine without becoming coupled to their
implementations.

Workflows may run for seconds, minutes, or days. Chrome MV3 service workers can restart at any time,
so workflow state must be checkpointed into a persistence abstraction and recoverable by a new
runtime instance.

## Architectures Considered

### 1. Simple Sequential Pipeline

Reliable for short tasks and easy to debug, but weak for parallel execution, pause/resume, approval,
and recovery. Rejected as the main architecture.

### 2. DAG Workflow Engine

Excellent for dependencies, parallelism, and deterministic replay. More complex for dynamic agent
planning and loops. Accepted as part of the final model.

### 3. State Machine Workflow

Strong for long-running tasks, human approval, retries, cancellation, and browser restarts. Debugging
is good because every transition is explicit. Accepted as part of the final model.

### 4. BPMN Style Engine

Expressive for enterprise workflows but too heavy for browser-extension constraints and developer
experience. Rejected for v1.

### 5. Event Sourcing Workflow

Excellent audit and replay properties, but more storage-heavy and complex than needed for local MV3
runtime. Accepted as an audit/checkpoint influence, not the whole engine.

### 6. Actor Based Workflow

Good isolation and scalability, but requires more runtime machinery and message routing than the
current platform needs. Rejected for v1.

### 7. Agent Planning Engine

Powerful for goal-driven automation, but unreliable as the sole execution substrate. Accepted as an
optional planner layer that emits workflow plans.

### 8. Hybrid DAG + Agent Architecture

Agent or deterministic planner produces a workflow graph; state-machine execution persists progress,
checkpoints, retries, approvals, and audit events. Accepted.

## Decision

Use a hybrid DAG/state-machine workflow runtime:

- workflows are schema-defined plans with triggers, variables, permissions, timeout, retry policy,
  error strategy, owner, visibility, metadata, and steps.
- triggers resolve workflows but do not execute directly.
- scheduler enqueues workflow executions with bounded concurrency.
- executor runs steps through a step registry, not hardcoded business logic.
- state manager persists execution state after every transition.
- checkpoint manager records recoverable snapshots.
- recovery manager resumes pending/running/waiting executions after restart.
- human approval steps pause execution until an approval decision arrives.
- AI planning is an injected planner interface that can produce workflow definitions without changing
  execution semantics.

## Trade-Offs

- The engine is more complex than a sequential macro runner, but it supports recovery, approval,
  retry, and plugin-contributed steps.
- Persistence after every step adds overhead, but browser restart safety matters more.
- Gateway interfaces require adapters for command, AI, plugin, browser, and API execution, but keep
  workflow core independent.

## Consequences

- Workflows can survive browser restart through a persistent state store.
- Plugins can contribute workflow steps by registering step handlers.
- AI can participate as a step and as a future planner.
- UI surfaces can inspect timeline, logs, checkpoints, and pending approvals without controlling
  execution.
- Failed workflows can be retried or recovered instead of disappearing.

## Future Migration Plan

1. Persist state store through Chrome storage or IndexedDB in production.
2. Add remote enterprise policy and approval routing.
3. Add visual DAG editor and replay UI using timeline/checkpoint contracts.
4. Add distributed webhook/schedule trigger adapters.
5. Add agent planner implementations behind the planner interface.
6. Add compensation orchestration for multi-step rollback.
