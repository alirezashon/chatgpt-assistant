# RFC-005: Universal Action Intelligence Engine

Status: Draft  
Priority: Critical  
Category: Core Platform  
Decision Owner: Core Platform Architecture  

## Executive Summary

The Universal Action Intelligence Engine is the decision-making brain of the extension. It does not
answer prompts, render UI, call AI providers, inspect the DOM, or know which surface will display
its results.

Its responsibility is narrower and more important:

> Given the current user, browser, context, permissions, capabilities, and system state, determine
> the best actions the user can take right now.

The engine consumes normalized context from the Context Intelligence Engine and produces ranked,
presentation-independent action candidates for command palettes, toolbars, context menus, sidebars,
keyboard shortcuts, automation, workflows, plugins, and future agents.

This RFC evaluates multiple architectural patterns, rejects unsuitable options, selects one winning
architecture, and defines the action model, ranking engine, discovery system, failure behavior,
performance budgets, security posture, and test strategy.

## Non-Negotiable Constraints

The Action Engine must not:

- render UI.
- know React exists.
- know Tailwind exists.
- know popup, sidebar, command palette, or toolbar exist.
- call OpenAI or any AI provider.
- access Chrome APIs directly.
- access the DOM.
- access storage directly.
- access clipboard directly.
- depend on website-specific adapters.

The Action Engine must:

- be deterministic.
- be testable.
- be extensible.
- support hundreds or thousands of commands.
- support plugins.
- support enterprise policy.
- support offline mode.
- support automation and agents.
- support multiple AI providers through capabilities, not direct calls.
- allow new features without modifying core engine code.

## Problem Statement

Most browser extensions expose features through fixed surfaces: popup buttons, context menu items,
sidebars, or settings pages. This product requires the reverse model.

The product should infer the most useful action from:

- current context.
- selected text.
- focused field.
- website.
- cursor position.
- language.
- user behavior.
- command history.
- installed features.
- available providers.
- permission state.
- network state.
- enterprise policy.
- offline capability.
- workspace state.
- browser capability.

Then it must return:

- recommended actions.
- ranked commands.
- grouped command results.
- disabled actions with reasons.
- workflow suggestions.
- automation opportunities.
- plugin-provided actions.

All without any presentation knowledge.

The hard problem is not command execution. The hard problem is deterministic, explainable,
extensible action selection under partial information.

## Architectural Patterns Considered

The following patterns were evaluated:

1. Rule Engine
2. Decision Tree
3. Chain of Responsibility
4. Event Sourcing
5. Entity Component System
6. Behavior Trees
7. Blackboard Architecture
8. Plugin Pipeline
9. Graph Execution
10. Policy Engine
11. Specification Pattern
12. Command Bus
13. Actor Model
14. Reactive Graph
15. Knowledge Graph
16. Hybrid Architecture

## Architecture Evaluation

### 1. Rule Engine

Description:

A centralized engine evaluates declarative rules against normalized facts. Rules produce action
candidates or modify scores.

Example conceptually:

- If context type is `code`, recommend explain, refactor, optimize, find bugs.
- If provider unavailable, disable AI actions.
- If enterprise policy forbids external AI, demote or hide external provider actions.

Performance:

- Strong when rules are simple and indexed by context type.
- Weak if every rule is evaluated for every context.
- Requires rule pre-filtering by namespace, context type, and capability.

Memory:

- Low to moderate.
- Rules are static data plus compiled predicates.

Complexity:

- Low initially.
- High over time if rule ownership is unclear.

Maintainability:

- Good if rules are feature-owned.
- Poor if all rules accumulate in one central registry.

Debuggability:

- Good if every rule emits score contribution traces.
- Poor if rules are opaque functions.

Scalability:

- Handles hundreds of commands if indexed.
- Can degrade with thousands of broad rules.

Developer Experience:

- Good for straightforward conditions.
- Poor for multi-step workflows and conditional action groups.

Testability:

- Excellent for individual rules.
- Good for golden ranking tests.

Browser Suitability:

- Strong. Deterministic, lightweight, MV3-friendly.

Plugin Support:

- Good if plugins can register scoped rules.
- Risky if plugins can execute arbitrary predicates without sandboxing.

AI Support:

- Good for deciding whether AI actions are available.
- Not suitable for AI reasoning itself.

Automation Support:

- Moderate. Rules can recommend automation, but do not model automation sequences well.

Offline Capability:

- Strong.

Enterprise Readiness:

- Strong if combined with policy constraints.

Migration Cost:

- Low.

Future Proofness:

- Moderate. Needs composition with other patterns.

Verdict:

- Useful as a scoring and eligibility layer, but insufficient as the whole architecture.

### 2. Decision Tree

Description:

The engine walks a branching tree of conditions to select actions.

Performance:

- Excellent for small, well-known paths.
- Fast and predictable.

Memory:

- Low.

Complexity:

- Low initially.
- Becomes brittle as contexts multiply.

Maintainability:

- Poor at scale.
- Adding a new command often requires changing tree structure.

Debuggability:

- Good for a single path.
- Poor when multiple contexts should produce multiple actions.

Scalability:

- Weak for hundreds of commands and plugins.

Developer Experience:

- Simple for first-party core flows.
- Bad for decentralized feature registration.

Testability:

- Good for branch coverage.
- Poor for combinatorial context interactions.

Browser Suitability:

- Technically suitable.
- Product unsuitable because it overfits deterministic flows.

Plugin Support:

- Weak. Plugins cannot safely splice arbitrary branches into a central tree.

AI Support:

- Weak for dynamic provider and workflow capability selection.

Automation Support:

- Weak to moderate.

Offline Capability:

- Strong.

Enterprise Readiness:

- Moderate.

Migration Cost:

- Medium to high once tree grows.

Future Proofness:

