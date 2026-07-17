# ADR: AI Provider Gateway And Intelligence Runtime

## Status

Accepted

## Context

No feature may communicate directly with AI providers. The extension must support OpenAI, Claude,
Gemini, DeepSeek, Mistral, local models, Ollama, and future providers without changing feature code.

Commands and features should not know:

- provider identity.
- model selection.
- authentication.
- streaming mechanics.
- retry policy.
- token accounting.
- pricing.
- privacy routing.
- fallback behavior.

The browser extension runtime also imposes constraints:

- API keys must not live in UI code.
- Content scripts must not call providers.
- MV3 service workers can be restarted.
- Offline and local-only modes must exist.
- Enterprise policies may forbid some providers.
- Streaming must be shared across palette, floating surface, sidebar, and future workflows.

## Architectures Considered

### 1. Direct Provider Integration

Features import provider clients directly.

Latency:

- Good for one provider.

Complexity:

- Low initially.

Security:

- Poor. Keys and provider details leak across code.

Cost Control:

- Poor. No central accounting.

Provider Switching:

- Poor. Every feature changes.

Testing:

- Poor. Provider mocking is duplicated.

Offline Support:

- Poor.

Enterprise Usage:

- Poor.

Future Agent Support:

- Poor.

Verdict:

- Rejected. Violates the core requirement.

### 2. Adapter Pattern

Each provider implements a common adapter interface.

Latency:

- Good.

Complexity:

- Moderate.

Security:

- Better, but insufficient without gateway enforcement.

Cost Control:

- Moderate.

Provider Switching:

- Good.

Testing:

- Good.

Offline Support:

- Good if local providers implement same adapter.

Enterprise Usage:

- Moderate.

Future Agent Support:

- Moderate.

Verdict:

- Required, but not enough alone.

### 3. AI Gateway Service

All features call one gateway that owns request pipeline, routing, providers, streaming, costs,
privacy, and fallback.

Latency:

- Slight overhead, but bounded and central.

Complexity:

- Moderate to high.

Security:

- Strong.

Cost Control:

- Strong.

Provider Switching:

- Strong.

Testing:

- Strong.

Offline Support:

- Strong.

Enterprise Usage:

- Strong.

Future Agent Support:

- Good.

Verdict:

- Accepted as the core boundary.

### 4. Model Router

A router picks models based on task, cost, latency, context length, privacy, and availability.

Latency:

- Good if model registry is indexed.

Complexity:

- Moderate.

Security:

- Good when combined with policy.

Cost Control:

- Strong.

Provider Switching:

- Strong.

Testing:

- Strong with routing fixtures.

Offline Support:

- Strong.

Enterprise Usage:

- Strong.

Future Agent Support:

- Strong.

Verdict:

- Required inside the gateway.

### 5. Capability-Based AI Runtime

Requests declare required capabilities rather than provider/model names.

Latency:

- Good.

Complexity:

- Higher upfront.

Security:

- Strong.

Cost Control:

- Strong.

Provider Switching:

- Excellent.

Testing:

- Excellent.

Offline Support:

- Excellent.

Enterprise Usage:

- Excellent.

Future Agent Support:

- Excellent.

Verdict:

- Accepted.

### 6. Agent Runtime Architecture

AI runtime is modeled primarily around autonomous agents.

Latency:

- Poor for simple commands.

Complexity:

- High.

Security:

- Risky unless heavily sandboxed.

Cost Control:

- Harder.

Provider Switching:

- Good in theory.

Testing:

- Hard.

Offline Support:

- Moderate.

Enterprise Usage:

- Risky.

Future Agent Support:

- Strong.

Verdict:

- Rejected as the base. Agents should consume the AI Gateway later.

### 7. Event-Driven AI Pipeline

Every stage emits and consumes events.

Latency:

- Moderate.

Complexity:

- High.

Security:

- Good with strict payload controls.

Cost Control:

- Good.

Provider Switching:

- Good.

Testing:

- Moderate.

Offline Support:

- Good.

Enterprise Usage:

- Good.

Future Agent Support:

- Good.

Verdict:

- Use events for observability and streaming, not as the primary request model.

### 8. Hybrid Architecture

AI Gateway + provider adapters + model router + capability runtime + shared streaming pipeline.

Latency:

- Good with bounded overhead.

Complexity:

- High but justified.

Security:

- Strong.

Cost Control:

- Strong.

Provider Switching:

- Excellent.

Testing:

- Excellent.

Offline Support:

- Excellent.

Enterprise Usage:

- Excellent.

Future Agent Support:

- Excellent.

Verdict:

- Accepted.

## Decision

Use a **Capability-Based AI Gateway Runtime**:

- Features call `AIRuntime`.
- `AIRuntime` executes a request pipeline.
- Providers implement `AIProviderAdapter`.
- `AIModelRegistry` describes capabilities, context windows, pricing, latency, and availability.
- `AIRequestPipeline` builds prompt/context, routes model, checks permissions, estimates cost, and
  executes.
- `AIResponsePipeline` validates, post-processes, caches, records history, and evaluates.
- Streaming is centralized through `AIStreamingManager`.
- Fallback is centralized through `AIFallbackManager`.

## Trade-Offs

Benefits:

- No feature/provider coupling.
- Central security and privacy enforcement.
- Central token and cost tracking.
- Shared streaming behavior.
- Deterministic routing.
- Offline and local-provider support.
- Enterprise policy support.

Costs:

- More runtime contracts up front.
- Provider authors must implement strict adapters.
- Model routing must be tested carefully.
- Some direct-provider optimizations are abstracted away.

## Consequences

- API keys never appear in UI code.
- Provider logic never leaks into commands/features.
- Prompt templates are registered centrally.
- Context window management is shared.
- Cost and usage accounting is unavoidable.
- Fallback behavior is consistent.

## Future Migration

When concrete cloud providers are added:

1. Implement adapters against `AIProviderAdapter`.
2. Register models in `AIModelRegistry`.
3. Store credentials behind secure background/service storage.
4. Add provider-specific contract tests.
5. Keep feature code unchanged.

If agent runtime is added:

1. Agents submit capability-based AI requests.
2. Agent tool calls use command/workflow runtimes.
3. AI Gateway remains the only model access path.
