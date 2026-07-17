# Internal Framework Architecture

This document defines the internal framework every feature in the extension must use. The goal is
to keep the product modular, event-driven, testable, and ready for years of growth across command
palette, sidebar, floating toolbar, context actions, AI providers, workflows, browser automation,
prompt libraries, clipboard history, search, and future plugins.

This is not UI architecture. This is the application platform inside the extension.

## 1. Core Modules

### Feature Registry

The Feature Registry is the runtime catalog of all first-party and future plugin features.

Responsibilities:

- Register feature manifests.
- Track feature lifecycle state.
- Resolve declared dependencies.
- Enforce permission and capability boundaries.
- Expose enabled features to the command registry, context engine, and workflow engine.
- Support future third-party plugins without changing core runtime code.

A feature should be treated as a package with metadata, lifecycle hooks, commands, event handlers,
settings schema, permissions, and optional context detectors.

### Event Bus

The Event Bus is the primary communication channel for cross-module notifications.

Responsibilities:

- Publish strongly typed domain events.
- Subscribe handlers by event type.
- Support scoped channels such as background, content, sidebar, popup, and plugin runtime.
- Provide tracing metadata for debugging.
- Keep publishers decoupled from subscribers.

The Event Bus is for facts that happened, not requests for work. Example: `selection.changed`,
`command.executed`, `storage.updated`.

### Service Container

The Service Container provides dependency inversion.

Responsibilities:

- Construct core services.
- Inject service interfaces into features.
- Swap implementations for tests, development, production, and future plugin sandboxes.
- Prevent features from importing privileged modules directly.

Features receive capabilities through interfaces, not concrete imports.

### Command Registry

The Command Registry is the central catalog of executable actions.

Responsibilities:

- Register commands from features and plugins.
- Index commands for search and keyboard navigation.
- Evaluate command availability against context.
- Route execution through the Command Service.
- Track command history, recents, failures, and future undo metadata.

Commands are the product’s main abstraction.

### Command Service

The Command Service executes commands.

Responsibilities:

- Validate command availability.
- Build execution context.
- Enforce permissions.
- Support async execution, cancellation, timeout, progress, and result handling.
- Emit command lifecycle events.
- Record command history.
- Prepare future composition and undo.

### Context Engine

The Context Engine understands the current browser/page/user situation.

Responsibilities:

- Maintain a current context snapshot.
- Detect selected text, focused element, editable fields, page type, site adapter, code blocks,
  article content, video metadata, PDFs, documentation pages, GitHub, Jira, email, and more.
- Expose lightweight context by default and deeper context only after user intent.
- Allow features and plugins to register context detectors.
- Emit context events when meaningful state changes.

### Site Adapter Registry

The Site Adapter Registry manages website-specific behavior.

Responsibilities:

- Detect supported sites.
- Provide site-specific context extraction.
- Provide site-specific insertion/apply behavior.
- Register site-specific commands.
- Isolate fragile DOM selectors inside adapters.

Examples: GitHub, Gmail, Google Docs, Notion, Jira, Linear, YouTube, PDF viewer, documentation,
generic article, generic input.

### Storage Service

The Storage Service is the only path to persistent storage.

Responsibilities:

- Wrap Chrome storage, IndexedDB, and future cloud storage.
- Provide typed repositories.
- Run migrations.
- Enforce storage namespaces per feature/plugin.
- Emit storage update events.
- Support test doubles.

Features must not call `chrome.storage` directly.

### Settings Manager

The Settings Manager owns user preferences and feature configuration.

Responsibilities:

- Register settings schemas from features.
- Provide typed reads/writes.
- Validate settings.
- Support defaults, migrations, import/export, and per-site overrides.
- Emit `settings.changed`.

### Permission Manager

The Permission Manager owns browser and product-level permissions.

Responsibilities:

- Request optional host permissions.
- Track granted and denied permissions.
- Gate privileged operations.
- Provide permission prompts through surfaces.
- Emit `permission.granted` and `permission.denied`.

Features declare required permissions; they do not request them directly.

### AI Gateway

The AI Gateway is the only route to model providers.

