# Browser Agent Runtime

The Browser Agent Runtime is the autonomous execution layer. It is not a chatbot surface. It turns
goals into plans, selects tools, executes capability-gated actions, observes results, reflects on
failures, and completes objectives with human control.

## Core Model

- `AgentRuntime`: public facade for sessions, tools, memory, planning, and control.
- `AgentSession`: persisted unit of autonomous work.
- `AgentIdentity`: user, plugin, or system identity running the agent.
- `AgentGoal`: objective, constraints, success criteria, preferences, deadline, and permissions.
- `AgentPlan`: ordered or parallelizable steps.
- `AgentStep`: planned unit of work with tool requirements and success checks.
- `AgentMemory`: short-term, session, long-term, preference, task, and knowledge memory.
- `AgentState`: running, paused, waiting approval, completed, failed, or cancelled.
- `AgentObservation`: what changed after an action.
- `AgentDecision`: why the agent chose a tool/action.
- `AgentTool`: capability-gated execution primitive.
- `AgentResult`: final outcome and artifacts.
- `AgentError`: typed, recoverable failure.

## Tool Rules

Agents never call DOM APIs, Chrome APIs, provider clients, command internals, or plugin internals.
They call tools. Tools declare name, description, schema, permissions, cost, risk, latency, and
availability. The tool runtime checks permissions, approval gates, action limits, and audit logging.

## Browser Control Layer

Browser tools use semantic browser control adapters:

- navigation.
- element detection.
- click/type/scroll/forms.
- downloads/uploads.
- screenshots.
- page understanding.

The agent receives observations, not raw mutable page internals.

## Human Control

Sessions support pause, resume, cancel, goal modification, approval, rejection, and takeover.
High-risk actions require approval before tool execution.

## Observability

Every session records timeline events, decisions, tool calls, observations, failures, and recovery
attempts. This enables replay, debugging, simulation, and benchmark evaluation.
