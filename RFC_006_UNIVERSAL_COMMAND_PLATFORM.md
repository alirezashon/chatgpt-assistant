# RFC-006: Universal Command Platform

Status: Draft  
Priority: Critical  
Category: Core Platform  
Decision Owner: Command Platform Architecture  

## Executive Summary

The extension is command-centered, not UI-centered. Every feature that exists now or later must be
expressible as a command: AI actions, browser actions, workflow actions, plugin actions, enterprise
actions, automation actions, local/offline actions, voice actions, and agent actions.

This RFC defines a Universal Command Platform intended to survive years of development, thousands of
commands, hundreds of plugins, multiple AI providers, enterprise deployments, offline mode, workflow
composition, undo/redo, voice invocation, and browser automation.

The platform must feel closer to VS Code commands, Raycast, Cursor, IntelliJ Platform, macOS
Services, Git, and shell commands than a simple browser extension command palette.

The selected architecture is a **Capability-Governed Command Platform** composed of:

1. Federated Command Manifests.
2. Metadata Registry.
3. Capability Graph.
4. Permission and Policy Engine.
5. Command Bus.
6. Execution Pipeline.
7. Workflow Graph.
8. Search and Ranking Index.
9. Compatibility Layer.
10. Plugin Runtime Boundary.

No command may require editing command platform core code.

## Principles

- Everything is a command.
- Commands are data plus execution contracts.
- Features register commands; the platform discovers them.
- Execution is routed, validated, permissioned, observable, cancellable, and auditable.
- UI invokes commands but does not own command logic.
- Commands do not know which surface invoked them.
- Commands declare capabilities; services enforce them.
- Plugins can add commands without privileged access.
- Search is platform-owned, not UI-owned.
- Undo/redo and composition must be future-compatible from day one.

## Non-Negotiable Constraints

The platform must not rely on:

- central hardcoded command lists.
- switch statements.
- manual imports for every command.
- direct feature-to-feature calls.
- command execution tied to React.
- command execution tied to Chrome APIs.
- commands knowing popup/sidebar/palette/toolbars.
- plugins bypassing permission checks.

The platform must support:

- 10,000 commands.
- 300+ plugins.
- distributed plugin authorship.
- AI agents.
- workflow composition.
- browser automation.
- offline mode.
- enterprise policy.
- multiple runtimes and invocation surfaces.

## Architecture Candidates

The following approaches were evaluated:

1. Command Bus
2. CQRS
3. Mediator
4. Central Command Registry
5. Plugin Registry
6. Reflection / Self-Registering Modules
7. Metadata Registry
8. Capability Graph
9. Event Bus
10. Dependency Injection
11. Actor Model
12. Pipeline
13. Workflow Graph
14. Reactive Commands
15. Behavior Trees
16. Policy Engine
17. Capability-Based Security
18. Command Graph
19. Service Locator
20. Event Mesh
21. Hybrid Architecture

## Comparison Matrix

Ratings: Strong, Good, Moderate, Weak, Poor.

