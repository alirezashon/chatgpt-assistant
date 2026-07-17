# ADR: AI Model Runtime And Provider Abstraction Layer

## Status

Accepted

## Context

Agents, workflows, plugins, memory, knowledge, enterprise applications, and browser features need
intelligence without coupling to provider names. Consumers should request capabilities such as
reasoning, coding, extraction, vision, local-private inference, or tool calling rather than hardcode
model vendors.

The repository already has a headless AI gateway. RFC-021 extends it into an AI operating runtime.

## Architectures Considered

### 1. Direct Provider Calls

Lowest latency and simplest code, but creates vendor lock-in, bypasses security, fragments cost
tracking, and prevents enterprise governance. Rejected.

### 2. Simple AI Gateway

Good single entrypoint, but insufficient for capability routing, context management, fallback,
quality scoring, governance, tool execution, multimodal requests, and local models. Accepted only as
the lower-level execution substrate.

### 3. Model Router Architecture

Strong abstraction for cost, latency, quality, privacy, and availability. Accepted.

### 4. LLM Operating System Model

Best long-term architecture: classify task, prepare context, select capability/model, execute,
validate, trace, cache, fallback, and enforce policy. Accepted.

### 5. Inference Gateway

Useful infrastructure pattern for provider scaling and observability, but too infrastructure-centric
for product/runtime concerns. Accepted as a future deployment adapter.

### 6. Multi Model Orchestration

Useful for validation, fallback, and ensemble workflows, but costly. Accepted for future advanced
strategies over the same model registry and router.

### 7. Agentic Model Selection

Can improve quality for ambiguous tasks, but adds latency and unpredictability. Deferred behind the
classifier/router interfaces.

### 8. Hybrid Cloud + Local Runtime

Required for enterprise privacy, offline, edge execution, and local models. Accepted.

## Decision

Use a layered AI operating runtime:

- providers register adapters and model metadata.
- task classifier maps intent and inputs to stable task families.
- capability registry maps task families to required model capabilities.
- context manager owns token budgets, compression, memory injection, knowledge injection, and tool
  result injection.
- model router selects from registered models using quality, latency, cost, privacy, provider health,
  and enterprise governance.
- fallback manager retries alternate models on outage, rate limits, timeouts, quality failure, and
  cost limits.
- prompt registry remains versioned and adds room for experiments/rollback.
- tool runtime validates model tool calls, checks security, executes tools, and injects results.
- trace and cost systems record model, provider, tokens, latency, failures, cost, and quality.
- local provider metadata is first-class and routable in maximum-privacy mode.

## Trade-Offs

- More moving parts than a wrapper, but each part can be tested and replaced.
- Deterministic classification is conservative until an AI classifier is plugged in.
- Local models may be lower quality, but privacy policies can prefer or require them.

## Consequences

- Applications should call the AI runtime, not providers.
- Enterprise policies can restrict providers/models before execution.
- Cost, traces, prompt versions, context budgets, and fallback behavior are consistent across agents,
  workflows, plugins, memory, and knowledge.

## Future Migration Plan

- Add real provider adapters for OpenAI, Anthropic, Google, local runtimes, and enterprise gateways.
- Add semantic/vector cache implementation behind the same cache interface.
- Add model evaluation harnesses and automatic quality regression gates.
- Add multimodal media storage and streaming transport.
- Add distributed inference gateway deployment for enterprise/private cloud.
