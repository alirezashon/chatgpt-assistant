# ADR: Multi-Agent Collaboration And Orchestration Runtime

## Status

Accepted

## Context

The extension needs an AI organization layer where a supervisor decomposes a user goal, selects
specialized agents, controls permissions, coordinates shared artifacts, resolves conflicts, tracks
cost, and keeps humans in control for risky actions.

This is not multiple chat panes. It is a runtime for reliable delegation across specialized agents.

## Architectures Considered

### 1. Single Agent

Simple to debug and cheap to operate, but weak at specialization, peer review, parallel work, and
permission isolation. Rejected as the collaboration architecture.

### 2. Sequential Multi-Agent Pipeline

Reliable and easy to replay, but underuses parallelism and struggles when tasks need negotiation.
Accepted as one execution strategy.

### 3. Supervisor Agent Pattern

Strong human control, central auditability, and simple security boundaries. The supervisor plans,
assigns, monitors, and merges work without executing every action. Accepted.

### 4. Hierarchical Agent System

Scales to large organizations, but adds routing and debugging complexity early. Accepted as a future
extension over supervisor sessions.

### 5. Blackboard Architecture

Excellent shared workspace for artifacts, decisions, observations, and intermediate results.
Accepted as the shared collaboration substrate.

### 6. Peer-to-Peer Agent Network

Flexible but difficult to secure, replay, budget, and debug. Rejected for core execution.

### 7. Actor Model

Good isolation and concurrency semantics, but too low-level as the product-facing abstraction.
Accepted internally for future scheduling improvements.

### 8. Market-Based Agent Coordination

Useful for cost optimization and agent bidding, but unpredictable and harder for users to control.
Rejected for the initial runtime.

### 9. Graph-Based Agent Planning

Best representation for dependencies, parallelism, retries, and task state. Accepted.

### 10. Hybrid Supervisor + Peer Model

Combines centralized control with constrained peer review, debate, and consensus. Accepted as the
final architecture.

## Decision

Use a hybrid supervisor + blackboard + graph task runtime:

- a supervisor owns the session, plan, assignments, approvals, recovery, and final synthesis.
- agent registry stores dynamic specialized agents and their capabilities, permissions, limits, cost
  model, health, and executors.
- task graph supports dependencies, priority, parallel execution, retries, deadlines, constraints,
  success criteria, and multiple execution strategies.
- agents communicate through typed messages and blackboard artifacts, not direct memory mutation.
- permission manager enforces capability and tool access per agent and records audit events.
- blackboard stores versioned artifacts, decisions, observations, and task state.
- conflict resolver compares agent outputs using confidence, quality, cost, and risk signals.
- observability captures timeline, task graph, communication logs, decisions, approvals, metrics,
  and replayable history.

## Trade-Offs

- More moving parts than a single-agent runtime.
- Deterministic planning is conservative until an AI planner is plugged in.
- Central supervision can become a bottleneck for very large agent swarms.
- Permission checks and audit logs add overhead, but they are required for commercial safety.

## Consequences

- Future agents can be registered dynamically without core changes.
- No agent receives unlimited permissions by default.
- Risky tools can be gated through human approval.
- A failed agent can be retried, replaced, or escalated without destroying the session.
- Shared state remains inspectable and replayable.

## Future Migration Plan

The first runtime uses an in-process scheduler and deterministic planner. Future versions can add:

- AI-generated task graphs behind the same `MultiAgentPlanner` interface.
- persistent blackboard storage.
- actor-backed distributed execution.
- agent bidding for model/cost optimization.
- hierarchical supervisors for large projects.
- plugin-contributed agents with sandboxed executor APIs.
