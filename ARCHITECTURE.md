# Architecture

## Overview

ChatGPT Workspace is a Manifest V3 Chrome Extension with a content-script-driven React UI. The content UI is mounted inside a Shadow DOM to isolate extension styles and behavior from ChatGPT.

The application follows a layered dependency flow:

```text
UI -> Hooks -> Services -> Repositories -> Storage Adapter -> Chrome Storage
```

UI components do not access Chrome APIs directly. ChatGPT DOM access is isolated to the conversation detection engine.

## Runtime Architecture

```mermaid
flowchart TD
  Content["Content Script"] --> Shadow["Shadow DOM Host"]
  Shadow --> React["React UI"]
  React --> Explorer["Workspace Explorer"]
  Explorer --> UIHooks["Workspace / Sync Hooks"]
  UIHooks --> WorkspaceEngine["Workspace Engine"]
  UIHooks --> SyncEngine["Synchronization Engine"]

  WorkspaceEngine --> ConversationEngine["Conversation Engine"]
  WorkspaceEngine --> FolderService
  WorkspaceEngine --> AssignmentService
  WorkspaceEngine --> SyncEngine

  ConversationEngine --> ConversationStore["Conversation Store"]
  FolderService --> FolderRepository["Folder Repository"]
  AssignmentService --> AssignmentRepository["Assignment Repository"]

  FolderRepository --> Storage["Storage Driver"]
  AssignmentRepository --> Storage
  SyncEngine --> SnapshotManager["Storage Snapshot Manager"]
  SnapshotManager --> Storage
  Storage --> ChromeStorage["chrome.storage.local"]
```

## Extension Lifecycle

```mermaid
sequenceDiagram
  participant CS as Content Script
  participant UI as Shadow DOM React UI
  participant WS as Workspace Engine
  participant Sync as Synchronization Engine
  participant Conv as Conversation Engine
  participant Storage as Chrome Storage

  CS->>UI: Create shadow root and render React
  CS->>WS: Start workspace engine
  WS->>Sync: Restore persisted workspace snapshot
  Sync->>Storage: Load snapshot
  Sync->>WS: Rehydrate stores
  WS->>Conv: Start conversation detector
  Conv->>Conv: Observe DOM/history changes
  WS->>UI: Stores update through hooks
```

## Manifest V3 Responsibilities

- `public/manifest.json` defines content scripts, popup, options, background worker, permissions, host matches, and extension CSP.
- `src/background/service-worker.ts` is intentionally minimal until background coordination is needed.
- `src/content/main.tsx` creates the Shadow DOM host, starts the Workspace Engine, and renders the React root.

## Core Engines

### Workspace Engine

Owns application lifecycle, command dispatch, query access, subsystem registration, and cross-feature coordination.

### Conversation Engine

Owns all ChatGPT DOM observation. It centralizes selectors, maps DOM candidates to normalized conversation models, observes navigation/history changes, and prevents UI components from querying the page directly.

### Folder Domain

Owns folder model, validation, repository, service, state, hooks, and folder UI.

### Assignment Domain

Owns normalized conversation-to-folder assignments and emits typed assignment events.

### Synchronization Engine

Owns persistence, snapshot creation, recovery, conflict resolution, sync queues, storage change handling, and UI preference persistence.

### Workspace Explorer

The primary user-facing surface for browsing and organizing conversations. It derives folder tree nodes, conversation lists, active indicators, filters, and workspace counters from Workspace Engine state. It dispatches changes through Workspace Engine commands and uses the Synchronization Engine only for UI preferences such as expanded folders.

### Universal Search Engine

The provider-based search platform for workspace data. It indexes folders, conversations, and assignments today, and is designed for future tags, favorites, notes, summaries, and semantic embeddings.

```mermaid
flowchart TD
  SearchUI["SearchBar / Search Results"] --> SearchHooks["Search Hooks"]
  SearchHooks --> SearchService["Search Service"]
  SearchService --> SearchEngine["Search Engine"]
  SearchEngine --> SearchIndex["Search Index"]
  SearchEngine --> SearchRanking["Search Ranking"]
  SearchEngine --> SearchCache["Search Cache"]
  SearchService --> SearchHistory["Search History"]
  SearchHistory --> SearchRepository["Search Repository"]
  SearchRepository --> Storage["Storage Driver"]

  SearchService --> Providers["Search Providers"]
  Providers --> ConversationProvider["Conversation Provider"]
  Providers --> FolderProvider["Folder Provider"]
  Providers --> AssignmentProvider["Assignment Provider"]
  Providers --> FutureProviders["Future AI / Tags / Notes Providers"]
```

