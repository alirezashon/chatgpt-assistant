# ChatGPT Workspace Coding Standards

## Purpose

This document defines the engineering rules for ChatGPT Workspace. It is the source of truth for how code should be written, reviewed, tested, and maintained.

## Core Engineering Principles

- Keep business logic outside UI components.
- Prefer composition over inheritance.
- Keep functions pure whenever possible.
- Isolate ChatGPT DOM access.
- Isolate Chrome API access.
- Validate data crossing runtime boundaries.
- Make storage migrations explicit and testable.
- Optimize for clarity before cleverness.
- Build for future features without over-engineering the MVP.

## Naming Conventions

### General

- Use descriptive names.
- Avoid abbreviations unless they are widely understood.
- Use domain language consistently: `Chat`, `Folder`, `Tag`, `Favorite`, `ConversationSnapshot`.

### Types And Interfaces

- Use `PascalCase`.
- Prefer meaningful domain names.
- Avoid vague names such as `Data`, `Info`, `Manager`, or `Helper`.

Examples:

- `Folder`
- `ChatSummary`
- `SearchDocument`
- `ConversationSnapshot`
- `FolderRepository`

### Functions And Variables

- Use `camelCase`.
- Function names should describe behavior.

Examples:

- `createFolder`
- `assignChatToFolder`
- `toggleFavorite`
- `buildSearchDocument`

### Constants

- Use `SCREAMING_SNAKE_CASE` for global constants.
- Use `camelCase` for local constants.

## Folder Naming

- Use kebab-case for folders.
- Feature folders should be named after product capabilities.

Examples:

- `features/folders`
- `features/favorites`
- `features/search`
- `chatgpt-dom-adapter`

## File Naming

- Use kebab-case for file names.
- React component files may use `PascalCase.tsx` if the project standardizes on component-name files.
- Test files should use `.test.ts` or `.test.tsx`.

Examples:

- `folder-service.ts`
- `folder-repository.ts`
- `message-router.ts`
- `FolderPanel.tsx`
- `folder-service.test.ts`

## TypeScript Rules

- Enable strict TypeScript mode.
- Never use `any`.
- Prefer `unknown` over `any` when a value must be narrowed.
- Use explicit return types for exported functions.
- Use discriminated unions for message types and state machines.
- Use readonly types where mutation is not intended.
- Avoid non-null assertions unless justified by a nearby guard.
- Do not silence compiler errors with broad casts.
- Runtime data must be validated with schemas before being trusted.

Forbidden:

- `any`
- Broad `as` casts without validation.
- `// @ts-ignore` without documented justification.
- Untyped runtime messages.

## React Rules

- Keep components focused and small.
- Keep components under 300 lines.
- Components should render UI, not own domain rules.
- Use props for explicit data flow.
- Use composition for complex UI.
- Extract repeated UI patterns into reusable components.
- Use error boundaries around major UI surfaces.
- Avoid unnecessary re-renders with stable props and memoization where useful.

Forbidden:

- Direct Chrome API calls inside React components.
- Direct ChatGPT DOM queries inside React components.
- Large components with mixed UI, state, storage, and business logic.
- Business rules embedded in JSX.

## Hook Rules

- Hooks should have one responsibility.
- Feature hooks may coordinate UI state and message calls.
- Hooks should not hide complex business rules that belong in services.
- Hooks must follow React's rules of hooks.
- Async hooks should expose loading, success, and error states.

Examples:

- `useFolders`
- `useTags`
- `useCurrentChat`
- `useExportConversation`

## Component Rules

- Presentational components receive data through props.
- Container components may connect hooks to presentational components.
- Component names should match their responsibility.
- Avoid deeply nested component trees when composition can simplify them.
- Accessibility attributes must be included for interactive controls.

## State Management Rules

Use two categories of state:

### Persisted State

Persisted state includes folders, tags, favorites, chat metadata, assignments, settings, and indexed content. It belongs in repositories and storage-backed services.

### UI State

UI state includes open panels, selected filters, modal state, loading indicators, and temporary form values. It may live in React state or Zustand.

Rules:

- Do not store durable application data only in React state.
- Do not duplicate persisted state in multiple stores without a sync plan.
- Keep derived state derived when possible.
- Prefer small focused stores over one global store for everything.

## Tailwind Rules