Responsibilities:

- Abstract provider implementations.
- Enforce privacy policy and user consent.
- Redact sensitive content.
- Build structured provider requests.
- Stream responses.
- Support cancellation, retry, timeout, usage tracking, and provider failover.
- Emit provider and AI job events.

Features never call OpenAI, local models, or third-party providers directly.

### Workflow Engine

The Workflow Engine coordinates multi-step operations.

Responsibilities:

- Execute command chains.
- Pass outputs between steps.
- Support checkpoints, cancellation, rollback hooks, and progress events.
- Enforce permissions per step.
- Support future user-authored workflows.

### Notification Center

The Notification Center owns user-facing and internal notifications.

Responsibilities:

- Normalize success, warning, error, and progress notifications.
- Route notifications to popup, sidebar, toast, command palette, or system notification.
- Deduplicate repeated alerts.
- Emit notification events for observability.

### Logger

The Logger provides structured diagnostics.

Responsibilities:

- Log structured events by level: debug, info, warn, error.
- Attach scope, feature id, command id, tab id, request id, and correlation id.
- Redact secrets and page content.
- Store local diagnostics when enabled.
- Forward production-safe error reports only with explicit policy.

### History Service

The History Service records useful local activity.

Responsibilities:

- Command history.
- Workflow history.
- Prompt usage.
- Clipboard history, if enabled.
- Recent contexts and recents for command ranking.

History is local-first and privacy-aware.

### Search Service

The Search Service indexes local product objects.

Responsibilities:

- Search commands, prompts, workflows, history, preferences, and plugin actions.
- Support ranking signals such as recency, frequency, current context, and keyboard shortcuts.
- Avoid indexing sensitive page content unless explicitly saved.

## 2. Module Communication

Modules communicate through four channels, in this order of preference.

### 1. Service Interfaces

Use service interfaces for direct requests.

Good:

- Command Service asks Context Service for active context.
- Feature asks AI Gateway to run an AI job.
- Settings UI asks Settings Manager to update a preference.

Service calls are appropriate when a caller needs a result.

### 2. Typed Events

Use events for facts that happened.

Good:

- Context Engine publishes `selection.changed`.
- Command Service publishes `command.executed`.
- Storage Service publishes `storage.updated`.

Events should not imply that a specific subscriber exists.

### 3. Runtime Messages

Use runtime messages for cross-extension-boundary communication.

Examples:

- Content script to background.
- Popup to active tab.
- Sidebar to background.
- Background to content script.

Runtime messages should be thin transport wrappers around typed events or service requests.

### 4. Feature Public APIs

A feature may expose a narrow public API through its manifest or feature root.

Rules:

- Public APIs must be interface-based.
- No deep imports from another feature’s internals.
- Avoid feature-to-feature calls unless the dependency is explicit in the feature manifest.

## 3. Feature Lifecycle

Every feature follows the same lifecycle.

### `register(registry)`

Declares metadata without side effects.

Used for:

- Feature id and version.
- Commands.
- Settings schema.
- Event subscriptions.
- Required permissions.
- Context detectors.
- Site adapters.
- Services provided.

Why: registration must be safe during boot, tests, and plugin discovery.

### `initialize(container)`

Receives service dependencies and prepares internal state.

Used for:

- Create repositories.
- Prepare caches.
- Attach passive listeners through approved services.

Why: initialization is where dependencies are wired, not imported directly.

### `enable()`

Activates the feature.

Used for:

- Subscribe to events.
- Register active commands.
- Start observers.
- Enable scheduled tasks.

Why: features can be toggled per user, plan, site, permission, or plugin policy.

### `disable(reason)`

Temporarily deactivates the feature.

Used for:

- Remove event subscriptions.
- Stop observers.
- Hide commands.
- Cancel active jobs.

Why: disabling must be reversible and non-destructive.

### `destroy()`

Permanently tears down runtime resources.

Used for:

- Plugin unload.
- Extension reload.
- Test cleanup.
- Full feature removal.

Why: long-lived browser sessions must not leak listeners, timers, ports, or observers.

### Optional Lifecycle Hooks

