# Roadmap

## Milestone 1: Foundation

Goal: Establish a production-ready Chrome Extension foundation.

Status: Complete.

Deliverables:

- Manifest V3 setup.
- React, TypeScript, Vite, Tailwind CSS.
- Strict linting and formatting.
- Popup, options, background, and content entry points.

Complexity: Medium.

## Milestone 2: Injected Workspace UI

Goal: Safely inject extension UI into ChatGPT.

Status: Complete.

Deliverables:

- Shadow DOM host.
- Floating button.
- Sidebar shell.
- Isolated Tailwind styles.

Complexity: Medium.

## Milestone 3: Folder Management

Goal: Allow users to manage folders locally.

Status: Complete.

Deliverables:

- Folder CRUD.
- Folder validation.
- Folder repository/service/hooks.
- Folder management UI.
- Accessible dialogs and confirmation flows.

Complexity: High.

## Milestone 4: Conversation Detection

Goal: Detect current and listed ChatGPT conversations reliably.

Status: Complete.

Deliverables:

- Centralized selectors.
- MutationObserver and history navigation observation.
- Normalized conversation model.
- In-memory registry and service.

Complexity: High.

## Milestone 5: Conversation Assignment

Goal: Assign conversations to folders.

Status: Complete.

Deliverables:

- Assignment model, repository, service, state, events, hooks.
- Sidebar assignment controls.
- Folder conversation counts.
- Assigned conversation lists.

Complexity: High.

## Milestone 6: Persistence and Synchronization

Goal: Keep workspace state consistent across reloads and storage changes.

Status: Complete.

Deliverables:

- Synchronization Engine.
- Workspace snapshots.
- Conflict resolver.
- Recovery manager.
- Sync queue and typed sync events.
- UI preference persistence.

Complexity: High.

## Milestone 7: Beta Hardening

Goal: Prepare for public beta.

Status: In progress.

Deliverables:

- Security audit.
- Accessibility review.
- Performance cleanup.
- Documentation refresh.
- Bundle review.
- Error and logging hardening.

Complexity: Medium.

## Milestone 8: Workspace Explorer

Goal: Turn the extension into a usable workspace for browsing and organizing conversations.

Status: Complete.

Deliverables:

- Folder tree view.
- Conversation list view.
- Folder navigation and filtering.
- Assignment visibility.
- Active conversation highlighting.
- Workspace counters.
- Empty, loading, and error states.

Complexity: High.

## Milestone 9: Universal Search Engine

Goal: Provide high-performance indexed search across all workspace data.

Status: Complete.

Deliverables:

- Provider-based Search Engine.
- Search index, indexer, ranking, cache, history, suggestions, events, hooks, and repository.
- SearchBar with keyboard shortcut, clear, loading, Escape behavior, and instant updates.
- Grouped results for folders, conversations, and assignments.
- Persistent recent search history.
- Future-ready provider contract for tags, favorites, notes, AI metadata, and semantic embeddings.

Complexity: High.

## Milestone 10: Quick Action Framework

Goal: Provide a central, extensible interaction framework for conversation and bulk operations.

Status: Complete.

Deliverables:

- Action Engine, Registry, Providers, Executor, Permissions, History, Queue, Events, Hooks, and state.
- Context menu with right-click, keyboard menu key, Escape close, click outside, icons, disabled/danger states.
- Bulk selection, Select All, Clear Selection, and bulk toolbar.
- Move to Folder folder picker.
- Favorite domain with persistence and favorite filter.
- Copy link/title/Markdown link.
- Open in new tab.
- Rename dialog with validation and optimistic runtime update.
- Export provider placeholders.
- Future AI and metadata placeholders.

Complexity: High.

## Milestone 11: AI Intelligence Architecture

Goal: Establish the provider-neutral AI foundation for future premium intelligence features.

Status: Complete.

Deliverables:

- AI Engine, Provider, Registry, Service, Task Manager, Job Queue, Events, Hooks, Settings, History, and Cache.
- Provider abstraction for OpenAI, Gemini, Claude, Grok, DeepSeek, OpenRouter, and local LLM implementations.
- Task model for summaries, folder suggestions, tags, cleanup, duplicate detection, related conversations, naming, analytics, and natural language search.
- Priority queue with cancellation, retry, progress, and future background execution compatibility.
- TTL/versioned response cache with local persistence and invalidation.
- Embeddings, embedding cache, semantic index, chunking strategy, and vector store placeholders.
- AI action and prompt placeholders without external API calls.
- Privacy boundary requiring explicit provider enablement before any AI execution.

Complexity: High.

## Milestone 12: Provider-Agnostic Platform

Goal: Transform the project from a ChatGPT-specific extension architecture into a universal AI Workspace platform foundation.

Status: Complete.

Deliverables:

- Provider Engine, Registry, Adapter, Factory, Lifecycle, Events, Hooks, Config, Utils, and Errors.
- Universal provider data model for providers, workspaces, sessions, conversations, threads, messages, attachments, users, assistants, history, and metadata.
- Capability detection for streaming, vision, file uploads, PDF uploads, memory, images, voice, Canvas, MCP, code interpreter, and tool calling.
- Authentication abstraction for browser session, OAuth, API key, token refresh, local auth, and enterprise auth.
- Universal streaming controller for start, pause, resume, cancel, progress, completion, and error-ready states.
- Message pipeline with incoming/outgoing middleware and future interceptors.
- Provider cache, telemetry buffer, session store, settings, and plugin registry.
- Plugin architecture for providers, exporters, search providers, themes, automation, and custom actions.
- Provider isolation rules and documentation diagrams.

Complexity: High.

## Future Milestones

- Tags.
- Markdown export.
- PDF export.
- Production provider adapters.
- Cross-provider search and sync.
- Provider-backed AI search and summaries.
- Prompt library.
- Cloud sync.
- Accounts and subscriptions.
- Analytics and release telemetry.