## Search Index Lifecycle

```mermaid
sequenceDiagram
  participant Workspace as Workspace Store
  participant Service as Search Service
  participant Providers as Search Providers
  participant Indexer as Search Indexer
  participant Index as Search Index
  participant Cache as Search Cache

  Workspace->>Service: Workspace state changed
  Service->>Providers: Collect searchable documents
  Providers-->>Indexer: SearchDocument[]
  Indexer->>Index: Replace changed documents
  Index->>Cache: Clear cache when version changes
  Service->>Service: Emit indexUpdated
```

## Search Provider Registration

```mermaid
flowchart LR
  Provider["SearchProvider"] --> Contract["id, type, getDocuments(context)"]
  Contract --> Engine["SearchEngine.registerProvider"]
  Engine --> Indexer["SearchIndexer"]
  Indexer --> Index["SearchIndex"]
  Index --> Ranking["Shared Ranking Pipeline"]
```

## Search Data Flow

```mermaid
flowchart TD
  Query["User Query"] --> SearchBar["SearchBar"]
  SearchBar --> Debounce["Debounced Search Hook"]
  Debounce --> Service["Search Service"]
  Service --> Engine["Search Engine"]
  Engine --> Cache{"Cached?"}
  Cache -- Yes --> Response["Grouped Search Response"]
  Cache -- No --> Ranking["Full Text / Prefix / Fuzzy Ranking"]
  Ranking --> Response
  Response --> UI["Grouped Results and Suggestions"]
  Service --> History["Persisted Search History"]
```

### Quick Action Framework

The central interaction layer for conversations and bulk operations. Actions are supplied by providers and executed through a shared registry/executor pipeline. UI surfaces such as context menus, toolbars, folder pickers, and future command palettes consume the same action framework.

```mermaid
flowchart TD
  UI["ActionMenu / ActionToolbar"] --> Hooks["Action Hooks"]
  Hooks --> Engine["Action Engine"]
  Engine --> Registry["Action Registry"]
  Registry --> Providers["Action Providers"]
  Providers --> DefaultActions["Default Conversation / Utility Actions"]
  Providers --> FutureActions["Future AI / Third-party Actions"]
  Engine --> Executor["Action Executor"]
  Executor --> Permissions["Action Permissions"]
  Executor --> Queue["Action Queue"]
  Executor --> History["Action History"]
  Executor --> Events["Action Events"]
  Executor --> Workspace["Workspace Engine"]
  Executor --> Favorites["Favorite Service"]
```

## Action Lifecycle

```mermaid
sequenceDiagram
  participant User
  participant Menu as Action UI
  participant Engine as Action Engine
  participant Registry as Action Registry
  participant Executor as Action Executor
  participant Domain as Domain Services

  User->>Menu: Open menu or toolbar action
  Menu->>Engine: execute(actionId, targetIds)
  Engine->>Registry: find action for context
  Registry-->>Engine: ActionDefinition
  Engine->>Executor: validate and execute
  Executor->>Domain: run domain operation
  Executor-->>Engine: outcome
  Engine->>Menu: update menu, picker, selection, history
```

## Registry Flow

```mermaid
flowchart LR
  Provider["ActionProvider"] --> Register["ActionRegistry.registerProvider"]
  Register --> Context["ActionContext"]
  Context --> Actions["ActionDefinition[]"]
  Actions --> UI["Context Menu / Toolbar"]
```

## Execution Pipeline

```mermaid
flowchart TD
  Execute["Execute Action"] --> Permission["Permission Check"]
  Permission --> Queue["Action Queue"]
  Queue --> Run["Action.execute(context)"]
  Run --> Outcome{"Outcome"}
  Outcome --> Completed["Completed"]
  Outcome --> FolderPicker["Open Folder Picker"]
  Outcome --> Rename["Open Rename Dialog"]
  Outcome --> Export["Export Placeholder"]
  Completed --> History["Record History"]
  Completed --> Events["Emit Events"]
```

## Selection Flow

```mermaid
flowchart LR
  Checkbox["Checkbox / Shortcut"] --> ActionState["Central Action State"]
  ActionState --> Toolbar["Bulk Action Toolbar"]
  ActionState --> ContextMenu["Context Menu Targets"]
  Toolbar --> Executor["Action Executor"]
  ContextMenu --> Executor
```

## Context Menu Architecture

```mermaid
flowchart TD
  Trigger["Right Click / Menu Key"] --> MenuState["Action Menu State"]
  MenuState --> Actions["Resolved Actions"]
  Actions --> Menu["ARIA Menu"]
  Menu --> Execute["Execute Action"]
  Menu --> Close["Escape / Click Outside"]
```

