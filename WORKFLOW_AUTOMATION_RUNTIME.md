# Workflow Automation Runtime

The workflow runtime is the automation core of the browser AI platform. It is headless and sits
above command, AI, plugin, browser, API, and context capabilities.

## Workflow Schema

- `id`: stable workflow id.
- `name`: human-readable name.
- `version`: semantic workflow version.
- `trigger`: manual, browser, extension, external, schedule, webhook, or keyboard trigger.
- `steps`: deterministic workflow steps.
- `conditions`: reusable named conditions.
- `variables`: typed workflow variables and defaults.
- `permissions`: capabilities the workflow may use.
- `timeoutMs`: maximum execution duration.
- `retryPolicy`: default retry policy for transient step failures.
- `errorStrategy`: fail, retry, skip, compensate, or wait for human intervention.
- `history`: whether detailed execution history should be retained.
- `owner`: user/team/plugin ownership metadata.
- `visibility`: private, team, enterprise, or public.
- `metadata`: searchable and UI-readable metadata.

## Runtime Position

Trigger -> Workflow Resolver -> Planner -> Scheduler -> Executor -> Step Registry -> Capability
Gateways -> Result.

The engine does not import UI code, Chrome APIs, provider clients, plugin internals, or command
implementations. Those are accessed through injected gateways and registered step handlers.

## Supported Step Types

- command
- AI
- condition
- transform
- API
- browser action
- plugin
- human approval
- delay
- parallel
- loop
- sub-workflow

## Recovery Model

Executions are persisted after lifecycle transitions and after each step. Checkpoints contain
serializable context, variables, outputs, timeline, and current step. A new runtime instance can
recover persisted executions and continue from the last checkpoint.

## Debugging Contracts

Every execution records a timeline with workflow started, step started, step completed, approvals,
retries, failures, cancellation, and completion. UI can render this timeline without driving
execution.