| Architecture | Performance | Memory | Complexity | Maintainability | Debuggability | Scale | DX | Testability | Browser Fit | Plugin Support | AI/Agent Fit | Automation Fit | Enterprise Fit | Future Proof |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Command Bus | Strong | Strong | Moderate | Good | Good | Good | Good | Strong | Strong | Moderate | Moderate | Moderate | Good | Good |
| CQRS | Good | Moderate | High | Good | Good | Good | Moderate | Good | Moderate | Moderate | Moderate | Moderate | Good | Moderate |
| Mediator | Good | Strong | Moderate | Moderate | Moderate | Moderate | Good | Good | Strong | Weak | Weak | Weak | Moderate | Weak |
| Central Registry | Strong | Good | Low | Weak | Good | Moderate | Good | Strong | Strong | Weak | Moderate | Moderate | Moderate | Weak |
| Plugin Registry | Good | Moderate | Moderate | Strong | Good | Strong | Good | Good | Good | Strong | Strong | Strong | Good | Strong |
| Reflection | Moderate | Moderate | Moderate | Weak | Weak | Moderate | Good | Weak | Weak | Moderate | Weak | Weak | Weak | Weak |
| Metadata Registry | Strong | Good | Moderate | Strong | Strong | Strong | Good | Strong | Strong | Strong | Good | Good | Strong | Strong |
| Capability Graph | Good | Moderate | High | Strong | Good | Strong | Moderate | Good | Good | Strong | Strong | Strong | Strong | Strong |
| Event Bus | Strong | Good | Moderate | Moderate | Moderate | Good | Good | Good | Strong | Moderate | Moderate | Moderate | Good | Moderate |
| Dependency Injection | Good | Good | Moderate | Strong | Good | Good | Good | Strong | Strong | Good | Good | Good | Strong | Strong |
| Actor Model | Moderate | Moderate | High | Good | Moderate | Good | Weak | Moderate | Weak | Good | Good | Moderate | Moderate | Moderate |
| Pipeline | Strong | Good | Moderate | Strong | Strong | Strong | Good | Strong | Strong | Good | Good | Good | Strong | Strong |
| Workflow Graph | Moderate | Moderate | High | Good | Good | Strong | Moderate | Good | Moderate | Good | Strong | Strong | Good | Strong |
| Reactive Commands | Good | Moderate | High | Moderate | Moderate | Good | Moderate | Good | Moderate | Moderate | Moderate | Moderate | Good | Moderate |
| Behavior Trees | Good | Good | High | Moderate | Good | Moderate | Weak | Good | Moderate | Weak | Strong | Strong | Moderate | Moderate |
| Policy Engine | Strong | Strong | Moderate | Strong | Strong | Good | Good | Strong | Strong | Good | Good | Strong | Strong | Strong |
| Capability-Based Security | Strong | Good | High | Strong | Good | Strong | Moderate | Good | Strong | Strong | Strong | Strong | Strong | Strong |
| Command Graph | Good | Moderate | High | Strong | Good | Strong | Moderate | Good | Good | Strong | Strong | Strong | Strong | Strong |
| Service Locator | Good | Strong | Low | Weak | Weak | Moderate | Good | Weak | Good | Moderate | Moderate | Moderate | Weak | Weak |
| Event Mesh | Moderate | High | Very High | Moderate | Weak | Strong | Weak | Weak | Weak | Moderate | Moderate | Moderate | Moderate | Weak |
| Hybrid | Good | Moderate | High | Strong | Strong | Strong | Good | Strong | Good | Strong | Strong | Strong | Strong | Strong |

## Architecture Evaluations

### 1. Command Bus

Description:

Routes command execution requests to handlers through a stable bus.

Strengths:

- Excellent execution abstraction.
- Strong decoupling between invoker and executor.
- Supports cancellation, progress, telemetry, and errors.
- Easy to test.

Weaknesses:

- Does not solve discovery.
- Does not solve search.
- Does not solve permissions by itself.
- Does not model workflows alone.

Verdict:

- Required, but not sufficient as the whole platform.

### 2. CQRS

Description:

Separates command writes/execution from query/read models such as search indexes and metadata
views.

Strengths:

- Useful separation between command execution and command discovery/search.
- Enables optimized read models.
- Fits large command catalogs.

Weaknesses:

- Adds conceptual overhead.
- Browser extension state is local and intermittent; full CQRS can be heavy.

Verdict:

- Use selectively. The platform should maintain read-optimized indexes, but not become a heavy CQRS
  system.

### 3. Mediator

Description:

Central mediator coordinates requests between modules.

Strengths:

- Simple decoupling for small systems.
- Easy to understand.

Weaknesses:

- Mediator can become a god object.
- Poor plugin extensibility.
- New command families risk adding core mediator logic.

Verdict:

- Rejected as primary architecture.

### 4. Central Command Registry

Description:

One central command registry stores all commands.

Strengths:

- Simple lookup.
- Good introspection.
- Good command id stability.

Weaknesses:

- If manually maintained, it becomes a bottleneck.
- Encourages central imports and hardcoded lists.

Verdict:

- Use a registry, but not a central manually edited registry. It must be federated and manifest-fed.

### 5. Plugin Registry

Description:

Plugins register commands, capabilities, metadata, and handlers.

Strengths:

- Enables independent command authorship.
- Supports third-party and enterprise deployments.
- Natural place for plugin lifecycle and permissions.

Weaknesses:

- Requires strict validation.
- Requires sandbox and namespace policy.

Verdict:

- Required.

### 6. Reflection / Self-Registering Modules

Description:

Modules discover themselves through runtime reflection or side-effect imports.

Strengths:

- Low ceremony.
- Convenient during early development.

Weaknesses:

- Browser bundling and MV3 make implicit reflection brittle.
- Side effects harm testability.
- Tree-shaking and dynamic imports become unpredictable.
- Security review is weak.

Verdict:

- Rejected. Discovery must be manifest/metadata based and explicit.

### 7. Metadata Registry

Description:

A registry stores command metadata separately from execution implementation.

Strengths:

- Excellent for search, discovery, localization, docs, versioning, deprecation.
- Allows command index to load before execution handlers.
- Supports 10,000 commands more efficiently than eager handler loading.

Weaknesses:

- Metadata schemas must be governed.
- Versioning discipline required.

Verdict:

