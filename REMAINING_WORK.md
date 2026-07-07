# Remaining Work

This file tracks the work left to turn ChatGPT Workspace from a local-first
extension foundation into a beta-ready and eventually paid product.

## Product Decisions

- Define the free plan feature set.
- Define the paid plan feature set.
- Decide whether the first paid launch is subscription-only or supports lifetime licenses.
- Decide whether billing is owned by a custom backend, Stripe Billing, Lemon Squeezy, or Chrome Web Store payments if available for the target market.
- Choose the first supported premium AI provider flow: user API key, hosted API, or both.
- Define privacy promises for local-only data, cloud sync, and AI processing.

## Free Plan

- Keep local folder management free.
- Keep conversation assignment to folders free.
- Keep basic search free.
- Keep favorites free.
- Keep local-only persistence free.
- Add a usable settings screen for local preferences.
- Add onboarding after the extension is installed.
- Add empty-state guidance when no conversations are detected.
- Add an import/export backup for local workspace data.

## Paid Plan Ideas

- AI summaries for selected conversations.
- AI-generated folder suggestions.
- Duplicate or stale conversation detection.
- Smart cleanup suggestions.
- Semantic search across conversation history.
- Tags and auto-tags.
- Markdown export.
- PDF export.
- Batch export.
- Cross-device cloud sync.
- Workspace backup and restore.
- Prompt library and reusable prompt snippets.
- Advanced bulk actions.
- Multi-provider workspace support for Claude, Gemini, Grok, Perplexity, and local LLMs.
- Team or agency workspaces later, after the solo product is stable.

## Monetization Infrastructure

- Add account identity.
- Add login/logout UI.
- Add a secure backend API.
- Add subscription status lookup.
- Add plan entitlement model.
- Add feature gates in the extension.
- Add billing portal link.
- Add upgrade prompts for locked premium actions.
- Add license refresh and offline grace-period behavior.
- Add secure token storage policy.
- Add cancellation and expired-plan handling.

## Extension UX

- Build a real options/settings page.
- Enable the disabled Settings button in the sidebar.
- Add plan/account section to settings.
- Add premium badges or locked states without making the free UI feel broken.
- Add clear error states for ChatGPT DOM detection failures.
- Add a first-run onboarding panel.
- Add release/version notes.
- Add keyboard shortcut documentation inside settings.

## Core Feature Completion

- Implement real export providers instead of placeholders.
- Implement tags.
- Implement durable rename behavior or make rename explicitly local-only.
- Improve cross-tab conflict handling.
- Add storage schema migrations.
- Add undo/redo or recovery history for destructive actions.
- Strengthen conversation detection against ChatGPT UI changes.
- Add bundle-size reporting.

## AI and Provider Work

- Add production provider adapters.
- Add explicit AI enablement settings.
- Add provider key management if user-owned API keys are supported.
- Move long-running AI jobs out of the content-script runtime.
- Add retry, cancellation, and rate-limit UI for AI jobs.
- Add local cache inspection and cache clearing controls.
- Add privacy copy before any external AI processing.

## Release Readiness

- Prepare Chrome Web Store listing assets.
- Write store description and privacy disclosure.
- Add a privacy policy.
- Add support/contact links.
- Add changelog.
- Add production build checklist.
- Add manual QA checklist.
- Add crash/error reporting only after privacy review.

## Suggested Priority After Test Foundation

1. Build the real settings page and wire the sidebar Settings button.
2. Add entitlement and feature-gate primitives locally, before adding billing.
3. Implement Markdown export as the first premium-shaped feature.
4. Add storage migrations before changing persisted data.
5. Add Playwright extension smoke tests for install, sidebar open, folder create, assign, and reload persistence.
6. Add onboarding and upgrade prompts.
7. Add backend, account, and billing only after the free local flow feels stable.