## Synchronization Flow

```mermaid
flowchart LR
  StoreChange["Runtime Store Change"] --> Coordinator["Sync Coordinator"]
  Coordinator --> Debounce["Debounce"]
  Debounce --> Queue["Sync Queue"]
  Queue --> Snapshot["Create Workspace Snapshot"]
  Snapshot --> Conflict["Recovery / Conflict Resolver"]
  Conflict --> Persist["Persist Snapshot + Direct Keys"]
  Persist --> Storage["Chrome Storage"]
```

## AI Platform

The AI Intelligence Layer is an orchestration platform only. It does not call external AI APIs by default. Future providers implement `AIProvider` and register with the `AIRegistry`; tasks then flow through the same queue, cache, event, history, and settings infrastructure.

```mermaid
flowchart TD
  Hooks["AI Hooks"] --> Service["AI Service"]
  Service --> Engine["AI Engine"]
  Service --> Manager["AI Task Manager"]
  Engine --> Registry["AI Registry"]
  Registry --> Providers["AI Providers"]
  Providers --> OpenAI["OpenAI Future"]
  Providers --> Gemini["Gemini Future"]
  Providers --> Claude["Claude Future"]
  Providers --> Local["Local LLM Future"]
  Manager --> Queue["AI Job Queue"]
  Manager --> History["AI History"]
  Engine --> Cache["AI Response Cache"]
  Engine --> Chunking["AI Chunking Strategy"]
  Engine --> EmbeddingCache["AI Embedding Cache"]
  Engine --> Embeddings["AI Embeddings Placeholder"]
  Engine --> Semantic["AI Semantic Index Placeholder"]
  Service --> Repository["AI Repository"]
  Repository --> Storage["Chrome Storage"]
```

## Provider Flow

```mermaid
sequenceDiagram
  participant Provider as Future AIProvider
  participant Registry as AIRegistry
  participant Service as AIService
  participant Engine as AIEngine

  Provider->>Registry: registerProvider(provider)
  Service->>Engine: executeTask(request, settings)
  Engine->>Registry: getProvider(providerId, taskType)
  Registry-->>Engine: provider or null
  Engine->>Provider: executeTask(request, signal)
  Provider-->>Engine: AIProviderResponse
```

## Task Pipeline

```mermaid
flowchart LR
  Submit["submitTask"] --> Context["Build AIContext"]
  Context --> CacheKey["Create Cache Key"]
  CacheKey --> Queue["Enqueue Job"]
  Queue --> Execute["Execute via AIEngine"]
  Execute --> Cache{"Cached?"}
  Cache -- Yes --> Result["Return Cached Result"]
  Cache -- No --> Provider["Provider Execution"]
  Provider --> History["Record History"]
  Provider --> Store["Update AI State"]
```

## Semantic Pipeline

```mermaid
flowchart TD
  Conversation["Conversation Text Future"] --> Chunking["Fixed Window Chunking Strategy"]
  Chunking --> Embedding["Embedding Provider"]
  Embedding --> Cache["Embedding Cache"]
  Embedding --> Vector["Vector Store Interface"]
  Vector --> SemanticIndex["Semantic Index"]
  SemanticIndex --> Search["Future Semantic Search"]
```

## AI Job Queue

```mermaid
flowchart TD
  Job["AI Job"] --> Priority["Priority Sort"]
  Priority --> Running["Running Slot"]
  Running --> Cancel{"Cancelled?"}
  Cancel -- Yes --> Cancelled["Cancelled"]
  Cancel -- No --> Retry{"Failed and retries remain?"}
  Retry -- Yes --> Running
  Retry -- No --> Completed["Succeeded or Failed"]
  Completed --> Events["AI Events"]
  Completed --> History["AI History"]
```

## Provider-Agnostic Platform

The Provider Platform is the neutral runtime boundary for all current and future AI services. Provider-specific DOM handling, SDK calls, authentication details, rate-limit behavior, streaming quirks, and attachment rules must live inside provider adapters. The rest of the workspace talks to provider interfaces only.

```mermaid
flowchart TD
  UI["Workspace UI / Future Apps"] --> Hooks["Provider Hooks"]
  Hooks --> Engine["Provider Engine"]
  Engine --> Registry["Provider Registry"]
  Engine --> Factory["Provider Factory"]
  Factory --> Modules["Installable Provider Modules"]
  Modules --> Adapters["Provider Adapters"]
  Registry --> Adapters
  Engine --> Lifecycle["Provider Lifecycle"]
  Lifecycle --> Auth["Provider Authentication"]
  Lifecycle --> Sessions["Provider Sessions"]
  Engine --> Capabilities["Provider Capabilities"]
  Engine --> Streaming["Provider Streaming"]
  Engine --> Pipeline["Message Pipeline"]
  Engine --> Cache["Provider Cache"]
  Engine --> Telemetry["Provider Telemetry"]
  Engine --> Events["Provider Events"]
```

