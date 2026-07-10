# Chrome Web Store Listing Draft

Use this draft for the beta listing. Replace placeholder support and privacy URLs with the final
public URLs before submission.

## Name

ChatGPT Workspace

## Short Description

Organize ChatGPT conversations with local folders, favorites, search, exports, and backups.

## Detailed Description

ChatGPT Workspace adds a local-first organization layer to ChatGPT. It helps you keep important
conversations findable without forcing an account or cloud sync for the free workflow.

Current beta features:

- Local folders for ChatGPT conversations.
- Conversation assignment and favorites.
- Sidebar search and selection workflows.
- Markdown export for selected conversations.
- Local backup and restore.
- Release notes, privacy promises, shortcuts, and support links in Settings.
- Local diagnostic export for troubleshooting, with no automatic upload.

Free Local does not require sign-in. Future paid features may add opt-in AI summaries, richer
exports, cloud sync, priority support, and team workflows.

## Category

Productivity

## Single Purpose

ChatGPT Workspace helps users organize, search, export, and locally back up their ChatGPT
conversation workspace.

## Permission Justification

- `storage`: stores folders, assignments, favorites, settings, backups, and local diagnostics in
  Chrome storage.
- Host access for `https://chatgpt.com/*` and `https://chat.openai.com/*`: injects the workspace
  sidebar and detects visible ChatGPT conversation context.

## Privacy Disclosure

The current beta is local-first. Workspace folders, assignments, favorites, settings, and diagnostic
reports are stored in Chrome storage on the user's browser. The extension does not require an
account for Free Local, does not send workspace data to a backend service, does not run external AI
provider calls, and does not automatically upload crash reports or analytics.

Users can manually export local backups and local diagnostic bundles. Users should review exported
files before sharing them.

Future paid features such as account sync, hosted AI processing, billing, and priority support must
be opt-in and reviewed before any local workspace content is sent outside the browser.

## Store Assets

Run `npm run store:assets` to generate:

- `public/icons/icon-16.png`
- `public/icons/icon-32.png`
- `public/icons/icon-48.png`
- `public/icons/icon-128.png`
- `store-assets/icon-128.png`
- `store-assets/promo-tile-440x280.png`
- `store-assets/screenshot-sidebar-1280x800.png`
- `store-assets/screenshot-settings-1280x800.png`

## Submission Blockers

- Add final public support email.
- Add final hosted privacy policy URL.
- Replace generated screenshots with real Chrome Web Store screenshots once the beta UI is final.