- Required.

### 8. Capability Graph

Description:

Commands declare required and produced capabilities; services, providers, permissions, and plugins
also expose capabilities.

Strengths:

- Enables permission-aware and provider-aware execution.
- Supports dependency resolution.
- Supports AI provider abstraction.
- Supports workflows and automation composition.

Weaknesses:

- Adds modeling complexity.
- Requires careful capability taxonomy.

Verdict:

- Required for long-term scale.

### 9. Event Bus

Description:

Publishes command lifecycle events and system changes.

Strengths:

- Excellent for observability, telemetry, history, and reactive updates.
- Decouples command execution from subscribers.

Weaknesses:

- Not suitable for request/response execution.
- Event sprawl possible.

Verdict:

- Required as lifecycle/event infrastructure, not execution routing.

### 10. Dependency Injection

Description:

Command handlers receive service interfaces rather than importing concrete systems.

Strengths:

- Excellent testability.
- Prevents Chrome, storage, AI, and clipboard leaks.
- Supports plugin sandboxing.

Weaknesses:

- Requires container discipline.
- Bad DI can become service locator.

Verdict:

- Required.

### 11. Actor Model

Description:

Commands/plugins/features communicate as actors with message inboxes.

Strengths:

- Good isolation.
- Good for async distributed systems.

Weaknesses:

- Heavy for local deterministic command execution.
- MV3 background suspension complicates actor lifetimes.
- Debugging message choreography is expensive.

Verdict:

- Rejected as primary. Use isolated plugin workers only where necessary.

### 12. Pipeline

Description:

Command execution passes through ordered stages: validation, permissions, dependencies, context,
arguments, execution, cleanup.

Strengths:

- Highly testable.
- Excellent observability.
- Easy to insert cross-cutting concerns.
- Supports policy, metrics, rollback, retry, and cancellation.

Weaknesses:

- Requires stage contracts.
- Poorly designed stages can become slow.

Verdict:

- Required.

### 13. Workflow Graph

Description:

Commands can be composed into graphs with sequential, parallel, conditional, retry, timeout,
fallback, and rollback semantics.

Strengths:

- Supports workflows, macros, agents, automation, and multi-step commands.
- Future-proof for composition.

Weaknesses:

- Too heavy for simple commands.
- Requires transaction and failure semantics.

Verdict:

- Required as a composition layer, not for every command.

### 14. Reactive Commands

Description:

Command availability and ranking update reactively from context, permissions, providers, and
settings.

Strengths:

- Good UX responsiveness.
- Good cache invalidation model.

Weaknesses:

- Can become difficult to trace.
- Broad invalidation can hurt performance.

Verdict:

- Use for availability/index invalidation, not as core architecture.

### 15. Behavior Trees

Description:

Hierarchical decision/action trees used by agents and games.

Strengths:

- Good for agent behavior.
- Good for automation sequences.

Weaknesses:

- Poor fit for command catalog/search.
- Plugin composition is difficult.

Verdict:

- Rejected for core. Consider for bounded agent runtimes.

### 16. Policy Engine

Description:

Central policy evaluation determines allow/deny/disable/suppress for commands.

Strengths:

- Essential for enterprise, permissions, privacy, and risk.
- Easy to test with policy fixtures.
- Strong security boundary.

Weaknesses:

- Does not discover or execute commands.

Verdict:

- Required.

### 17. Capability-Based Systems

Description:

Commands only receive explicit capabilities granted by the runtime.

Strengths:

- Strong security.
- Strong plugin isolation.
- Strong testability.
- Prevents privilege escalation.

Weaknesses:

- More verbose than direct service calls.
- Requires capability taxonomy governance.

Verdict:

- Required.

### 18. Command Graph

Description:

Commands, dependencies, capabilities, aliases, replacements, workflows, and migrations are modeled
as a graph.

Strengths:

- Great for discovery, compatibility, workflows, deprecation, dependencies.
- Future-proof.

Weaknesses:

- Can be overbuilt if graph solving is runtime-heavy.

Verdict:

- Use as metadata/dependency model, not as expensive runtime graph solver for every invocation.

### 19. Service Locator

Description:

Commands ask a global locator for services.

Strengths:

- Simple.
- Convenient.

Weaknesses:

- Hides dependencies.
- Weak testability.
- Encourages privilege leaks.
- Hard to audit plugin capabilities.

Verdict:

- Rejected.

### 20. Event Mesh

Description:

All systems communicate through a mesh of events.

Strengths:

- Highly decoupled in theory.

Weaknesses:

- Request/response execution becomes unclear.
- Debugging is hard.
- Ordering and causality are fragile.

Verdict:

- Rejected. Use events for lifecycle facts only.