## Provider Lifecycle

```mermaid
sequenceDiagram
  participant Module as Provider Module
  participant Factory as Provider Factory
  participant Registry as Provider Registry
  participant Engine as Provider Engine
  participant Auth as Provider Authentication
  participant Session as Provider Session Store

  Module->>Factory: install()
  Factory->>Registry: registerAdapter(adapter)
  Registry-->>Engine: providerRegistered
  Engine->>Auth: authenticate(adapter, context)
  Auth-->>Engine: ProviderSession
  Engine->>Session: upsert(session)
  Engine-->>Registry: providerConnected event
```

## Conversation Flow

```mermaid
flowchart LR
  Workspace["Workspace"] --> Engine["Provider Engine"]
  Engine --> Adapter["Provider Adapter"]
  Adapter --> Conversation["ProviderConversation"]
  Conversation --> History["ProviderHistory"]
  History --> Threads["ProviderThread[]"]
  Threads --> Messages["ProviderMessage[]"]
  Messages --> Attachments["ProviderAttachment[]"]
  Messages --> Pipeline["Incoming Message Pipeline"]
```

## Streaming Flow

```mermaid
flowchart TD
  Request["Streaming Request"] --> Stream["Provider Streaming"]
  Stream --> Start["Start"]
  Start --> Chunks["Chunk Events"]
  Chunks --> Pause{"Pause?"}
  Pause -- Yes --> Paused["Paused"]
  Paused --> Resume["Resume"]
  Resume --> Chunks
  Pause -- No --> Complete{"Complete?"}
  Complete -- Yes --> Finished["Finished Event"]
  Complete -- No --> Cancel{"Cancel?"}
  Cancel -- Yes --> Cancelled["Cancelled"]
  Cancel -- No --> Error["Error Event"]
```

## Plugin Architecture

```mermaid
flowchart TD
  Plugin["Platform Plugin"] --> Registry["Plugin Registry"]
  Registry --> Provider["AI Provider Plugin"]
  Registry --> Exporter["Exporter Plugin"]
  Registry --> Search["Search Provider Plugin"]
  Registry --> Theme["Theme Plugin"]
  Registry --> Automation["Automation Plugin"]
  Registry --> Actions["Custom Action Plugin"]
```

## Capability Detection

```mermaid
flowchart LR
  Adapter["Provider Adapter"] --> Capabilities["ProviderCapabilities"]
  Capabilities --> Streaming["Streaming"]
  Capabilities --> Vision["Vision"]
  Capabilities --> Upload["PDF / File Upload"]
  Capabilities --> Voice["Voice"]
  Capabilities --> Tools["Tool Calling / MCP"]
  Capabilities --> UI["Adaptive UI"]
```

## Data Ownership

- Folders: `src/features/folders`.
- Conversations: `src/features/conversations`.
- Assignments: `src/features/assignments`.
- Favorites: `src/features/favorites`.
- Quick actions: `src/features/actions`.
- Search: `src/features/search`.
- AI Intelligence: `src/features/ai`.
- Provider platform: `src/platform/providers`.
- Plugin platform: `src/platform/plugins`.
- Workspace runtime: `src/app/workspace`.
- Persistence and UI preferences: `src/app/synchronization`.

## Dependency Rules

- UI may depend on hooks and shared UI components.
- Workspace Explorer must derive state from Workspace Engine state rather than creating a parallel store.
- Search providers must expose normalized documents through the Search Engine instead of coupling search to individual UI features.
- Future quick actions must register through an ActionProvider instead of being hardcoded into the Explorer.
- Future AI providers must implement `AIProvider`; provider-specific SDK logic must not leak into UI, search, actions, or workspace engines.
- Future AI services must also implement provider adapters before integrating with shared workspace surfaces.
- Provider-specific authentication, streaming, attachments, and rate-limit behavior must remain inside adapter modules.
- Hooks may depend on services and stores.
- Services may depend on repositories, events, validation, and stores.
- Repositories may depend on storage interfaces.
- Storage adapters may depend on Chrome APIs.
- Conversation detection may access ChatGPT DOM.
- No UI module may query ChatGPT DOM or Chrome Storage directly.
