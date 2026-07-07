# ChatGPT Workspace Roadmap

## Roadmap Principles

- Ship a useful local-first MVP before adding AI or cloud features.
- Build foundations before user-facing complexity.
- Keep each milestone independently testable.
- Avoid committing to backend or account architecture during MVP.
- Prioritize reliability on the ChatGPT website.

## Milestone 1: Project Bootstrap

### Goal

Create the technical foundation for a production-ready Manifest V3 Chrome Extension.

### Deliverables

- Vite, TypeScript, React, and Tailwind CSS setup.
- Manifest V3 configuration.
- Background service worker entry.
- Content script entry.
- Basic injected React root.
- Popup and options page placeholders if needed.
- Path aliases and strict TypeScript configuration.
- Linting, formatting, and testing setup.
- Initial folder structure matching `ARCHITECTURE.md`.

### Estimated Complexity

Medium

## Milestone 2: ChatGPT Integration And Sidebar Surface

### Goal

Integrate safely with the ChatGPT website and establish the extension UI surface.

### Deliverables

- ChatGPT page detection.
- Content script mounting strategy.
- Isolated extension root container.
- SPA navigation detection.
- ChatGPT DOM adapter for active conversation ID, title, URL, and basic metadata.
- Mutation observers with cleanup.
- Resilient selector strategy.
- Basic workspace sidebar or panel UI.

### Estimated Complexity

High

## Milestone 3: Folder System

### Goal

Allow users to create folders and assign conversations to folders.

### Deliverables

- Folder domain model.
- Folder repository.
- Create, rename, delete, and list folder operations.
- Assign and unassign chat operations.
- Folder filtering in the UI.
- Storage schema and migration baseline.
- Tests for folder rules and persistence.

### Estimated Complexity

Medium

## Milestone 4: Favorites

### Goal

Allow users to quickly mark and find important conversations.

### Deliverables

- Favorite state model.
- Toggle favorite operation.
- Favorite filter.
- Favorite indicator in the injected UI.
- Persisted favorite state.
- Tests for favorite toggling and filtering.

### Estimated Complexity

Low

## Milestone 5: Tags

### Goal

Support flexible classification of conversations across folders.

### Deliverables

- Tag domain model.
- Create, rename, delete, and list tag operations.
- Assign and remove tags from chats.
- Tag picker UI.
- Tag-based filtering.
- Validation for duplicate tag names.
- Tests for tag operations and data integrity.

### Estimated Complexity

Medium

## Milestone 6: Export

### Goal

Allow users to export conversations as Markdown and PDF.

### Deliverables

- Conversation snapshot model.
- Message extraction through ChatGPT DOM adapter.
- Markdown export formatter.
- PDF export formatter.
- Download integration.
- Export progress and error states.
- Handling for long conversations and code blocks.
- Tests for Markdown formatting and export edge cases.

### Estimated Complexity

High

## Milestone 7: Search

### Goal

Provide better local search across organized conversations.

### Deliverables

- Search document model.
- Local search index using IndexedDB and a search library.
- Indexing of titles, URLs, folder names, tags, and available conversation text.
- Search UI with filters.
- Result ranking and highlighting where practical.
- Incremental index updates when conversation snapshots change.
- Tests for search indexing and query behavior.

### Estimated Complexity

High

## Milestone 8: Polish And Production Readiness

### Goal

Prepare the MVP for real users.

### Deliverables

- Error boundaries.
- Empty states.
- Loading states.
- Permission review.
- Accessibility pass.
- Performance review on large chat histories.
- Storage migration tests.
- Manual QA checklist.
- Chrome Web Store asset planning.
- Privacy policy draft.
- Release build process.

### Estimated Complexity

Medium

## Post-MVP Roadmap

### Phase 2: Local Power Features

- Data import/export.
- Bulk folder and tag operations.
- Advanced filters.
- Keyboard shortcuts.
- Backup and restore.

### Phase 3: AI Features

- AI conversation summaries.
- AI search.
- Semantic search.
- Topic clustering.
- Suggested folders and tags.

### Phase 4: Cloud And Accounts

- User accounts.
- Cloud sync.
- Cross-device sync.
- Workspace backup.
- Conflict resolution.

### Phase 5: Business Model

- Stripe subscriptions.
- Free and paid tiers.
- Usage limits for AI features.
- Team workspaces.

### Phase 6: Analytics And Growth

- Privacy-conscious product analytics.
- Reliability monitoring.
- Feature usage insights.
- Onboarding optimization.
