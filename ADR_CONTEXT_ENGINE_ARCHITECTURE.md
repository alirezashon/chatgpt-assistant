# ADR: Context Intelligence Engine Architecture

## Status

Accepted

## Context

The browser extension needs a Context Intelligence Engine that can understand what the user is doing
across arbitrary websites and recommend the right commands before the user writes a prompt.

The system must support:

- selected text.
- editable fields.
- code blocks.
- email.
- GitHub pull requests.
- Jira tickets.
- Google Docs.
- YouTube.
- PDFs.
- articles.
- spreadsheets.
- future OCR, voice, automation, workflows, and plugins.

The architecture must work within browser extension constraints:

- Manifest V3 background service workers can be suspended.
- Content scripts run inside untrusted pages.
- DOM access is expensive and brittle.
- Permissions are limited and often optional.
- Host pages vary wildly.
- Context extraction must be fast and privacy-aware.
- Future detectors must be pluggable without rewriting the engine.

The engine must be:

- fast by default.
- extensible.
- testable.
- privacy-preserving.
- confidence-driven.
- able to handle multiple simultaneous contexts.
- resilient when individual detectors fail.

## Architectures Considered

### 1. Rule Engine

A centralized engine evaluates declarative rules against page signals.

Example:

```txt
if hostname = github.com and path contains /pull/ and diff DOM exists
then context = pull_request
```

Strengths:

- Simple to reason about.
- Easy to test individual rules.
- Fast for cheap signal matching.
- Good for confidence scoring.
- Works well for deterministic contexts.

Weaknesses:

- Can become a large rule pile.
- Hard to model complex multi-stage extraction.
- Poor isolation for website-specific DOM logic.
- Rule conflicts become difficult at scale.
- Plugins need careful sandboxing around rule execution.

Memory:

- Low. Rules are mostly static metadata.

Performance:

- Strong for cheap matching.
- Weak if rules encourage repeated DOM scans.

Extensibility:

- Moderate. Easy to add rules, harder to add rich adapters.

Complexity:

- Starts low, grows sharply with platform-specific behavior.

Testing:

- Good for unit tests.
- Harder for end-to-end website behavior.

Browser limitations:

- Compatible with MV3.
- Must avoid long-running background assumptions.

Verdict:

- Useful as one layer, not sufficient as the full architecture.

### 2. Plugin Pipeline

Context detection is a staged pipeline. Each detector/adapter is a plugin that receives normalized
signals and can return context candidates with confidence scores.

Example:

```txt
URL signals -> metadata signals -> focus signals -> selection signals -> DOM signals
-> adapter detectors -> context ranking -> recommended actions
```

Strengths:

- Highly extensible.
- Fits website adapters naturally.
- Supports cheap-first and deep-later detection.
- Easy to lazy-load detectors.
- Easy to isolate failures.
- Supports future third-party plugins.
- Works well with confidence scoring.

Weaknesses:

- Requires strong contracts.
- Ordering must be carefully designed.
- Debugging needs trace tooling.
- Poorly written detectors can hurt performance unless constrained.

Memory:

- Moderate, controllable through lazy loading and detector caches.

Performance:

- Strong if staged correctly.
- Cheap detectors run first, expensive detectors run only when needed.

Extensibility:

- Excellent. New detectors and adapters can register without changing core orchestration.

Complexity:

- Moderate. More structure up front, less chaos later.

Testing:

- Excellent. Each detector can be tested independently with fixture inputs.
- Pipeline ranking can be tested separately.

Browser limitations:

- Fits MV3 well because stages can run in content scripts or background depending on capability.
- Supports content-script-only extraction and background orchestration.

Verdict:

- Strong fit.

### 3. Entity Component System, ECS

Every detected page object becomes an entity with components such as `Selectable`, `Editable`,
`CodeBlock`, `EmailThread`, `Video`, `Confidence`, and `Actions`.

Strengths:

- Good for modeling many objects on a page.
- Strong composition model.
- Useful if the extension becomes a full page-understanding runtime.
- Could support automation and screen understanding later.

Weaknesses:

- Too abstract for current needs.
- Higher implementation complexity.
- Requires object identity and lifecycle management across dynamic DOM changes.
- Can become memory-heavy.
- Harder for feature teams to understand.

Memory:

- Potentially high if many DOM objects become entities.

Performance:

- Risky on large pages unless aggressively scoped.

Extensibility:

- High in theory.
- Expensive in practice for browser pages.