### 21. Hybrid Architecture

Description:

Combines federated metadata, command bus, execution pipeline, policy engine, capability graph,
dependency injection, workflow graph, and plugin registry.

Strengths:

- Satisfies all long-term requirements.
- Keeps responsibilities separate.
- Allows simple commands to stay simple and complex workflows to be powerful.

Weaknesses:

- Highest upfront design cost.
- Requires strict contracts and tooling.

Verdict:

- Accepted.

## Rejected Ideas

### Hardcoded Global Command List

Rejected because it cannot scale to plugins or 10,000 commands and requires core edits.

### UI-Owned Commands

Rejected because popup, sidebar, palette, voice, automation, and agents would diverge.

### Side-Effect Registration

Rejected because implicit imports harm testability, bundling, security, and plugin review.

### Direct Feature Calls

Rejected because commands must be composable and isolated. Features cannot call other feature
internals.

### AI-First Command Routing

Rejected because command selection and execution must be deterministic, offline-capable,
auditable, and enterprise-governed.

## Architecture Decision Record

### Problem

Design a command platform that can support thousands of independently developed commands, plugins,
AI agents, workflows, enterprise policies, offline operation, browser automation, undo/redo,
localization, search, and multiple invocation surfaces without central coupling or future redesign.

### Context

The product is an AI operating layer for the browser. Every feature should be invokable as a
command. The command platform is foundational infrastructure, not a command palette implementation.

### Goals

- Commands are independently registered.
- Discovery requires no core edits.
- Execution is permissioned and observable.
- Search is fast and context-aware.
- Workflows compose commands.
- Plugins are sandboxed.
- Enterprise policy is first-class.
- Undo can be added without redesign.
- Voice and agents can invoke the same platform.

### Constraints

- Manifest V3 background service workers can be suspended.
- Browser permissions are limited and optional.
- Plugins may be untrusted.
- Commands cannot depend on UI or Chrome APIs.
- Offline mode must work.
- Performance must remain fast at 10,000 commands.

### Alternatives

Alternatives considered are documented above. Single-pattern architectures were rejected because no
one pattern satisfies discovery, execution, policy, search, composition, plugins, security,
offline mode, and enterprise constraints simultaneously.

### Decision

Use a Capability-Governed Command Platform with:

- federated command manifests.
- metadata registry.
- command bus.
- execution pipeline.
- policy engine.
- capability graph.
- dependency injection.
- plugin registry.
- workflow graph.
- search/ranking index.
- compatibility layer.

### Trade-Offs

Benefits:

- Strong modularity.
- Strong plugin support.
- Strong enterprise support.
- Strong search/discovery.
- Strong execution observability.
- Strong long-term composition.

Costs:

- More schema design upfront.
- More contract tests required.
- More runtime validation.
- More platform tooling needed.

### Migration Strategy

Phase 1:

- Define command manifest schema.
- Build metadata registry.
- Build command bus and execution pipeline.
- Register first-party commands through manifests.

Phase 2:

- Add capability graph and policy engine.
- Add command search index.
- Add command history and ranking signals.

Phase 3:

- Add workflow graph and macro composition.
- Add undo registration contracts.
- Add streaming and cancellation contracts.

Phase 4:

- Add plugin registry and plugin command sandbox.
- Add enterprise policy bundles.

Phase 5:

- Add voice invocation, local AI, agents, automation, and distributed plugin catalogs.

### Backward Compatibility

Commands must support:

- stable ids.
- aliases.
- deprecated ids.
- versioned input/output schemas.
- migration metadata.
- replacement command references.

Old invocations should resolve through the compatibility layer until removal windows expire.

### Future Evolution

Future capabilities can be added by expanding schemas and capability definitions, not rewriting
platform architecture:

- AI agents become command invokers and workflow authors.
- Voice becomes another invocation source.
- Automation becomes command and workflow capabilities.
- Local/cloud AI providers become capability providers.
- Enterprise deployment becomes policy overlays.

## Universal Command Object

The Universal Command object is a stable, serializable command contract.

### Identity

`id`

- Globally unique command id.
- Namespaced.
- Stable across versions.

`namespace`

- Owning namespace: core, feature, plugin, enterprise.

`name`

- Developer-facing stable name.

`version`

- Command contract version.

`owner`

- Feature id, plugin id, or enterprise package id.

### Human Metadata

`title`

- Primary localized user-facing label.

`description`

- Short explanation.

`documentation`

- Link or doc key for detailed help.

`localization`

- Translation keys for title, description, aliases, docs.

`iconHint`

- Semantic icon name, not a UI component.

### Discovery Metadata

`aliases`

- Alternate names, abbreviations, old names.

