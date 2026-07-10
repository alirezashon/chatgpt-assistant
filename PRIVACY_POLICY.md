# Privacy Policy

Last updated: 2026-07-10

ChatGPT Workspace is a local-first Chrome extension for organizing ChatGPT conversations.

## Current Data Handling

- Workspace folders, assignments, favorites, settings, local backups, and Markdown exports are stored locally in Chrome storage.
- The extension does not require an account for the Free Local plan.
- The extension does not currently send workspace data to a backend service.
- The extension does not currently run external AI provider calls.
- Local diagnostic reports are stored only in Chrome storage and are not uploaded automatically.
- Local backup files are created by the user and saved through the browser download flow.

## Future Paid Features

Future Pro features may include cloud sync, hosted AI processing, billing, and account identity. These features must be opt-in before any local workspace content is sent outside the browser.

## Data Not Included In Local Backups

Local backup export intentionally excludes account entitlement state, AI provider settings, and local diagnostic reports. This keeps payment/account metadata, future provider secrets, and troubleshooting logs out of portable workspace backup files.

## Diagnostics

The extension can keep a small, bounded local history of extension errors to help troubleshoot beta issues. Users can export or clear diagnostics from Settings. Diagnostic bundles are generated locally and should be reviewed before sharing.

## Permissions

The extension runs on ChatGPT pages so it can detect conversation URLs and inject the workspace sidebar. Permission scope should be reviewed before each Chrome Web Store submission.

## Contact

For support, use the support instructions in `SUPPORT.md` until a public support address and Chrome Web Store support URL are finalized.