Complexity:

- High.

Testing:

- Good for pure systems.
- Hard for DOM lifecycle and website fixtures.

Browser limitations:

- Dynamic pages and MV3 lifecycle make persistent world modeling difficult.

Verdict:

- Rejected for the initial architecture. It may become useful later for automation or visual screen
  understanding, but it is too heavy as the base Context Engine.

### 4. Blackboard Architecture

Detectors write observations to a shared blackboard. Other modules read the accumulated facts and
infer contexts.

Example:

```txt
URL detector writes github.
DOM detector writes diff_found.
Selection detector writes selected_code.
PR detector reads facts and writes pull_request candidate.
Ranker reads candidates and selects active context.
```

Strengths:

- Good for uncertain, multi-signal inference.
- Supports incremental detection.
- Allows independent detectors to contribute partial knowledge.
- Useful for debugging if the blackboard is inspectable.

Weaknesses:

- Shared mutable state can become messy.
:- Requires strong ownership and expiration rules.
- Can be harder to reason about than a pipeline.
- Risk of stale facts after SPA navigation.

Memory:

- Moderate. Depends on fact retention.

Performance:

- Good if facts are incremental and scoped.
- Poor if many detectors constantly react to fact changes.

Extensibility:

- High, but only with strict schemas and fact ownership.

Complexity:

- Moderate to high.

Testing:

- Good for inference tests.
- Harder to test temporal behavior and stale fact cleanup.

Browser limitations:

- Needs careful invalidation on SPA route changes and DOM mutations.

Verdict:

- Valuable as an internal trace/fact model, but rejected as the primary architecture because the
  shared-state model is easier to misuse over time.

### 5. Event Sourcing

Every observed browser/page event is stored as an event log. Current context is derived by replaying
events.

Example:

```txt
page.loaded -> url.changed -> dom.ready -> selection.changed -> focus.changed
=> derive current active context
```

Strengths:

- Excellent auditability.
- Strong debugging and replay story.
- Useful for reproducing context bugs.
- Natural fit for event-driven systems.

Weaknesses:

- Overkill for real-time context detection.
- Persistent event logs create privacy risk.
- Replay adds complexity.
- Browser storage quotas and sensitive content make this dangerous.

Memory:

- Potentially high.

Performance:

- Good for append-only event capture, but derivation can become expensive.

Extensibility:

- Good, but at the cost of complex event schemas and migrations.

Complexity:

- High.

Testing:

- Excellent for replay tests.
- Heavy for everyday detector tests.

Browser limitations:

- MV3 service worker suspension and storage limits make durable logs awkward.
- Privacy constraints strongly limit event retention.

Verdict:

- Rejected as the primary architecture. Use lightweight ephemeral event tracing for diagnostics, not
  full event sourcing.

### 6. Chain Of Responsibility

Detectors are ordered handlers. Each handler either recognizes the context or passes to the next.

Example:

```txt
GitHubDetector -> GmailDetector -> YouTubeDetector -> ArticleDetector -> GenericTextDetector
```

Strengths:

- Simple.
- Easy to implement.
- Fast when early handlers match.
- Good for fallback behavior.

Weaknesses:

- Poor for multi-context pages.
- Encourages first-match wins when multiple contexts are valid.
- Hard to combine signals.
- Hard to express confidence and parent/child contexts.
- Ordering becomes fragile.

Memory:

- Low.

Performance:

- Good in simple cases.
- Bad if many handlers run expensive checks.

Extensibility:

- Moderate, but plugin ordering becomes contentious.

Complexity:

- Low initially, high later due to ordering conflicts.

Testing:

- Easy per handler.
- Hard for conflict cases.

Browser limitations:

- Compatible, but not expressive enough.

Verdict:

- Rejected as the primary architecture. Useful only inside a narrow adapter fallback chain.

## Decision

Use a **Hybrid Plugin Pipeline Architecture with a Typed Context Blackboard for Ephemeral Facts**.

The primary architecture is a staged plugin pipeline. Each detector or website adapter is a
pluggable module that runs in a defined stage, receives normalized input, and emits context
candidates with confidence scores.

An internal ephemeral blackboard may be used inside a single detection cycle to store normalized
facts, traces, and intermediate observations. The blackboard is not the external programming model
and is not a durable event store.

The architecture is:

```txt
Signal Collection
  -> Ephemeral Fact Blackboard
  -> Staged Detector Pipeline
  -> Adapter Deep Detection
  -> Context Candidate Ranking
  -> Active Context Selection
  -> Recommended Actions
  -> Context Snapshot
```