`categories`

- High-level groupings.

`tags`

- Machine-readable descriptors.

`keywords`

- Search terms.

`examples`

- Example natural-language queries.

`searchWeight`

- Baseline search weighting.

### Capability Metadata

`requiresCapabilities`

- Required platform capabilities.

`optionalCapabilities`

- Capabilities that improve command behavior.

`producesCapabilities`

- Capabilities/artifacts produced by execution.

`consumesArtifacts`

- Required artifact types.

### Context Metadata

`supportedContexts`

- Context types where command is relevant.

`requiredContext`

- Minimum context required to execute.

`contextConfidenceMin`

- Minimum confidence threshold.

`contextTransform`

- Declaration of accepted context-to-argument transformations.

### Permission Metadata

`permissions`

- Required Chrome, site, workspace, plugin, AI, clipboard, automation, and storage permissions.

`temporaryPermissions`

- Permissions that can be granted for one execution.

`riskLevel`

- safe, low, medium, high, destructive.

`privacyLevel`

- local, selected-content, visible-page, full-page, external-ai, automation.

`enterprisePolicyKeys`

- Policies controlling allow/deny/disable/suppress.

### Execution Metadata

`handlerRef`

- Stable handler reference resolved by runtime.

`executionMode`

- sync, async, streaming, interactive, workflow, batch, agent, automation.

`inputSchema`

- Versioned schema for arguments.

`outputSchema`

- Versioned schema for result.

`timeout`

- Execution timeout.

`cancellable`

- Whether cancellation is supported.

`retryPolicy`

- Retry eligibility and limits.

`idempotency`

- idempotent, non-idempotent, unknown.

### Composition Metadata

`composable`

- Whether command can be used in workflows/macros.

`compositionRole`

- source, transform, sink, control, approval, automation.

`supportsBatch`

- Whether command accepts batch inputs.

`supportsParallel`

- Whether parallel invocation is safe.

`transactional`

- Whether rollback can restore prior state.

### Undo/Redo Metadata

`undoable`

- Whether execution can register undo.

`redoable`

- Whether redo can replay safely.

`repeatable`

- Whether command can repeat last invocation.

`undoScope`

- page, storage, workflow, browser, external system.

`undoStrategy`

- inverse command, snapshot restore, compensating action, unsupported.

### Visibility Metadata

`visibility`

- visible, hidden, disabled, suppressed.

`availability`

- always, contextual, permission-gated, experimental, enterprise-gated.

`featureFlags`

- Flags required.

`stability`

- stable, beta, experimental, deprecated.

### Plugin Metadata

`pluginId`

- Plugin owner.

`pluginVersion`

- Required plugin version.

`trustLevel`

- first-party, verified, enterprise-approved, untrusted.

### Agent And Voice Metadata

`voiceAliases`

- Voice-friendly phrases.

`agentCallable`

- Whether agents may invoke.

`requiresHumanApproval`

- Whether agent/workflow invocation must pause for approval.

### Telemetry Metadata

`telemetryKey`

- Privacy-safe event key.

`analyticsAllowed`

- Whether aggregate analytics are allowed.

`sensitiveTelemetry`

- Whether command requires extra redaction.

### Lifecycle Metadata

`createdAt`

- Registration creation timestamp or package version marker.

`deprecatedAt`

- Deprecation timestamp.

`removedAt`

- Planned removal marker.

`replacement`

- Replacement command id.

`migration`

- Migration rules for aliases, inputs, outputs, and history.

## Command Metadata Requirements

Metadata must support:

- localization.
- aliases.
- categories.
- namespaces.
- search.
- discovery.
- shortcuts.
- ranking.
- icons.
- permissions.
- feature flags.
- enterprise policies.
- availability.
- dependencies.
- tags.
- documentation.
- telemetry.
- analytics.
- versioning.
- deprecation.
- migration.
- backward compatibility.

Metadata must be loadable without loading execution handlers.

## Command Execution Pipeline

Every command execution passes through the same platform pipeline.

### 1. Discovery Resolution

Resolve command id, alias, deprecated id, voice phrase, search result, or workflow reference to a
canonical command.

### 2. Version Resolution

Resolve requested version against installed command version and compatibility metadata.

### 3. Invocation Validation

Validate invocation source, caller trust level, idempotency requirements, and request shape.

### 4. Policy Gate

Evaluate enterprise, privacy, plugin, and risk policies.

Outputs:

- allow.
- deny.
- disable with reason.
- require approval.
- require permission.

### 5. Permission Resolution

Resolve Chrome, site, plugin, workspace, AI, clipboard, storage, and automation permissions.

The platform can request permission through approved services but commands cannot request directly.

