# Multi-Agent Collaboration Runtime

The Multi-Agent Runtime is the organization layer above tools, knowledge, memory, and workflows. It
turns a user goal into a supervised task graph and delegates work to specialized agents with scoped
permissions.

## Runtime Model

User Goal -> Supervisor Runtime -> Task Planner -> Agent Registry -> Specialized Agents -> Tool
Runtime -> Blackboard -> Conflict Resolver -> Final Result.

## Core Systems

- `MultiAgentRegistry` stores dynamic agent definitions and executors.
- `SupervisorRuntime` owns sessions, plans, assignments, approvals, retries, recovery, and final
  synthesis.
- `SharedBlackboard` stores versioned artifacts, decisions, observations, and task outputs.
- `AgentCommunicationLog` stores typed requests, responses, events, and status updates.
- `MultiAgentPermissionManager` enforces per-agent capabilities, tools, memory, knowledge, and
  action permissions while recording audit logs.
- `DeterministicMultiAgentPlanner` creates graph tasks from user goals and available capabilities.
- `AgentConflictResolver` selects between competing outputs using confidence, quality, risk, and
  cost.

## Communication Rules

Agents do not mutate each other's state. They communicate by messages and shared blackboard
artifacts. Memory, knowledge, tools, and browser control must be accessed through runtime services
and permission checks.

## Failure Handling

Each task supports retry count, timeout, replacement agents, and human escalation. One failed agent
does not break the whole session unless the task is unrecoverable or required approval is rejected.

## Security

Agents declare capabilities and permissions up front. The supervisor checks permissions before task
execution, tool access, blackboard writes, and approval-gated operations. Audit events are retained
for replay and debugging.