`onMessage(message)`

- Handles feature-scoped runtime messages.

`onStorageChanged(change)`

- Reacts to owned storage updates.

`onPermissionGranted(permission)`

- Enables newly available capabilities.

`onPermissionRevoked(permission)`

- Cancels work that can no longer proceed.

`onContextChanged(context)`

- Updates availability, suggestions, or passive state.

## 4. Dependency Rules

### Features Cannot Directly Access Chrome APIs

Forbidden:

- `chrome.storage`
- `chrome.tabs`
- `chrome.runtime`
- `chrome.contextMenus`
- `chrome.scripting`
- `chrome.permissions`

Allowed:

- Injected service interfaces such as `TabsService`, `StorageService`, `PermissionService`.

Why: Chrome APIs are privileged, hard to test, and differ by runtime surface.

### Features Cannot Directly Write Storage

All persistence goes through Storage Service or feature repositories created by Storage Service.

Why: this enables migrations, namespacing, encryption, sync policy, quotas, and tests.

### Features Cannot Directly Call AI Providers

All model calls go through AI Gateway.

Why: privacy, consent, redaction, provider switching, cancellation, logging, and usage accounting.

### Content Scripts Cannot Own Business Logic

Content scripts may:

- Observe page state.
- Extract approved context.
- Mount surfaces.
- Apply user-approved results to the page.

Content scripts may not:

- Store secrets.
- Call AI providers.
- Execute workflows.
- Make final permission decisions.

### UI Cannot Own Core Logic

Popup, sidebar, command palette, and toolbar should call services and render state. They should not
own feature orchestration.

### Services Cannot Depend On UI

Core services must be usable from background, tests, and future plugin runtimes.

### Dependency Direction

Allowed direction:

```txt
entrypoints -> feature registry -> features -> service interfaces -> core utilities
entrypoints -> surfaces -> services
background/content/popup/sidebar -> messaging -> services
```

Disallowed direction:

```txt
core services -> React UI
core services -> concrete features
features -> feature internals from other features
features -> Chrome APIs
content script -> AI providers
```

## 5. Event System

The event system should be strongly typed and domain-oriented.

Each event includes:

- `type`
- `id`
- `timestamp`
- `source`
- `scope`
- `correlationId`
- `payload`
- optional `tabId`
- optional `featureId`
- optional `commandId`

Core event categories:

### Context Events

- `page.changed`
- `page.ready`
- `page.unloaded`
- `selection.changed`
- `focus.changed`
- `editable.changed`
- `context.detected`
- `context.invalidated`

### Command Events

- `command.registered`
- `command.availability.changed`
- `command.started`
- `command.progress`
- `command.executed`
- `command.failed`
- `command.cancelled`
- `command.undo.available`
- `command.undo.executed`

### Surface Events

- `popup.opened`
- `popup.closed`
- `sidebar.opened`
- `sidebar.closed`
- `palette.opened`
- `palette.closed`
- `toolbar.opened`
- `toolbar.closed`
- `notification.shown`
- `notification.dismissed`

### Provider Events

- `provider.registered`
- `provider.changed`
- `provider.health.changed`
- `ai.request.started`
- `ai.request.streaming`
- `ai.request.finished`
- `ai.request.failed`
- `ai.request.cancelled`

### Storage And Settings Events

- `storage.updated`
- `storage.migrated`
- `storage.quota.warning`
- `settings.changed`
- `settings.reset`
- `preferences.imported`
- `preferences.exported`

### Workflow Events

- `workflow.registered`
- `workflow.started`
- `workflow.step.started`
- `workflow.step.finished`
- `workflow.step.failed`
- `workflow.finished`
- `workflow.failed`
- `workflow.cancelled`

### Browser Events

- `tab.activated`
- `tab.updated`
- `window.focused`
- `keyboard.shortcut`
- `contextMenu.clicked`
- `permission.granted`
- `permission.denied`
- `permission.revoked`

### Clipboard And History Events

- `clipboard.updated`
- `clipboard.item.saved`
- `history.recorded`
- `history.cleared`
- `search.performed`

