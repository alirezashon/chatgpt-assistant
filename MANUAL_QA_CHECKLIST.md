# Manual QA Checklist

Run this checklist before sharing a beta build or submitting to the Chrome Web Store.

## Install And Launch

- [ ] Run `npm run check`.
- [ ] Run `npm run test:e2e`.
- [ ] Load `dist/` as an unpacked Chrome extension.
- [ ] Confirm the extension appears in `chrome://extensions`.
- [ ] Open `https://chatgpt.com/`.
- [ ] Confirm the floating workspace button appears.

## Sidebar Workflow

- [ ] Open the sidebar.
- [ ] Confirm onboarding appears for a fresh local profile.
- [ ] Dismiss onboarding and confirm it stays dismissed after refresh.
- [ ] Create a folder.
- [ ] Rename the folder.
- [ ] Reorder folders.
- [ ] Delete a folder.
- [ ] Open an existing ChatGPT conversation.
- [ ] Assign the current conversation to a folder.
- [ ] Remove the conversation from the folder.
- [ ] Confirm assignment state persists after tab reload.

## Workspace Tools

- [ ] Search visible conversations with `Ctrl/Cmd+K`.
- [ ] Select visible conversations with `Ctrl/Cmd+A`.
- [ ] Use the action menu on a selected conversation.
- [ ] Export Markdown for a selected conversation.
- [ ] Mark and unmark a favorite conversation.
- [ ] Confirm empty-state guidance appears on a new chat page.

## Settings

- [ ] Open Settings from the sidebar.
- [ ] Confirm Free Local does not require sign-in.
- [ ] Confirm Pro prompts appear only around paid/future paid features.
- [ ] Review release notes.
- [ ] Review privacy promises.
- [ ] Review keyboard shortcuts.
- [ ] Export local diagnostics.
- [ ] Clear local diagnostics.
- [ ] Export a local backup.
- [ ] Import the local backup into a clean profile.
- [ ] Reset settings.

## Failure States

- [ ] Confirm workspace errors render as a visible alert.
- [ ] Confirm ChatGPT DOM detection failures render a clear conversation detection alert.
- [ ] Confirm local backup import rejects invalid JSON.

## Release Notes

- [ ] Update `CHANGELOG.md`.
- [ ] Update `src/constants/release-notes.ts`.
- [ ] Update `PRIVACY_POLICY.md` if privacy behavior changed.
- [ ] Update `SUPPORT.md` if support links changed.
- [ ] Run `npm run store:assets`.
- [ ] Review `STORE_LISTING.md`.