## Why This Wins

The Plugin Pipeline wins because it best matches the extension’s real constraints:

- It supports cheap-first detection.
- It allows lazy-loaded website adapters.
- It handles arbitrary websites.
- It can rank multiple simultaneous contexts.
- It is testable with fixture inputs.
- It supports future plugins.
- It keeps detectors isolated.
- It avoids a central god-rule file.
- It avoids ECS-level complexity.
- It avoids privacy risks from event sourcing.
- It avoids chain-of-responsibility’s first-match limitation.

The ephemeral blackboard is included only as an implementation aid for a single detection pass. It
helps detectors share normalized observations without turning the whole system into mutable global
state.

## Trade-Offs

### Benefits

- Strong extensibility.
- Good browser performance when staged correctly.
- Works with MV3 lifecycle.
- Easy to add new platform adapters.
- Allows confidence scoring and multi-context ranking.
- Supports future plugin architecture.
- Enables good diagnostics through detection traces.

### Costs

- Requires well-defined detector contracts.
- Requires strict performance budgets per stage.
- Requires robust invalidation rules.
- Requires tooling to debug pipeline ordering and scoring.
- More upfront architecture than a simple rule engine.

### Risks

- Detectors may become too expensive unless budgets are enforced.
- Adapter authors may leak platform-specific structures into generic context.
- Conflicting context candidates may create confusing recommendations.
- Poor blackboard discipline could recreate shared-state coupling.

Mitigations:

- Detector performance budgets.
- Strict normalized Context API.
- Stage-level timeouts.
- Confidence scoring tests.
- Adapter fixture tests.
- Detection trace tooling.
- Blackboard facts expire after each detection pass.

## Consequences

### For Core Runtime

The Context Engine must define:

- detector stages.
- detector registration.
- normalized signal input.
- context candidate output.
- confidence scoring.
- context stack ranking.
- recommended action mapping.
- privacy and permission filtering.

### For Website Adapters

Adapters must:

- register declaratively.
- expose cheap detection separately from deep extraction.
- return normalized contexts.
- declare permissions and privacy sensitivity.
- fail gracefully.

### For Features

Features must not scrape pages directly.

Features consume:

- active context.
- context stack.
- recommended actions.
- permissions.
- metadata exposed by normalized Context API.

### For Performance

Detection must be staged:

1. URL and metadata.
2. focus and selection.
3. cheap DOM structure.
4. scoped heuristics.
5. lazy adapter deep extraction.
6. deep context only on user intent.

### For Privacy

The pipeline must carry privacy metadata from the beginning:

- sensitivity.
- redaction requirement.
- external processing allowance.
- storage allowance.
- user confirmation requirement.

No detector should bypass privacy policy.

## Future Migration Plan

### Phase 1: Pipeline Foundation

Build the core detector pipeline with:

- detector interfaces.
- stages.
- context candidates.
- confidence scoring.
- context stack.
- recommendation mapping.
- detection trace output.

### Phase 2: First-Party Adapters

Add high-value adapters:

- generic article.
- generic editable field.
- generic code block.
- GitHub.
- Gmail.
- YouTube.
- PDF.

### Phase 3: Deeper Context And Workflows

Add:

- structured extraction.
- command availability integration.
- workflow context requirements.
- multi-tab context.
- stronger privacy controls.

### Phase 4: Plugin-Ready Detector SDK

Expose a constrained SDK for plugin detectors:

- stage registration.
- context candidate output.
- permission declarations.
- scoped storage.
- no direct Chrome API access.

### Phase 5: Optional ECS Subsystem For Automation

If browser automation and screen understanding require persistent page object modeling, introduce a
limited ECS-like subsystem behind the Context API.

This should not replace the pipeline. It should only model visible actionable entities for
automation.

### Phase 6: Optional Event Replay Diagnostics

Add privacy-safe ephemeral event traces for debugging context bugs.

Do not persist raw page-content event logs by default.

## Final Decision Summary

Chosen architecture:

**Hybrid Plugin Pipeline with Ephemeral Typed Blackboard**

Rejected as primary architecture:

- Pure Rule Engine.
- ECS.
- Blackboard as primary model.
- Event Sourcing.
- Chain of Responsibility.

Reason:

The chosen architecture gives the best balance of performance, extensibility, privacy, testability,
and browser-extension realism.