- Poor.

Verdict:

- Rejected. Too rigid for an extensible AI operating layer.

### 3. Chain of Responsibility

Description:

Handlers are ordered. Each handler may return actions or pass to the next handler.

Performance:

- Good when early handlers match.
- Poor when many handlers run.

Memory:

- Low.

Complexity:

- Low initially.
- Ordering conflicts become complex.

Maintainability:

- Fragile. New handlers can accidentally shadow existing ones.

Debuggability:

- Moderate. Handler traces help.
- Hard to explain missed actions caused by earlier handlers.

Scalability:

- Weak for many independent feature modules.

Developer Experience:

- Easy to add handlers.
- Hard to reason about global effects.

Testability:

- Good per handler.
- Weak for ordering and conflicts.

Browser Suitability:

- Compatible but not expressive enough.

Plugin Support:

- Weak. Plugin order becomes a product and security problem.

AI Support:

- Weak for ranking many candidates.

Automation Support:

- Weak.

Offline Capability:

- Strong.

Enterprise Readiness:

- Moderate.

Migration Cost:

- Medium.

Future Proofness:

- Poor.

Verdict:

- Rejected as primary architecture. It is acceptable inside small subsystems where fallback order is
  explicit.

### 4. Event Sourcing

Description:

Every input event is stored and the current action state is derived from replay.

Performance:

- Append is fast.
- Derivation can be expensive.

Memory:

- Potentially high.
- Browser storage and privacy constraints make durable logs risky.

Complexity:

- High.

Maintainability:

- Strong in backend systems with durable event logs.
- Heavy for browser extension action ranking.

Debuggability:

- Excellent if logs are retained.
- Privacy cost is significant.

Scalability:

- Good architecturally.
- Poor fit for local browser constraints.

Developer Experience:

- Harder than necessary.

Testability:

- Excellent replay tests.
- Excessive for normal command ranking.

Browser Suitability:

- Weak. MV3 service workers suspend, and persistent sensitive event logs are problematic.

Plugin Support:

- Moderate, but schema migration is hard.

AI Support:

- Useful for traceability, not decisioning.

Automation Support:

- Good audit story, high complexity.

Offline Capability:

- Strong.

Enterprise Readiness:

- Risky due to event retention policy.

Migration Cost:

- High.

Future Proofness:

- Moderate, but at excessive cost.

Verdict:

- Rejected as primary architecture. Use ephemeral event traces and golden fixtures, not event
  sourcing.

### 5. Entity Component System

Description:

Actions, contexts, capabilities, providers, and surfaces become entities with components. Systems
process matching entities.

Performance:

- Strong for games and simulations.
- Risky for browser extension decisioning if over-modeled.

Memory:

- Moderate to high.
- More objects than necessary for ranking commands.

Complexity:

- High.

Maintainability:

- Good only if team is ECS-fluent.
- Unusual for extension/product engineers.

Debuggability:

- Moderate. Requires ECS inspection tooling.

Scalability:

- High for many dynamic entities.
- Overkill for command recommendation.

Developer Experience:

- Poor for typical feature authors.

Testability:

- Good for pure systems.
- Harder for product semantics.

Browser Suitability:

- Heavy for MV3 and content scripts.

Plugin Support:

- Possible, but plugin components create schema governance issues.

AI Support:

- Not a natural fit.

Automation Support:

- Potentially strong for future page-object modeling.

Offline Capability:

- Strong.

Enterprise Readiness:

- Moderate.

Migration Cost:

- High.

Future Proofness:

- Good for automation, poor for command ecosystem simplicity.

Verdict:

- Rejected as primary architecture. Consider later only for a page automation object model.

### 6. Behavior Trees

Description:

Common in games and robotics. Nodes represent conditions, selectors, sequences, and actions.

Performance:

- Good for hierarchical decisions.
- Predictable.

Memory:

- Low to moderate.

Complexity:

- Moderate.

Maintainability:

- Good for agent behavior.
- Awkward for searchable command discovery.

Debuggability:

- Good with visual tree tooling.
- Poor without it.

Scalability:

- Moderate.
- Large behavior trees become hard to govern.

Developer Experience:

- Good for agent engineers.
- Less intuitive for feature teams registering commands.

Testability:

- Good for behavior paths.
- Less direct for ranking many candidates.

Browser Suitability:

- Compatible but not ideal.

Plugin Support:

- Weak to moderate. Plugin tree composition is complex.

AI Support:

- Strong for future autonomous agents.
- Not ideal for current deterministic recommendation ranking.

Automation Support:

- Strong.

Offline Capability:

- Strong.

Enterprise Readiness:

- Moderate.

Migration Cost:

- High if adopted prematurely.

Future Proofness:

- Strong for agents, weaker for command marketplace.

Verdict:

- Rejected as core. Useful later inside bounded agent/automation subsystems.

### 7. Blackboard Architecture

Description:

Modules contribute facts to a shared blackboard. Decision modules read facts and emit action
candidates.

Performance:

- Good if facts are scoped and ephemeral.
- Poor if it becomes reactive global state.

Memory:

- Moderate.
- Depends on fact retention.

Complexity:

- Moderate to high.

Maintainability:

- Good with strict schemas and ownership.
- Poor if arbitrary modules write arbitrary facts.

Debuggability:

- Excellent if fact traces are inspectable.

Scalability:

- Good for multi-signal inference.
- Requires governance.

Developer Experience:

- Moderate. Developers need to understand fact schemas.

Testability:

- Good for fact-to-action tests.

Browser Suitability:

- Good if ephemeral per evaluation cycle.
- Bad if used as durable mutable state.

Plugin Support:

- Good with namespaced facts.

AI Support:

- Good for collecting capability and provider facts.

Automation Support:

- Good for multi-signal opportunities.

