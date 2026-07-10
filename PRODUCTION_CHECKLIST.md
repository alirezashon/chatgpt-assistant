# Production Build Checklist

Use this checklist before packaging or submitting a Chrome Web Store build.

## Code Health

- [ ] Run `npm run check`.
- [ ] Run `npm run test:e2e`.
- [ ] Run `npm run build`.
- [ ] Run `npm run bundle:size` and review large assets.
- [ ] Confirm `dist/manifest.json` has the expected permissions and matches.

## Extension Behavior

- [ ] Load `dist/` as an unpacked extension in Chrome.
- [ ] Open `https://chatgpt.com/` and verify the floating workspace button appears.
- [ ] Open the sidebar and create, rename, reorder, and delete a folder.
- [ ] Open an existing ChatGPT conversation and assign it to a folder.
- [ ] Verify assignment persists after reloading the ChatGPT tab.
- [ ] Verify search, favorites, Markdown export, local backup export, and local backup import.
- [ ] Verify the options page opens from the sidebar settings button.

## Privacy And Product Copy

- [ ] Confirm settings still say Free Local does not require an account.
- [ ] Confirm privacy promises mention local-only data, future cloud sync, and explicit AI processing.
- [ ] Confirm Pro prompts appear only around paid or future paid features.
- [ ] Confirm no account, billing, backend, cloud sync, or AI provider call is enabled in this build.

## Store Readiness

- [ ] Update `CHANGELOG.md`.
- [ ] Update release notes in `src/constants/release-notes.ts`.
- [ ] Review Chrome Web Store description and screenshots.
- [ ] Review privacy policy and support/contact links before submission.