Event rules:

- Events are immutable.
- Events describe facts, not commands.
- Event payloads are serializable.
- Sensitive payload fields must be redacted before logging.
- Subscribers must be isolated so one failure does not break the bus.

## 6. Command System

Commands are the primary product abstraction.

### Command Metadata

Each command declares:

- `id`
- `featureId`
- `title`
- `description`
- `category`
- `keywords`
- `icon`
- `defaultShortcut`
- `availability`
- `requiredContext`
- `requiredPermissions`
- `inputSchema`
- `outputSchema`
- `executionMode`
- `resultPresentation`
- `isComposable`
- `isUndoable`
- `privacyLevel`
- `riskLevel`

### Availability

Availability is computed, not hardcoded in UI.

Inputs:

- Active context.
- Selected text.
- Focused editable element.
- Current site adapter.
- Granted permissions.
- User settings.
- Feature enabled state.
- Provider availability.

### Execution

Command execution flow:

1. Resolve command.
2. Build execution context.
3. Validate availability.
4. Check permissions.
5. Start command job.
6. Emit progress.
7. Return typed result.
8. Present result through requested surface.
9. Record history.
10. Emit success, failure, or cancellation event.

### Composability

Composable commands must have typed input/output schemas.

Example chain:

```txt
page.extract -> text.summarize -> task.create -> sidebar.present
```

No command should depend on another command’s internal implementation.

### Undo

Undo is future-ready.

Undoable commands must return:

- `undoLabel`
- `undoPayload`
- `undoHandlerId`
- affected target metadata

Page mutation commands, storage writes, and generated inserts should be designed with this in mind.

## 7. Context Engine

The Context Engine produces layered context.

### Context Levels

`basic`

- URL
- hostname
- title
- selection metadata
- focused element type
- page kind

`visible`

- visible text around viewport
- selected text
- nearby headings
- focused input content

`structured`

- article extraction
- code blocks
- email thread metadata
- issue/PR metadata
- PDF text layer
- video transcript metadata

`deep`

- full page text
- multi-tab context
- site API context
- document outline

Deep context requires explicit user intent.

### Detector Types

Generic detectors:

- selection detector
- focus detector
- editable detector
- article detector
- code block detector
- documentation detector
- PDF detector
- video detector

Site detectors:

- GitHub detector
- Jira detector
- Gmail detector
- Google Docs detector
- Notion detector
- LinkedIn detector
- YouTube detector

### Extensibility

Features and plugins can register detectors with:

- `id`
- `priority`
- `matchesHost`
- `matchesDom`
- `extractBasic`
- `extractStructured`
- `getActions`
- `applyResult`

Detection rules:

- Run cheap detectors first.
- Lazy-load expensive detectors.
- Never repeatedly scan the full DOM.
- Cache stable context.
- Invalidate context on navigation, focus change, selection change, and meaningful mutations.

## 8. Service Layer

### Storage Service

Owns persistence, migrations, feature namespaces, quotas, and storage events.

### Clipboard Service

Owns read/write clipboard operations and clipboard history when enabled.

### Tabs Service

Owns tab queries, active tab state, tab messaging, navigation, and tab metadata.

### Windows Service

Owns focused window state, side panel opening, and future multi-window workflows.

### Messaging Service

Owns typed runtime messages, long-lived ports, request/response correlation, and cross-surface
transport.

### Context Service

Owns context snapshots, detector orchestration, context cache, and context events.

### AI Service / AI Gateway

Owns provider registry, requests, streaming, redaction, consent, model selection, and usage.

### Permission Service

Owns browser permissions, host permissions, feature permissions, plugin permissions, and policy
checks.

### Notification Service

Owns user notifications, progress, errors, and delivery surface selection.

### History Service

Owns command history, workflow history, prompt history, and optional clipboard history.

### Command Service

Owns command execution, cancellation, composition, validation, history, and events.

### Settings Service

Owns user preferences, defaults, schema validation, migrations, and per-feature settings.

### Search Service

Owns indexing and ranking commands, prompts, workflows, and local saved artifacts.

### Workflow Service

