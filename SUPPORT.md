# Support

Use this document as the local beta support guide until the Chrome Web Store listing has a public support URL.

## Before Asking For Help

- Confirm the extension was loaded from the latest `dist/` folder.
- Reload the extension from `chrome://extensions`.
- Reload the open ChatGPT tab.
- Check the options page for the current version and release notes.
- Export a local backup before testing destructive actions.
- Export local diagnostics from Settings if the issue involves a visible failure or crash.

## Useful Details To Include

- Extension version.
- Chrome version.
- ChatGPT URL where the issue happened.
- What you expected to happen.
- What actually happened.
- Whether the sidebar showed a workspace or conversation detection error.
- Whether a local diagnostic export is available.

## Current Support Links

- In-app support draft: open Settings and use the support mail link.
- Privacy policy: `PRIVACY_POLICY.md`.
- Manual QA checklist: `MANUAL_QA_CHECKLIST.md`.

## Store Submission Follow-Up

Before public release, add the final support email address and Chrome Web Store support URL here and in `src/constants/support-links.ts`.