### 6. Dependency Resolution

Resolve required capabilities, services, plugins, providers, artifacts, and command dependencies.

### 7. Context Resolution

Obtain the required normalized context from Context Service.

No command reads DOM directly.

### 8. Argument Resolution

Build typed arguments from:

- explicit user input.
- context.
- selected text.
- workflow outputs.
- defaults.
- history.
- approved prompts.

### 9. AI Provider Resolution

If command requires AI, resolve provider by capability:

- text generation.
- embeddings.
- vision.
- speech.
- local/offline.
- streaming.

Commands never call providers directly.

### 10. Preflight

Perform final validation:

- schema.
- quotas.
- rate limits.
- network.
- offline mode.
- cancellation token.
- timeout.

### 11. Execution

Invoke handler through Command Bus with injected capability-limited services.

### 12. Streaming

If streaming, route chunks through platform event stream.

Streaming must be cancellable and redaction-aware.

### 13. Cancellation

Cancellation can be requested by user, workflow, timeout, policy, navigation, or shutdown.

Handlers must observe cancellation where supported.

### 14. Retry

Retry only if:

- command declares retry support.
- failure is retryable.
- idempotency allows.
- policy permits.

### 15. Rollback

On partial failure, execute rollback plan if available.

Rollback must be explicit, not inferred.

### 16. Undo Registration

If command succeeds and is undoable, register undo metadata.

### 17. Telemetry

Emit privacy-safe lifecycle events:

- started.
- succeeded.
- failed.
- cancelled.
- retried.
- rolled back.

### 18. History

Record command history if policy allows.

No raw sensitive content by default.

### 19. Cleanup

Release resources, revoke temporary permissions, close streams, clear transient secrets.

### 20. Metrics

Record timing, memory, retries, provider latency, and failure categories.

### 21. Future Hooks

Reserved hooks:

- beforeExecute.
- afterExecute.
- beforeRollback.
- afterRollback.
- approvalRequired.
- agentDelegated.
- auditRequired.

Hooks are capability-gated.

## Command Composition

Commands are building blocks.

### Composition Modes

Sequential:

- A then B then C.

Parallel:

- A and B run independently.

Pipeline:

- Output of A becomes input of B.

Conditional:

- Branch based on result, context, policy, or user approval.

Loop:

- Repeat over collection with iteration limits.

Retry:

- Retry node with backoff.

Fallback:

- If A fails, run B.

Timeout:

- Abort or fallback after deadline.

Transaction:

- Group commands with rollback semantics.

Nested workflow:

- Workflow invokes workflow.

Macro:

- User-recorded or user-defined command sequence.

Agent execution:

- Agent proposes or invokes approved command graph.

Human approval:

- Pause until explicit approval.

### Composition Rules

- Commands declare composability.
- Inputs and outputs must be typed.
- Risky commands require approval in workflows.
- Parallel commands must declare parallel safety.
- Rollback must be explicit.
- Workflows cannot bypass command permissions.
- Agent workflows cannot use hidden capabilities.

## Discovery Engine

Commands appear automatically through manifests and registries.

### Registration Sources

- core command packages.
- first-party feature packages.
- enterprise policy packages.
- installed plugins.
- workflow packages.
- local user macros.
- voice command packs.

### Auto Discovery

Discovery consumes command manifests from registered packages. Execution handlers may be lazy-loaded.

### Dynamic Loading

Metadata loads eagerly or incrementally. Handlers load only when needed.

### Plugin Discovery

Plugin commands are discovered from signed or approved plugin manifests.

### Version Resolution

The platform resolves:

- compatible command version.
- compatible handler version.
- input/output schema migration.
- deprecated aliases.

### Namespace Resolution

Namespaces are globally unique.

Conflicts:

- first-party wins over plugin.
- enterprise policy can allowlist aliases.
- plugin conflicts require explicit resolution.

### Duplicate Detection

Detect duplicate:

- ids.
- aliases.
- shortcut conflicts.
- localization keys.
- capability declarations.

### Deprecation

Deprecated commands remain discoverable by exact id or alias during compatibility window, but rank
lower and point to replacement.

### Compatibility

Compatibility layer supports:

- aliases.
- schema migrations.
- replacement mapping.
- history migration.
- workflow migration.

## Command Search Engine

Search is platform-owned and presentation-independent.

### Search Inputs

- query text.
- active context.
- invocation type.
- locale.
- history.
- pinned/favorite commands.
- enterprise policy.
- plugin state.
- provider availability.
- offline mode.

### Search Signals

`textMatch`

- title, aliases, description, tags, categories.

`abbreviationMatch`

- Acronyms and initials.

`fuzzyMatch`

- Typo tolerance.