Offline Capability:

- Strong.

Enterprise Readiness:

- Good if facts carry policy and sensitivity labels.

Migration Cost:

- Medium.

Future Proofness:

- Good if not overused.

Verdict:

- Suitable as an internal evaluation workspace, not as the public architecture.

### 8. Plugin Pipeline

Description:

Features and plugins register action providers. The engine runs providers through a staged pipeline:
eligibility, candidate generation, policy filtering, scoring, grouping, and final ranking.

Performance:

- Strong with indexing, stage budgets, and lazy providers.

Memory:

- Moderate and controllable.

Complexity:

- Moderate.
- Worth the upfront structure.

Maintainability:

- Strong. Feature-owned providers reduce central coupling.

Debuggability:

- Strong if each stage records traces and score contributions.

Scalability:

- Excellent for hundreds or thousands of commands.

Developer Experience:

- Strong. Feature authors register providers and commands through contracts.

Testability:

- Excellent. Providers, policies, ranking, and integration can be tested independently.

Browser Suitability:

- Strong. Works with MV3 because execution can be stateless and deterministic.

Plugin Support:

- Excellent.

AI Support:

- Strong. AI availability is represented as capabilities, not direct provider calls.

Automation Support:

- Strong. Automation providers can register opportunities with risk and permission metadata.

Offline Capability:

- Strong. Providers can declare offline availability.

Enterprise Readiness:

- Strong. Policy filters can be first-class pipeline stages.

Migration Cost:

- Moderate from current foundation.

Future Proofness:

- Excellent.

Verdict:

- Strong candidate and part of the final decision.

### 9. Graph Execution / Decision Graph

Description:

Actions, contexts, capabilities, policies, and workflows are nodes in a graph. Edges describe
dependencies, eligibility, transformations, or rankings.

Performance:

- Good if graph is precompiled and indexed.
- Poor if evaluated naively.

Memory:

- Moderate to high.

Complexity:

- High.

Maintainability:

- Strong once mature.
- Expensive to build and debug early.

Debuggability:

- Strong with graph visualization.
- Weak without tooling.

Scalability:

- Excellent for workflows and dependencies.

Developer Experience:

- Moderate. Requires graph mental model.

Testability:

- Good for deterministic graph evaluation.

Browser Suitability:

- Good if graph is compact and precomputed.
- Risky if runtime graph solving is heavy.

Plugin Support:

- Strong with namespaced graph nodes.

AI Support:

- Strong for workflow planning and capability matching.

Automation Support:

- Strong.

Offline Capability:

- Strong if local graph is available.

Enterprise Readiness:

- Strong.

Migration Cost:

- High.

Future Proofness:

- Very high.

Verdict:

- Too heavy as the first architecture, but useful as an internal model for workflow composition
  later.

### 10. Policy Engine

Description:

Policies evaluate whether actions are allowed, hidden, disabled, or modified based on permissions,
enterprise rules, privacy, provider availability, and risk.

Performance:

- Strong if policies are indexed.

Memory:

- Low.

Complexity:

- Moderate.

Maintainability:

- Strong if policies are declarative.

Debuggability:

- Strong with policy decision traces.

Scalability:

- Good.

Developer Experience:

- Good for security and enterprise teams.
- Not sufficient for generating actions.

Testability:

- Excellent.

Browser Suitability:

- Strong.

Plugin Support:

- Strong. Plugins can be constrained by policy.

AI Support:

- Strong for consent and provider gating.

Automation Support:

- Strong for risk and permission gating.

Offline Capability:

- Strong.

Enterprise Readiness:

- Excellent.

Migration Cost:

- Low to medium.

Future Proofness:

- High.

Verdict:

- Required as a pipeline stage, not sufficient as the whole architecture.

### 11. Specification Pattern

Description:

Reusable predicates describe action eligibility. Specifications can be composed with AND/OR/NOT.

Performance:

- Strong if compiled and indexed.

Memory:

- Low.

Complexity:

- Low to moderate.

Maintainability:

- Strong for eligibility rules.

Debuggability:

- Good if specification evaluation is traced.

Scalability:

- Good for action eligibility.
- Not enough for ranking and discovery.

Developer Experience:

- Strong. Easy to declare requirements.

Testability:

- Excellent.

Browser Suitability:

- Strong.

Plugin Support:

- Good with constrained spec DSL.

AI Support:

- Good for AI capability requirements.

Automation Support:

- Good for permission and context requirements.

Offline Capability:

- Strong.

Enterprise Readiness:

- Strong.

Migration Cost:

- Low.

Future Proofness:

- Moderate to high.

Verdict:

- Required for action eligibility and constraints, not sufficient alone.

### 12. Command Bus

Description:

Commands are registered and executed through a bus. The bus routes command execution to handlers.

Performance:

- Strong.

Memory:

- Low.

Complexity:

- Low to moderate.

Maintainability:

- Good for execution routing.
- Does not solve recommendation.

Debuggability:

- Good for execution traces.

Scalability:

- Good for many commands.

Developer Experience:

- Strong.

Testability:

- Strong.

Browser Suitability:

- Strong.

Plugin Support:

- Strong.

AI Support:

- Neutral.

Automation Support:

- Good for execution dispatch.

Offline Capability:

- Strong.

Enterprise Readiness:

- Strong with policy gating.

Migration Cost:

- Low.

Future Proofness:

- High as execution infrastructure.

Verdict:

- Necessary adjacent system, but not the Action Intelligence Engine.

### 13. Actor Model

Description:

Each feature/provider/plugin is an actor that receives messages and responds with action candidates.

Performance:

- Moderate.
- Messaging overhead can be high for synchronous ranking.

Memory:

- Moderate to high.

Complexity:

- High.

Maintainability:

- Good isolation.
- More operational complexity.

Debuggability:

- Requires message tracing.

Scalability:

- Good conceptually.
- Browser runtime is not a distributed actor environment.

Developer Experience:

- Harder for feature teams.

Testability:

- Good with actor test harness.

Browser Suitability:

- Weak to moderate. MV3 worker suspension complicates actor lifecycles.

Plugin Support:

- Good isolation story.

AI Support:

- Good for async jobs, not ranking.

Automation Support:

- Moderate.

Offline Capability:

- Strong.

Enterprise Readiness:

- Moderate.

Migration Cost:

- High.

Future Proofness:

- Moderate.

Verdict:

- Rejected. Too much runtime complexity for deterministic local ranking.

### 14. Reactive Graph

Description:

Actions are computed from reactive signals: context, permissions, providers, history, policy,
network, and settings.

Performance:

- Excellent when dependencies are precise.
- Poor if invalidation is broad.

Memory:

- Moderate.

Complexity:

- Moderate to high.

Maintainability:

- Good with clear signal ownership.
- Bad if every module subscribes to everything.

Debuggability:

- Strong with dependency graph tools.

Scalability:

- Good.

Developer Experience:

- Good if framework is simple.

Testability:

- Good for deterministic state transitions.

Browser Suitability:

- Good for UI-adjacent state, less ideal as core architecture because MV3 is eventful and
  intermittent.

Plugin Support:

- Moderate. Plugin subscriptions require strict isolation.

AI Support:

- Good for provider availability.

Automation Support:

- Moderate.

Offline Capability:

- Strong.

Enterprise Readiness:

- Good.

Migration Cost:

- Medium.

Future Proofness:

- Good.

Verdict:

- Useful inside caches and availability recomputation, not as the whole architecture.

### 15. Knowledge Graph

Description:

The engine models users, contexts, websites, commands, workflows, providers, and permissions as a
knowledge graph.

Performance:

- Weak unless heavily optimized.

Memory:

- High.

Complexity:

- Very high.

Maintainability:

- Powerful but expensive.

Debuggability:

- Strong with tooling, poor without it.

Scalability:

- High conceptually.

Developer Experience:

- Poor for normal extension feature work.

Testability:

- Complex.

Browser Suitability:

- Weak for local extension runtime.

Plugin Support:

- Strong in theory.

AI Support:

- Strong long-term, especially for agents.

Automation Support:

- Strong long-term.

Offline Capability:

- Weak unless graph is compact/local.

Enterprise Readiness:

- Risky due to data governance.

Migration Cost:

- Very high.

Future Proofness:

- High conceptually, not practical now.

Verdict:

- Rejected. Too heavy and privacy-sensitive for the core local engine.

## Architecture Rejection Summary

Rejected as primary architectures:

- Decision Tree: too rigid and not plugin-friendly.
- Chain of Responsibility: first-match behavior conflicts with ranked multi-action output.
- Event Sourcing: excessive complexity and privacy risk.
- ECS: too heavy for command recommendation.
- Behavior Trees: better for agents than action discovery.
- Blackboard as primary architecture: too much shared mutable state.
- Graph Execution as primary architecture: powerful but premature.
- Actor Model: runtime complexity does not fit MV3.
- Reactive Graph as primary architecture: useful for availability, not complete decisioning.
- Knowledge Graph: too heavy and privacy-sensitive.

Accepted as supporting patterns:

- Rule Engine for scoring and deterministic conditions.
- Policy Engine for enterprise, privacy, and permission decisions.
- Specification Pattern for eligibility.
- Command Bus for execution outside the Action Engine.
- Ephemeral Blackboard for evaluation facts.
- Reactive invalidation for cache recomputation.
- Graph model later for workflow composition.

## Decision

Adopt a **Hybrid Action Evaluation Pipeline** composed of:

1. Plugin Pipeline for decentralized action providers.
2. Specification Pattern for eligibility constraints.
3. Policy Engine for privacy, permissions, enterprise, and risk.
4. Rule-Based Scoring for deterministic ranking.
5. Ephemeral Blackboard for per-evaluation facts and traces.
6. Command Registry and Command Bus integration for discovery and execution.

The Action Engine core is an orchestrator, not a feature owner.

It receives a complete Action Evaluation Request, evaluates registered providers through a staged
pipeline, applies policies, scores candidates deterministically, groups results, and returns a pure
Action Evaluation Result.

## Winning Architecture

### High-Level Flow

```txt
ActionEvaluationRequest
  -> Validate Request
  -> Build Evaluation Facts
  -> Select Eligible Action Providers
  -> Generate Action Candidates
  -> Apply Specifications
  -> Apply Policy Filters
  -> Resolve Disabled/Hidden States
  -> Score Candidates
  -> Group And Compose Actions
  -> Deterministic Tie-Break
  -> Produce Presentation-Independent Result
  -> Emit Evaluation Trace
```

### Why This Wins

It wins because it balances competing requirements:

- deterministic ranking.
- decentralized feature ownership.
- future plugin support.
- enterprise policy enforcement.
- offline capability.
- AI-provider independence.
- testability.
- browser runtime constraints.
- automation readiness.

No future feature should require modifying the Action Engine core. A feature registers commands,
action providers, eligibility specifications, ranking hints, and policy metadata. The engine
orchestrates.

## ADR

### Context

The extension is an AI operating layer across the browser. It requires a presentation-independent
system that can decide the best available user actions from context, capabilities, preferences,
policy, and history.

### Problem Statement

How should the extension evaluate and rank hundreds of first-party, plugin-provided, workflow, AI,
offline, and enterprise actions without coupling the engine to UI, Chrome APIs, AI providers,
storage, or specific websites?

### Decision

Use a Hybrid Action Evaluation Pipeline with provider plugins, specifications, policy enforcement,
deterministic scoring, and ephemeral evaluation facts.