- Use Tailwind for styling extension UI.
- Prefer utility classes for layout and spacing.
- Extract repeated class combinations into components, not arbitrary global CSS.
- Avoid one-off visual hacks.
- Use consistent spacing, color, border radius, and typography scales.
- Ensure UI remains readable in ChatGPT light and dark contexts if supported.
- Do not let extension styles leak into the host page.

## Import Ordering

Imports should be ordered consistently:

1. React and framework imports.
2. Third-party libraries.
3. Shared types and utilities.
4. Domain modules.
5. Feature modules.
6. Infrastructure modules.
7. Local relative imports.
8. Styles.

Rules:

- Prefer path aliases for cross-folder imports.
- Avoid deep imports across feature internals.
- Avoid circular dependencies.

## Error Handling

- Use typed application errors for expected failures.
- Return structured error responses across runtime messages.
- Show user-friendly errors in UI.
- Log technical details only where useful for debugging.
- Never swallow errors silently.
- Storage errors should include operation context.
- Export errors should leave the UI recoverable.

## Logging

- Keep logs minimal in production.
- Use structured log helpers if logging becomes common.
- Do not log sensitive conversation content.
- Do not log personal data.
- Debug logs should be removable or gated.

## Performance

- Avoid blocking the ChatGPT page.
- Debounce expensive DOM observation work.
- Batch storage writes where practical.
- Avoid full re-indexing unless necessary.
- Use IndexedDB for large conversation snapshots and search documents.
- Do not keep large conversation content in long-lived memory.
- Measure before optimizing complex UI.

## Accessibility

- All interactive controls must be keyboard accessible.
- Buttons must have accessible names.
- Modals must manage focus.
- Color should not be the only state indicator.
- Text contrast must be sufficient.
- Use semantic HTML where possible.
- Support reduced motion preferences if animations are added.

## Security

- Request minimal permissions.
- Never inject remote scripts.
- Do not use `eval`.
- Validate runtime messages.
- Treat ChatGPT DOM content as untrusted.
- Escape generated Markdown and PDF content where needed.
- Do not store secrets in extension storage.
- Do not transmit conversation content in the MVP.
- Keep Content Security Policy strict.

## Testing Strategy

### Unit Tests

Required for:

- Domain services.
- Storage migrations.
- Search document creation.
- Export formatting.
- Message validation.

### Integration Tests

Required for:

- Repository behavior.
- Background message routing.
- Content-to-background communication where practical.

### Browser Tests

Recommended for:

- Extension mounting.
- ChatGPT navigation detection.
- Export flows.
- Search UI behavior.

### Manual QA

Required before release:

- Install unpacked extension.
- Open ChatGPT.
- Create folders.
- Assign chats.
- Toggle favorites.
- Add and remove tags.
- Search known conversations.
- Export Markdown.
- Export PDF.
- Refresh ChatGPT and verify persistence.

## Git Commit Convention

Use Conventional Commits:

- `feat: add folder assignment service`
- `fix: handle missing chat title`
- `docs: add architecture documentation`
- `test: cover search indexing`
- `refactor: isolate chrome storage adapter`
- `chore: update build tooling`

Commit messages should describe the user-facing or engineering outcome.

## Code Review Checklist

Reviewers should verify:

- The change matches the requested scope.
- Business logic is outside UI components.
- Chrome APIs are accessed through infrastructure wrappers.
- ChatGPT DOM selectors are isolated.
- Runtime messages are typed and validated.
- Storage changes include migrations when needed.
- Tests cover important behavior.
- No sensitive data is logged.
- Permissions are not expanded unnecessarily.
- Components remain focused and maintainable.
- The UI remains accessible and responsive.

## Forbidden From Day One

- Never use `any`.
- Never duplicate significant code.
- Never create components over 300 lines.
- Never put business logic inside UI components.
- Never call Chrome APIs directly from arbitrary modules.
- Never query ChatGPT DOM outside the DOM adapter.
- Never store all data in one giant JSON object.
- Never mutate persisted data without a migration strategy.
- Never assume the background service worker is always alive.
- Never request unnecessary permissions.
- Never transmit user conversation content in the MVP.
- Never add authentication, payments, analytics, or cloud sync to the MVP.
- Never introduce a backend dependency for local organization features.
- Never ignore accessibility for interactive UI.