`semanticIntent`

- Natural-language intent mapping.

`contextFit`

- Current context relevance.

`recency`

- Recent use.

`frequency`

- Frequent use.

`pinBoost`

- Pinned/favorite commands.

`permissionFit`

- Executable commands rank above disabled commands.

`offlineFit`

- Offline commands rank higher offline.

`enterpriseFit`

- Enterprise-required or preferred commands can rank higher.

`pluginTrust`

- First-party and trusted plugins can rank above untrusted plugins for ambiguous queries.

### Scoring

Search score is separate from action ranking but compatible with it.

Final score combines:

- textual relevance.
- context relevance.
- availability.
- user behavior.
- trust.
- policy.
- freshness.

Tie-breaking:

1. exact id match.
2. exact alias match.
3. higher availability.
4. higher context fit.
5. pinned.
6. frequency.
7. recency.
8. first-party before plugin.
9. stable before experimental.
10. lexicographic command id.

Search must be deterministic.

## Permission System

Commands are capability and permission aware.

### Permission Types

Chrome permissions:

- activeTab.
- tabs.
- storage.
- scripting.
- contextMenus.
- clipboard.
- sidePanel.

Site permissions:

- host permissions.
- per-site enablement.
- sensitive-site restrictions.

Enterprise policies:

- allow/deny command namespaces.
- provider restrictions.
- telemetry restrictions.
- data residency.
- plugin allowlists.

Plugin permissions:

- command registration.
- context read.
- storage namespace.
- AI request.
- automation.

Workspace permissions:

- org role.
- project role.
- tenant policy.

AI permissions:

- external AI.
- local AI.
- vision.
- speech.
- embeddings.
- tool use.

User roles:

- admin.
- member.
- restricted.
- guest.

Temporary permissions:

- one-time page access.
- one-time clipboard write.
- one execution host permission.

### Privilege Boundaries

- Commands declare required permissions.
- Platform resolves permissions.
- Services enforce permissions.
- Plugins receive only granted capabilities.
- Temporary permissions expire after execution.
- Enterprise policy can override user preference where required.

## Failure Analysis

### Command Crash

- Capture typed error.
- Emit failure event.
- Run rollback if declared.
- Do not crash platform.

### Plugin Crash

- Isolate plugin.
- Disable crashing provider temporarily.
- Continue other commands.
- Record diagnostic.

### Timeout

- Cancel handler.
- Emit timeout.
- Retry only if declared safe.

### Provider Unavailable

- Disable provider-dependent commands.
- Offer provider setup or fallback provider.

### Network Failure

- Prefer offline commands.
- Retry only idempotent network commands.

### Storage Corruption

- Use safe defaults.
- Ignore invalid history/settings.
- Offer repair/export diagnostics command.

### Permission Denied

- Disable command with explanation.
- Do not repeatedly prompt.

### Version Mismatch

- Try compatibility migration.
- Disable command if incompatible.
- Preserve history and workflows through replacement mapping.

### Dependency Missing

- Disable command.
- Surface dependency setup command where appropriate.

### User Cancellation

- Stop execution.
- Cleanup.
- Rollback only if partial mutation occurred and command declares rollback.

### Workflow Interruption

- Persist checkpoint if policy allows.
- Resume, rollback, or abandon based on workflow declaration.

### Background Restart

- Reconstruct registries from manifests.
- Resume only checkpointed workflows.
- Treat in-flight non-checkpointed commands as cancelled.

### Browser Restart

- Same as background restart, with persisted checkpoints only.

### Partial Completion

- Return partial result object.
- Register compensating actions where available.

### Rollback Failure

- Emit critical failure.
- Preserve diagnostic state.
- Show recovery action.
- Never pretend rollback succeeded.

## Performance Budget

Targets are for a normal desktop browser environment.

Discovery latency:

- Target under 50ms for initial metadata index.
- Maximum 150ms for 10,000 commands with lazy loading.

Registration cost:

- Target under 0.05ms per command metadata record.
- Maximum under 500ms for 10,000 commands during cold index build.

Lookup latency:

- Target under 1ms by id.
- Maximum 3ms.

Search latency:

- Target under 25ms.
- Maximum 75ms for 10,000 commands.

Execution overhead:

- Target under 5ms before handler execution.
- Maximum 20ms including policy and dependency resolution.

Memory footprint:

- Core registry target under 8MB for 10,000 commands.
- Maximum 20MB including search indexes.

Plugin load time:

- Metadata target under 25ms per plugin batch.
- Handler load lazy and budgeted per invocation.

Background startup:

- Target under 50ms.
- Maximum 150ms.

Ranking time:

- Target under 10ms for 500 candidates.
- Maximum 30ms for 2,000 candidates.

