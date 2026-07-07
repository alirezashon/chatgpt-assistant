# Coding Standards

## Core Rules

- Use strict TypeScript.
- Never use `any`.
- Prefer explicit domain types over loose records.
- Keep business logic outside visual components.
- Keep Chrome APIs behind adapters.
- Keep ChatGPT DOM access inside content/conversation infrastructure.
- Prefer composition over inheritance.
- Keep pure functions pure whenever practical.
- Avoid hidden global state except approved stores and engine singletons.

## File and Folder Naming

- Use kebab-case for files.
- Use PascalCase for React components.
- Use feature-first organization for domain code.
- Keep shared utilities in `shared`, `state`, `storage`, or `constants` only when truly cross-cutting.

## React Rules

- Components should be small and view-focused.
- Components should not perform persistence directly.
- Hooks may coordinate state and services.
- Use `useSyncExternalStore` for external stores.
- Memoize derived collections that are passed to memoized child components.
- Effects must clean up listeners, subscriptions, observers, and timers.

## Service and Repository Rules

- Services own business rules.
- Repositories own persistence mechanics.
- UI must call hooks, not repositories.
- Repositories must validate storage values before returning them.
- Services should be dependency-injection friendly.

## Styling Rules

- Use Tailwind utilities.
- Use design tokens for extension dimensions, timings, and future theme variables.
- Respect reduced-motion preferences.
- Maintain visible focus states.
- Avoid nested decorative card structures.

## Security Rules

- Do not use `dangerouslySetInnerHTML`.
- Do not use `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, or `new Function`.
- Do not store secrets, tokens, passwords, refresh tokens, or API secrets in extension storage.
- Treat Chrome Storage as untrusted input.
- Keep permissions minimal.
- Validate external or URL-like values before use.
- Keep AI provider SDKs behind the `AIProvider` interface.
- Keep provider service integrations behind `ProviderAdapter`.
- Never send conversation content to an AI provider without explicit user action and enabled AI settings.

## Error Handling

- Use domain-specific errors for expected business failures.
- Convert unknown errors at boundaries.
- Keep user-facing error messages concise.
- Log structured context without secrets or personal data.

## Logging

- Use the centralized logger.
- Do not log secrets or raw private conversation content.
- Debug logging must be gated by settings.
- Future remote logging must be opt-in and privacy reviewed.

## Accessibility

- Buttons require accessible labels when icon-only.
- Dialogs require accessible names and focus management.
- Menus require keyboard support and visible focus states.
- Prefer semantic elements before ARIA.
- Support reduced motion and high-contrast readiness.

## Testing Strategy

- Unit-test pure validation, mapping, selectors, repositories, services, and conflict resolution.
- Integration-test engine lifecycle and persistence restore flows.
- UI-test critical workflows with keyboard navigation.
- Keep DOM detection testable through injected document/window dependencies.

## Git and Review

- Use focused commits.
- Run `npm run check` before review.
- Review for data ownership, cleanup, storage validation, and user privacy.
- Reject changes that bypass architecture layers without a clear documented reason.

## Forbidden

- Direct Chrome Storage access from UI.
- Direct ChatGPT DOM queries from UI.
- Unbounded observers or listeners without cleanup.
- New user-facing features without domain/service boundaries.
- Duplicated validation rules in UI.
- Large components that mix rendering, side effects, and business rules.
- Provider-specific AI logic outside `src/features/ai`.
- Provider-specific workspace/platform logic outside provider adapter modules.