### Alternatives

Alternatives considered:

- pure rule engine.
- decision tree.
- chain of responsibility.
- event sourcing.
- ECS.
- behavior trees.
- blackboard.
- plugin pipeline.
- graph execution.
- policy engine.
- specification pattern.
- command bus.
- actor model.
- reactive graph.
- knowledge graph.

### Trade-Offs

Benefits:

- Modular.
- Deterministic.
- Testable.
- Extensible.
- Plugin-ready.
- Enterprise-ready.
- Presentation-independent.
- Works offline.
- Supports AI and automation through capabilities.

Costs:

- More upfront contracts.
- Requires evaluation trace tooling.
- Requires strict performance budgets.
- Requires provider governance.
- Requires deterministic scoring discipline.

### Consequences

All future features must register action providers instead of adding logic to the Action Engine.

All action eligibility must be expressed through specifications, capabilities, and policy metadata.

All ranking must be explainable through score contributions.

The engine returns pure data, never UI instructions.

### Risks

Provider explosion:

- Mitigation: provider namespaces, budgets, lint checks, registry validation.

Ranking complexity:

- Mitigation: normalized weighted signals, golden tests, deterministic tie-breakers.

Policy bypass:

- Mitigation: policy stage is mandatory and after candidate generation.

Plugin abuse:

- Mitigation: plugin capabilities, sandboxing, strict registration contracts.

Latency:

- Mitigation: candidate indexes, caching, lazy providers, hard budgets.

### Future Migration

Phase 1:

- Implement first-party Action Engine pipeline.
- Register built-in commands.
- Integrate Context Engine, Settings, Permissions, History, Provider capabilities.

Phase 2:

- Add action provider SDK for first-party features.
- Add golden ranking tests.
- Add evaluation traces.

Phase 3:

- Add plugin registration sandbox.
- Add enterprise policy bundles.
- Add workflow action providers.

Phase 4:

- Add optional graph execution for workflow planning.
- Add agent/automation opportunity providers.

Phase 5:

- Add local learned ranking as an optional signal while preserving deterministic fallback.

### Rejected Ideas

Central action switch:

- Rejected because every feature would require core edits.

UI-owned recommendations:

- Rejected because surfaces would diverge and duplicate business logic.

AI-ranked actions:

- Rejected as primary because ranking must be deterministic, explainable, offline-capable, and
  enterprise-auditable.

Direct feature-to-feature calls:

- Rejected because it creates circular dependencies and untestable coupling.

### Lessons Learned

The Action Engine should not be smart because it contains all product knowledge. It should be smart
because it orchestrates decentralized knowledge under strict contracts.

The right abstraction is not “what UI should show?” It is “which actions are valid, useful, safe,
and timely in this state?”

## Action Evaluation Request

The engine receives a single normalized request.

Required fields:

- `requestId`: unique evaluation id.
- `timestamp`: evaluation time.
- `context`: active Context object from Context Engine.
- `contextStack`: parent and child contexts.
- `invocation`: why evaluation is happening.
- `userState`: preferences, history, pinned actions, accessibility.
- `capabilities`: browser, provider, offline, feature, automation capabilities.
- `permissions`: granted, denied, promptable, restricted.
- `policy`: enterprise and privacy policy snapshot.
- `systemState`: network, auth, battery/performance mode, incognito.
- `workspaceState`: active workspace, organization, plan, tenant.
- `featureFlags`: enabled experiments.
- `locale`: language and localization state.

Invocation types:

- `palette.opened`
- `selection.changed`
- `contextmenu.opened`
- `toolbar.requested`
- `keyboard.shortcut`
- `sidebar.opened`
- `workflow.suggested`
- `automation.scan`
- `background.refresh`

The same engine handles every invocation, but scoring weights may vary by invocation type.

## Universal Action Model

An Action is a pure description of a possible user operation. It is not a UI component and not an
execution handler.

### Core Identity

`id`

- Globally unique stable id.
- Namespaced by feature or plugin.
- Example shape: `github.pr.review`, `selection.rewrite`, `email.reply`.

`version`

- Action contract version.
- Used for migration and compatibility.

`namespace`

- Owning namespace.
- Examples: `core`, `github`, `gmail`, `plugin.vendor.name`.

`featureId`

- Owning feature.

`pluginId`

- Present only for plugin actions.

### Display-Neutral Metadata

`title`

- Short action label.
- Presentation surfaces may render it differently, but meaning stays stable.

`description`

- One-sentence explanation.

`keywords`

- Search terms.

`aliases`

- Alternative user-facing names.

`category`

- Broad grouping such as writing, code, research, automation, workflow, settings.

`tags`

- Additional searchable labels.

`iconHint`

- Semantic icon hint, not a UI import.

`localizationKey`

- Stable translation key.

### Action Kind

`kind`

Supported values:

- `simple`: one-step command.
- `group`: parent grouping action.
- `nested`: child action under another action.
- `conditional`: only available if conditions pass.
- `async`: requires asynchronous execution.
- `ai`: uses AI Gateway through command execution.
- `workflow`: launches a workflow.
- `automation`: controls browser/page through approved automation service.
- `plugin`: provided by plugin.
- `enterprise`: controlled by tenant policy.
- `experimental`: behind feature flag.

### Visibility State

`visibility`

Supported values:

- `visible`: can be shown normally.
- `hidden`: not shown but may be invokable by id.
- `disabled`: shown with reason, not executable.
- `suppressed`: removed by policy or privacy.

`disabledReason`

- Required when disabled.

`hiddenReason`

- Optional diagnostic reason.

### Context Requirements

`requiredContext`

- Context types and subtypes required.

`supportedContexts`

- Contexts where action may appear.

`minimumConfidence`

- Minimum Context Engine confidence.