Owns multi-step command execution, progress, cancellation, and future workflow authoring.

### Automation Service

Owns browser automation primitives under strict permission and user-intent policy.

### Prompt Library Service

Owns prompt templates, variables, versioning, search, and feature/plugin prompt registration.

## 9. Error Architecture

### Error Types

Errors should be typed by domain:

- `ValidationError`
- `PermissionError`
- `StorageError`
- `ProviderError`
- `ContextError`
- `CommandError`
- `WorkflowError`
- `MessagingError`
- `PluginError`
- `UnexpectedError`

Each error carries:

- `code`
- `message`
- `safeMessage`
- `severity`
- `source`
- `recoverable`
- `correlationId`
- optional redacted context

### Propagation Rules

- Service methods return typed results or throw typed domain errors, consistently per service.
- Runtime boundaries convert thrown errors to serializable error responses.
- UI surfaces receive safe messages only.
- Internal logs may contain diagnostic metadata but not raw sensitive content.
- Background should isolate failures so one feature cannot crash the whole runtime.

### Logging

Log levels:

- `debug`: development-only detailed traces.
- `info`: lifecycle and successful high-level operations.
- `warn`: recoverable issues.
- `error`: failed operations.

Logs must include:

- timestamp
- level
- scope
- feature id
- command id, if available
- correlation id
- safe message

Logs must not include:

- API keys
- raw page content
- private email text
- full selected text unless user explicitly exports diagnostics
- auth tokens

### Debugging

Debug mode should provide:

- event trace viewer data
- command execution timeline
- context detector decisions
- permission decisions
- provider request lifecycle without raw prompts by default
- storage migration logs

### Production Error Reporting

Production reporting should be:

- opt-in or privacy-preserving.
- redacted by default.
- sampled where appropriate.
- grouped by error code and stack fingerprint.
- never include page content without explicit user action.

## 10. Future Plugin System

The framework should assume plugins will exist even before they are enabled.

### Plugin Manifest

Each plugin declares:

- `id`
- `name`
- `version`
- `publisher`
- `capabilities`
- `permissions`
- `commands`
- `contextDetectors`
- `settingsSchema`
- `entrypoints`
- `minimumRuntimeVersion`

### Plugin Lifecycle

Plugins follow the same lifecycle as features:

- `register`
- `initialize`
- `enable`
- `disable`
- `destroy`

Plugins may also have:

- `upgrade`
- `migrateStorage`
- `onPermissionChanged`

### Plugin Permissions

Plugin permissions are separate from browser permissions.

Examples:

- `context:read-basic`
- `context:read-selection`
- `context:read-page`
- `storage:own-namespace`
- `commands:register`
- `ai:request`
- `clipboard:read`
- `clipboard:write`
- `tabs:active`
- `automation:page`

Plugins get least privilege by default.

### Plugin Sandboxing

Plugins should not receive raw access to:

- Chrome APIs.
- AI providers.
- global storage.
- DOM mutation APIs outside approved adapters.
- other plugin data.

They receive a constrained SDK backed by framework services.

### Plugin API Surface

The plugin SDK should expose:

- `events`
- `commands`
- `context`
- `storage`
- `settings`
- `notifications`
- `ai`
- `permissions`
- `workflow`
- `logger`

All APIs are interface-based, versioned, and capability-gated.

### Plugin Security

Rules:

- Plugin code is untrusted unless shipped first-party.
- Plugin capabilities must be declared and user-visible.
- Plugin storage is namespaced.
- Plugin events are scoped.
- Plugin AI access goes through the AI Gateway.
- Plugin page access goes through approved context APIs.
- Plugins cannot silently exfiltrate context.

## Architecture North Star

The extension should feel simple because the framework is strict.

Features should be easy to add because they all follow the same rules:

- declare capabilities.
- receive services.
- publish events.
- register commands.
- avoid privileged APIs.
- keep context explicit.
- keep AI behind the gateway.
- keep storage behind repositories.
- keep UI as a surface, not an architecture.

This lets the product grow from contextual commands into workflows, automation, plugins, and
multi-provider AI without becoming tightly coupled.
