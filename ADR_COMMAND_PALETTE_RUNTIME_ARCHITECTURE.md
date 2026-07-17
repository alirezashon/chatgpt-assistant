# ADR: Universal Command Palette Runtime Architecture

## Status

Accepted

## Context

The Command Palette is the primary human-to-extension interface. It must feel like Raycast, Cursor,
VS Code, and Linear, while remaining a platform runtime rather than a search component or modal.

It must support:

- 10,000+ commands.
- context-aware ranking.
- recent and favorite commands.
- plugin commands.
- AI and workflow commands.
- command arguments.
- streaming execution.
- keyboard-first interaction.
- multiple invocation surfaces.

The UI layer must remain thin. Search, ranking, state, history, permission metadata, arguments, and
execution routing must live outside React components.

## Options Considered

### Architecture A: Single React Component

One React component owns query, filtering, ranking, keyboard handling, and execution.

Performance:

- Good for small lists.
- Poor for 10,000 commands because UI re-render pressure and logic coupling grow quickly.

Memory:

- Low initially.

Maintainability:

- Poor. Business logic becomes tied to component state.

Testing:

- Weak. Core behavior requires UI tests.

Extensibility:

- Weak. Plugins and execution policies leak into UI.

Security:

- Weak. UI can accidentally bypass platform execution gates.

Developer Experience:

- Easy initially, expensive later.

Verdict:

- Rejected. It violates the “UI layer must remain thin” requirement.

### Architecture B: Command Palette As Standalone Application Runtime

The palette is a separate app with its own state, command store, and execution logic.

Performance:

- Good if optimized.

Memory:

- Moderate to high due to duplicated platform state.

Maintainability:

- Moderate. Clear boundary, but risks parallel platform architecture.

Testing:

- Good if app runtime is headless.

Extensibility:

- Moderate. Plugins need palette-specific integration.

Security:

- Moderate. Execution gates may be duplicated.

Developer Experience:

- Good for palette engineers, weaker for platform consistency.

Verdict:

- Rejected as primary. The command palette should consume the Command Platform, not fork it.

### Architecture C: Event-Driven Command Surface

The palette is a surface reacting to events from command/search/history/execution services.

Performance:

- Good with precise events.

Memory:

- Good.

Maintainability:

- Good if events stay disciplined.

Testing:

- Good for event flows.

Extensibility:

- Good.

Security:

- Good when execution remains service-mediated.

Developer Experience:

- Moderate. Event tracing is required.

Verdict:

- Accepted as an integration style, but not sufficient alone.

### Architecture D: Headless Command Engine + Renderer

Search, ranking, history, favorites, state machine, arguments, and execution bridge are headless
services. React renders state and forwards user intent to a controller.

Performance:

- Strong. Search/ranking can be optimized and tested outside React.

Memory:

- Good. Headless indexes are reusable and renderer can mount/unmount.

Maintainability:

- Strong. Business logic and presentation are separated.

Testing:

- Strong. Core behavior uses unit and contract tests.

Extensibility:

- Strong. Plugin and command providers integrate through command source contracts.

Security:

- Strong. UI cannot execute directly; bridge enforces platform path.

Developer Experience:

- Strong. Feature teams register commands; palette engineers improve renderer independently.

Verdict:

- Accepted.

### Architecture E: Plugin-Based Command Marketplace

Commands are primarily plugin marketplace entries loaded dynamically.

Performance:

- Good with metadata indexing.

Memory:

- Moderate.

Maintainability:

- Good for plugin scale, too much for first implementation.

Testing:

- Requires plugin harness.

Extensibility:

- Excellent.

Security:

- Requires mature sandboxing and signing.

Developer Experience:

- Good long-term.

Verdict:

- Future extension of the selected architecture, not v1 base.

## Decision

Use **Architecture D: Headless Command Engine + Renderer**, with event-driven integration seams.

The command palette runtime is composed of:

- `CommandPaletteRuntime`
- `CommandPaletteController`
- `CommandPaletteStateMachine`
- `CommandSearchEngine`
- `CommandRankingEngine`
- `CommandHistoryManager`
- `CommandFavoriteManager`
- `CommandShortcutManager`
- `CommandArgumentResolver`
- `CommandExecutionBridge`
- `CommandPaletteRenderer`

React owns only rendering and user-input forwarding.

## Trade-Offs

Benefits:

- Search logic stays outside UI.
- Ranking is deterministic and testable.
- Commands are dynamic and provider-backed.
- Renderer can move from Shadow DOM to iframe/native surface later.
- Execution remains platform-mediated.
- The same headless engine can serve voice, keyboard, and future surfaces.

Costs:

- More files and contracts up front.
- Renderer must adapt to state-machine output instead of owning local state.
- Requires explicit command provider injection until the full Command Platform is complete.

## Consequences

- No hardcoded commands in UI.
- No direct Chrome API calls from palette core or renderer.
- No direct AI provider calls.
- State changes are explicit.
- Search/ranking can be benchmarked independently.
- Plugin command support is modeled through command sources, not UI changes.

## Future Migration

When the full Universal Command Platform is implemented:

1. Replace the local command source with the platform command registry source.
2. Keep the search/ranking interfaces stable.
3. Route execution through the Command Bus implementation.
4. Add plugin catalog metadata to the same command model.
5. Add persisted history/favorites through Storage Runtime without changing the renderer.