`requiresSelection`

- Whether selected content is required.

`requiresEditable`

- Whether focused editable target is required.

`requiresParentContext`

- Whether parent context is needed, such as PR plus selected code.

### Capability Requirements

`requiredCapabilities`

- Required services or capabilities.
- Examples: `ai.text.generate`, `clipboard.write`, `tabs.active`, `automation.click`,
  `storage.history`.

`offlineSupport`

- `full`, `partial`, or `none`.

`providerRequirements`

- AI provider capabilities needed, not provider identity.

### Permission And Policy

`requiredPermissions`

- Browser or product permissions.

`privacyLevel`

- `local`, `selection`, `visible-page`, `full-page`, `external-ai`, `automation`.

`riskLevel`

- `safe`, `low`, `medium`, `high`, `destructive`.

`requiresConfirmation`

- True for destructive, automation, external processing under sensitive contexts, and enterprise
  policy requirements.

`enterprisePolicy`

- Policy keys that can allow, disable, or suppress the action.

### Execution Contract

`commandId`

- Command to execute if selected.

`workflowId`

- Workflow to start for workflow actions.

`inputSchema`

- Required execution input.

`outputSchema`

- Expected result.

`cancellable`

- Whether execution supports cancellation.

`timeoutMs`

- Recommended execution timeout.

`idempotency`

- `idempotent`, `non-idempotent`, or `unknown`.

### Composition

`parentId`

- Parent action id for nested/grouped actions.

`children`

- Child action references.

`groupId`

- Logical action group.

`mutuallyExclusiveGroup`

- Used when only one of several actions should be selected or shown prominently.

`composable`

- Whether action can be used in workflows.

`produces`

- Output capabilities or artifacts.

`consumes`

- Input capabilities or artifacts.

### Ranking Metadata

`basePriority`

- Feature-provided baseline.

`rankingHints`

- Soft hints such as preferred invocation types, contexts, and recency behavior.

`pinning`

- Whether user can pin the action.

`frequencyEligible`

- Whether historical use should boost this action.

`latencyClass`

- `instant`, `fast`, `moderate`, `slow`.

### Auditability

`registeredAt`

- Registration time.

`source`

- `core`, `first-party-feature`, `plugin`, `enterprise-policy`.

`stability`

- `stable`, `beta`, `experimental`, `deprecated`.

`deprecation`

- Replacement action and removal timeline.

## Ranking Engine

The ranking engine must be deterministic, explainable, and stable.

### Ranking Output

Every action candidate receives:

- final score.
- normalized signal scores.
- applied boosts.
- applied penalties.
- policy decision.
- tie-break key.
- explanation trace.

### Signal Categories

`contextMatch`

- How well action matches active context.

`contextConfidence`

- Confidence from Context Engine.

`invocationFit`

- How appropriate action is for palette, selection, context menu, shortcut, sidebar, or automation
  scan.

`selectionFit`

- Selection length, type, language, and relevance.

`languageFit`

- Natural language or programming language compatibility.

`platformFit`

- Website/platform match.

`historyFrequency`

- How often user uses the action.

`historyRecency`

- How recently user used the action.

`keyboardHabit`

- Whether user tends to invoke via keyboard or has shortcut familiarity.

`pinBoost`

- User-pinned actions.

`workspaceFit`

- Workspace/org/team relevance.

`permissionFit`

- Whether permissions are already granted.

`providerFit`

- AI provider availability and capability match.

`latencyFit`

- Faster actions get a small boost in quick surfaces.

`offlineFit`

- Offline-capable actions rank higher when offline.

`policyFit`

- Enterprise policy can boost, demote, disable, or suppress.

`featureFlagFit`

- Enabled experimental actions can appear; disabled experiments cannot.

`accessibilityFit`

- Respect reduced motion, screen reader mode, keyboard usage, and interaction preferences.

`userIntentFit`

- Derived from invocation, focus, selection, and recent behavior.

### Score Normalization

Each signal is normalized to `0.0` through `1.0`.

The final score is a weighted sum:

```txt
score = sum(signalValue * signalWeight) + boosts - penalties
```

Weights are selected by invocation type.

Example:

- Selection toolbar weights selection fit highly.
- Command palette weights text search and recency highly.
- Context menu weights invocation target highly.
- Sidebar weights workflow and page-level context higher.
- Automation scan weights confidence and risk heavily.

### Required Gates Before Scoring

Candidates are removed before scoring if:

- feature disabled.
- action deprecated with no compatibility mode.
- plugin disabled.
- hard enterprise policy denies.
- privacy policy suppresses.
- required context unavailable.
- required capability unavailable and no disabled state is allowed.

Candidates become disabled, not removed, when:

- user can grant missing permission.
- provider can be connected.
- network may recover.
- feature can be enabled.
- context needs selection.

### Penalties

Apply penalties for:

- low context confidence.
- missing optional permission.
- slow latency.
- external AI on sensitive context.
- rate limit risk.
- offline incompatibility.
- high-risk automation.
- stale context.
- unsupported language.

### Tie-Breaking

Tie-breaking must be deterministic.

Order:

1. Higher final score.
2. Higher policy priority.
3. Higher context specificity.
4. User-pinned before unpinned.
5. Higher historical frequency.
6. More recent use.
7. Lower latency class.
8. Stable before beta before experimental.
9. First-party before plugin.
10. Lexicographic stable action id.

No random ordering is allowed.

### Stability Rule

Small signal changes must not reorder the entire list. Use score buckets and stable tie-breaking to
avoid jitter.

### Explainability Rule

Every ranked result must be explainable:

- why shown.
- why ranked here.
- why disabled.
- why hidden or suppressed in traces.

## Command Discovery

Commands become available through registration, not core edits.

### Registration

Every feature or plugin registers:

