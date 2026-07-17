# ADR: Browser Agent Runtime

## Status

Accepted

## Context

The platform needs an autonomous intelligence layer that can understand a user goal, plan work,
select tools, execute actions, observe outcomes, recover from failures, and complete objectives.

The runtime sits above:

- context engine.
- action and command platform.
- AI runtime.
- workflow runtime.
- plugin runtime.
- browser automation adapters.

The agent must not directly manipulate DOM, bypass permissions, depend on prompts for security, or
become a chatbot wrapper. Browser control, AI calls, commands, workflows, APIs, and plugins must all
be capability-gated tools.

## Architectures Considered

### 1. Single LLM Agent

Low implementation complexity and flexible reasoning, but poor reliability, weak debugging, high
prompt-injection exposure, and unpredictable tool use. Rejected.

### 2. ReAct Architecture

Good observe-think-act loop and natural failure handling. Cost and latency can be high if every step
requires an LLM call. Accepted as the reasoning loop shape, not as the whole architecture.

### 3. Plan-and-Execute

Strong for debugging, audit, and user control. Weak when the environment changes unless replanning is
supported. Accepted.

### 4. Tree of Thoughts

Useful for hard planning but expensive and slow in a browser extension. Rejected for default runtime,
retained as an optional planner strategy.

### 5. Multi-Agent System

Promising for research, coding, writing, and review specialists, but costly and operationally complex.
Rejected for v1 runtime, prepared through identity, delegation, and shared memory contracts.

### 6. Blackboard Agent Architecture

Strong shared-memory model for multiple specialists. More complex than needed for v1. Accepted as a
future memory/delegation pattern.

### 7. Hierarchical Agent System

Good for long tasks and delegation. Requires robust conflict resolution. Accepted as a future
extension via parent/child session ids.

### 8. Workflow + Agent Hybrid

Agent creates or adapts plans; deterministic execution controls tools, approval, state, limits, and
audit. Strong reliability and security. Accepted.

### 9. Goal-Oriented Planner

Good conversion from natural language goals to objectives, constraints, success criteria, and tool
requirements. Accepted.

### 10. Cognitive Architecture

Excellent model for memory, reflection, goals, and control loops, but too broad for an initial
browser runtime. Accepted as design influence.

## Decision

Use a workflow-agent hybrid with a ReAct-inspired loop:

1. understand the goal.
2. retrieve relevant memory.
3. create an explicit plan.
4. select capability-gated tools for steps.
5. execute one action at a time.
6. observe changes through observation adapters.
7. verify progress against success criteria.
8. reflect and replan on failure or changed context.
9. require approval for risky actions.
10. persist timeline, decisions, observations, and safe memory.

## Trade-Offs

- Deterministic tool execution is less “magical” than a free-form agent but much safer.
- Explicit plans add overhead but make debugging, audit, approval, replay, and recovery possible.
- Tool schemas and permissions require more integration work but prevent direct DOM and provider
  access.
- Memory compression/retrieval is initially local and deterministic; vector or AI-assisted memory can
  be added behind the same interface later.

## Consequences

- Agents cannot bypass permissions because all actions go through the tool runtime.
- Browser control is semantic and adapter-backed, never direct DOM manipulation from agent code.
- Human control is built into session state through pause, resume, cancel, approval, and goal
  modification.
- Planning can change through replanning without changing execution infrastructure.
- Multi-agent delegation can be introduced later with shared memory and session identities.

## Future Migration Plan

1. Add AI-backed planners behind the planner interface.
2. Add browser accessibility-tree and screenshot observation adapters.
3. Add semantic element selection and page-understanding tools.
4. Add long-term encrypted memory with enterprise retention controls.
5. Add child agent sessions and blackboard memory for multi-agent workflows.
6. Add replay UI and benchmark harnesses using timeline and decision logs.