Streaming latency:

- First stream event overhead target under 50ms after handler emits.
- Maximum 100ms.

## Security Review

### Command Injection

Risk:

- Untrusted input triggers unintended command.

Mitigation:

- Typed command ids.
- Argument schemas.
- No shell-like string execution.
- Human approval for risky inferred commands.

### Plugin Abuse

Risk:

- Plugin registers deceptive or excessive commands.

Mitigation:

- Namespaces.
- Manifest validation.
- Capability limits.
- Rate/budget limits.
- Trust levels.

### Privilege Escalation

Risk:

- Command gains access through another feature.

Mitigation:

- Capability-based execution.
- No feature-to-feature direct calls.
- Services enforce permissions.

### Prompt Injection

Risk:

- Page content instructs AI command to bypass policy.

Mitigation:

- Commands treat page content as data.
- AI Gateway enforces prompt boundaries.
- Policy stage precedes execution.

### Fake Metadata

Risk:

- Plugin misrepresents risk, permissions, or ownership.

Mitigation:

- Manifest schema validation.
- Registry signature/trust policy.
- Runtime capability enforcement.

### Signature Spoofing

Risk:

- Malicious package impersonates trusted plugin.

Mitigation:

- Signed manifests.
- Publisher identity.
- Enterprise allowlists.

### Malicious Registration

Risk:

- Command conflicts with first-party id or alias.

Mitigation:

- Namespace ownership.
- Duplicate detection.
- Conflict resolution policy.

### Capability Escalation

Risk:

- Plugin requests broad capability after install.

Mitigation:

- Capability changes require review and user/enterprise approval.

### Dependency Poisoning

Risk:

- Command depends on malicious replacement.

Mitigation:

- Version pins.
- trusted dependency resolution.
- plugin isolation.

### Telemetry Abuse

Risk:

- Commands leak content through analytics.

Mitigation:

- Telemetry schema allowlist.
- No raw arguments.
- Policy enforcement.
- Redaction.

### Supply-Chain Attacks

Risk:

- Plugin or command package compromised.

Mitigation:

- signing.
- sandboxing.
- least privilege.
- package revocation.
- enterprise pinning.

## Test Strategy

### Contract Tests

- Validate every command manifest.
- Validate capability declarations.
- Validate handler contracts.

### Compatibility Tests

- Deprecated ids resolve.
- Schema migrations work.
- Old workflows continue.

### Mutation Tests

- Permission gates.
- policy gates.
- rollback gates.

### Stress Tests

- 10,000 commands.
- 300 plugins.
- 100 concurrent searches.
- large histories.

### Fuzz Tests

- malformed manifests.
- malformed arguments.
- conflicting aliases.
- invalid schemas.

### Chaos Tests

- plugin crash.
- background restart.
- handler timeout.
- storage corruption.
- provider loss.

### Load Tests

- cold startup.
- plugin batch installation.
- mass command indexing.

### Benchmark Tests

- lookup.
- search.
- ranking.
- pipeline overhead.
- workflow execution overhead.

### Golden Tests

- canonical command search results.
- command availability fixtures.
- enterprise policy fixtures.
- permission-denied fixtures.

### Property-Based Tests

Properties:

- same input yields same search order.
- denied commands never execute.
- command ids are unique.
- replacement mappings terminate.
- every executable command has a handler.

### Long-Running Stability Tests

- repeated background restarts.
- plugin install/uninstall cycles.
- command history growth.
- workflow checkpoint/resume.

## Quality Gates

Reject the platform if:

- any command requires modifying the core runtime.
- any plugin bypasses permission system.
- any feature directly calls another feature.
- search depends on UI.
- execution depends on React.
- commands know who invoked them.
- commands depend on Chrome APIs.
- platform cannot support 10,000 commands.
- architecture cannot support AI agents.
- architecture cannot support distributed plugins.
- undo cannot be added later.

Required enforcement:

- dependency linting.
- manifest validation.
- architecture tests.
- performance CI budgets.
- security review for new capabilities.
- golden search tests.
- compatibility tests.

## Final Specification

The Universal Command Platform is the operating system for the extension.

The selected architecture is not a simple command registry and not a command palette backend. It is
a capability-governed, metadata-driven, plugin-aware, policy-enforced command runtime.

The platform separates:

- discovery from execution.
- metadata from handlers.
- command invocation from UI.
- policy from business logic.
- capabilities from concrete services.
- workflows from simple commands.
- plugins from privileged runtime.

This separation is what allows the extension to grow from dozens of first-party commands to
thousands of distributed commands, workflows, agents, voice actions, enterprise actions, and browser
automation without redesigning the platform.