- command definitions.
- action providers.
- eligibility specifications.
- ranking hints.
- required capabilities.
- permissions.
- localization keys.
- deprecation metadata.

The Action Engine consumes registrations from the Feature Registry and Plugin Registry.

### Namespaces

Command ids must be namespaced:

- `core.selection.explain`
- `core.page.summarize`
- `github.pr.review`
- `gmail.email.reply`
- `plugin.vendor.command`

Namespaces prevent collisions and support policy targeting.

### Categories

Standard categories:

- writing.
- code.
- research.
- communication.
- productivity.
- automation.
- browser.
- workflow.
- settings.
- developer.
- enterprise.

### Aliases

Aliases support:

- different user vocabulary.
- migration from old command names.
- localized command search.
- common abbreviations.

### Tags

Tags are machine-usable labels:

- `ai`
- `offline`
- `selection`
- `editable`
- `github`
- `pdf`
- `safe`
- `automation`
- `experimental`

### Searchability

The discovery index includes:

- title.
- description.
- aliases.
- tags.
- category.
- platform.
- context types.
- recent usage.
- shortcut.

Search ranking is separate from action ranking but uses compatible metadata.

### Localization

Commands register localization keys, not hardcoded localized labels only.

Localized search should index:

- translated title.
- translated aliases.
- base language fallback.

### Versioning

Commands declare:

- semantic version.
- input schema version.
- output schema version.
- compatibility period.

### Deprecation

Deprecated commands declare:

- replacement command id.
- deprecation reason.
- removal version.
- migration behavior.

Deprecated actions rank lower unless explicitly searched by old alias.

## Failure Modes

### No Internet

Behavior:

- Offline-capable actions remain.
- AI actions requiring network become disabled with reason.
- Local history/search/settings actions remain.
- Ranking boosts offline-capable actions.

### No AI Provider

Behavior:

- AI actions disabled if provider connection is required.
- Provider setup action recommended when relevant.
- Non-AI actions remain.

### Corrupted Storage

Behavior:

- Engine uses safe defaults.
- History and preferences signals are ignored.
- Storage repair action may be recommended.
- Evaluation remains deterministic.

### Permission Denied

Behavior:

- Actions requiring denied permission are disabled or suppressed depending on policy.
- Permission explanation action can be recommended.
- Engine never requests permission directly.

### Incognito

Behavior:

- Persistent history disabled unless explicitly allowed.
- Sensitive actions demoted.
- External AI actions require explicit consent.

### DOM Changes

Behavior:

- Action Engine is unaffected because it does not read DOM.
- Context Engine may provide lower confidence or stale context.
- Ranking penalizes stale or low-confidence context.

### Unsupported Website

Behavior:

- Generic actions remain.
- Site-specific actions absent.
- Command palette still works.

### Rate Limits

Behavior:

- Affected provider actions disabled or demoted.
- Alternative provider actions may rise.
- Retry-after metadata influences ranking.

### Browser Restart

Behavior:

- Engine reconstructs from registries and persisted settings.
- No durable in-memory state required.

### Background Worker Killed

Behavior:

- Evaluation must be reconstructible.
- No evaluation depends on long-lived background memory.
- Caches are opportunistic only.

### Message Timeout

Behavior:

- Caller receives timeout error.
- Engine evaluation is cancellable.
- Partial candidates may be returned only if explicitly requested.

### Context Unavailable

Behavior:

- Generic global commands remain.
- Context-specific actions hidden or disabled.
- Engine should not guess high-risk actions.

### Plugin Crash

Behavior:

- Plugin provider is isolated.
- Failed provider contributes no candidates.
- Error trace recorded.
- Other providers continue.

### Workflow Crash

Behavior:

- Workflow action provider can be disabled temporarily.
- Related actions show recoverable error if relevant.
- Ranking continues for other actions.

## Performance Budget

Budgets are measured on a typical modern laptop browser session.

### Startup

Action Engine cold initialization:

- Target: under 10ms.
- Maximum: 25ms.

Registration processing:

- Target: under 20ms for 500 commands.
- Maximum: 50ms for 1,000 commands.

### Memory

Core engine memory:

- Target: under 3MB.
- Maximum: 8MB excluding feature/plugin registrations.

Command index:

- Target: under 2MB for 1,000 commands.
- Maximum: 5MB.

Evaluation cache:

- Target: under 2MB.
- Maximum: 5MB.

### Latency

Action generation:

- Target: under 16ms for common invocations.
- Maximum: 50ms.

Ranking:

- Target: under 8ms for 200 candidates.
- Maximum: 25ms for 1,000 candidates.

Command lookup by id:

- Target: under 1ms.
- Maximum: 3ms.

Search index lookup:

- Target: under 20ms.
- Maximum: 50ms.

### Recomputations

Selection-triggered recomputation:

- Debounced by Context Engine.
- Action Engine target under 16ms after context arrives.

Provider availability update:

- Recompute affected candidates only.

Settings/policy update:

- Invalidate relevant caches.

### Cache Limits

Evaluation result cache:

- Keyed by context fingerprint, invocation type, policy version, settings version, provider state,
  and registry version.
- Small LRU.
- No raw sensitive content in keys.

Maximum cached evaluations:

- Target: 50.
- Maximum: 200.

### Provider Budgets

Each action provider has:

- candidate count budget.
- time budget.
- memory budget.
- failure isolation.

Slow providers are skipped or deferred.

## Security Review

### Privilege Escalation

Risk:

- Plugin or feature registers action that implies privileged behavior.

Mitigation:

- All actions declare capabilities.
- Capability checks happen in policy stage.
- Execution services enforce permissions again.
- Action Engine never grants permissions.

### Prompt Injection

Risk:

- Page content attempts to influence action selection or policy.

Mitigation:

- Context content is data, not instruction.
- Context Engine marks source and sensitivity.
- Action Engine uses structured context fields, not page-written directives.
- AI is never used as primary deterministic ranker.

### Malicious Plugins

Risk:

- Plugin floods actions, spoofs namespaces, or requests excessive capabilities.

Mitigation:

- Namespace ownership.
- Plugin capability manifest.
- Provider budgets.
- Policy enforcement.
- Plugin isolation.
- Registration validation.

### Fake Contexts

Risk:

- Content script or plugin submits forged context.

Mitigation:

- Context provenance.
- Trust level on context source.
- Background validation for privileged actions.
- High-risk actions require high-trust context.

### Message Spoofing

Risk:

- Untrusted page or extension surface sends fake request.

Mitigation:

- Runtime message validation.
- Source surface validation.
- Correlation ids.
- No privileged action based solely on untrusted content messages.

### Data Leakage

Risk:

- Action metadata or traces include sensitive content.

Mitigation:

- No raw content in action ids, cache keys, logs, or traces.
- Redaction before diagnostics.
- Privacy labels on evaluation requests.

### Clipboard Abuse

Risk:

- Clipboard actions appear without user intent.

Mitigation:

- Clipboard actions require explicit invocation.
- Clipboard capabilities policy-gated.
- No silent clipboard reads.

### Storage Poisoning

Risk:

- Corrupt history or settings alters ranking.

Mitigation:

- Validate storage inputs.
- Clamp scores.
- Ignore invalid history.
- Use safe defaults.

### Extension Compromise

Risk:

- Core registry or plugin registry compromised.

Mitigation:

- Signed plugin manifests where applicable.
- Enterprise allowlists.
- Runtime integrity checks where possible.
- Least privilege execution services.

## Test Strategy

### Unit Tests

Cover:

- action model validation.
- specification evaluation.
- policy decisions.
- score normalization.
- tie-breaking.
- disabled/hidden/suppressed states.

### Integration Tests

Cover:

- context to action evaluation.
- provider registration.
- policy and ranking pipeline.
- plugin provider isolation.
- offline mode.
- provider unavailable mode.

### Contract Tests

For every action provider:

- valid registration.
- stable ids.
- declared capabilities.
- no forbidden dependencies.
- budget compliance.
- deterministic output for same input.

### Golden Tests

Golden fixtures define expected ranked actions for canonical states:

- selected code.
- Gmail composer.
- GitHub PR.
- PDF selection.
- YouTube video.
- offline article.
- enterprise-disabled AI.

Golden tests protect ranking quality.

### Snapshot Tests

Use for evaluation traces, not UI.

Snapshots should avoid raw sensitive content.

### Property Tests

Properties:

- same input produces same output.
- adding unrelated command does not reorder top results unexpectedly.
- denied policy never yields executable action.
- score remains within bounds.
- tie-breaking is stable.

### Mutation Tests

Use for:

- policy enforcement.
- permission gates.
- ranking gates.

If removing a gate does not break tests, test coverage is insufficient.

### Stress Tests

Scenarios:

- 10,000 registered commands.
- 1,000 plugin actions.
- rapid context changes.
- provider state flapping.
- large history dataset.

### Chaos Tests

Scenarios:

- provider throws.
- plugin times out.
- storage corrupt.
- policy malformed.
- context missing.
- background restart.

### Benchmark Tests

Benchmarks:

- cold registry load.
- candidate generation.
- ranking 100, 500, 1,000 candidates.
- cache hit.
- cache invalidation.
- golden fixture evaluation.

## Quality Gates

The proposal is invalid if any of the following become true:

- circular dependencies exist.
- UI knows business logic.
- business logic knows UI.
- Chrome APIs leak into Action Engine.
- storage implementation leaks into Action Engine.
- AI providers are tightly coupled.
- commands cannot be added independently.
- plugins require architecture changes.
- ranking is nondeterministic.
- any module has more than one responsibility.
- a feature requires modifying Action Engine core.

Enforcement:

- dependency lint rules.
- registration contract tests.
- architecture tests.
- golden ranking tests.
- performance budgets in CI.
- security review for new capabilities.

## Module Boundaries

### Action Engine Core

Owns:

- evaluation orchestration.
- provider selection.
- policy stage invocation.
- scoring.
- ranking.
- grouping.
- result shaping.
- trace generation.

Does not own:

- command execution.
- UI.
- storage.
- Chrome APIs.
- AI provider calls.
- DOM.
- clipboard.

### Action Providers

Own:

- feature-specific candidate generation.
- action metadata.
- eligibility hints.

Do not own:

- final ranking.
- policy decisions.
- permission grants.
- execution services.

### Policy Engine

Owns:

- allow/deny/disable/suppress decisions.
- enterprise policy.
- privacy policy.
- permission policy.
- risk policy.

### Ranking Engine

Owns:

- signal normalization.
- weighted scoring.
- penalties.
- tie-breaking.
- ranking trace.

### Command Registry

Owns:

- command definitions.
- command ids.
- versions.
- discovery metadata.

### Command Bus

Owns:

- execution dispatch.
- cancellation.
- progress.
- result routing.

The Action Engine recommends actions. The Command Bus executes them.

## Final Specification

The Universal Action Intelligence Engine is a deterministic, presentation-independent action
evaluation system.

It is not an AI model, not a UI system, and not a browser API wrapper.

Its core design is a Hybrid Action Evaluation Pipeline:

- plugin-based candidate generation.
- specification-based eligibility.
- policy-based safety and enterprise control.
- deterministic rule-based ranking.
- ephemeral fact blackboard for explainability.
- command registry integration for discovery.
- command bus integration for execution.

This architecture is the smallest system that satisfies all requirements without overfitting to
today’s surfaces or underbuilding for tomorrow’s plugins, automation, and agents.
