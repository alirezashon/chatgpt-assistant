# Product UX Reboot Phase 1

## Audit

The current popup, sidebar, and options experience do not explain the product within three seconds. The popup behaves like a generic extension control panel with three abstract buttons: command palette, sidebar, and options. It does not show contextual actions, page understanding, recent work, pinned workflows, or the product's primary promise. The version label takes prime space, while user value is hidden behind another click.

The sidebar is a placeholder workspace with explanatory copy rather than a workspace. It does not show a selected action, task progress, artifacts, memory, knowledge, history, or workflow status. It reads as scaffolding instead of a product surface.

The options page is appropriately minimal, but the product has no clear settings shortcut language from the popup. Settings are presented as one of three equal primary actions, which overemphasizes configuration and weakens the action-first model.

The command palette and floating toolbar are closer to the desired product direction, but they are disconnected from the extension's first impression. Users can access powerful surfaces only if they already understand the product.

The primary UX problems are:

- Weak first impression: the product says “foundation” instead of “AI command layer for this page.”
- Poor hierarchy: settings and sidebar compete with primary AI actions.
- Missing context awareness in the popup.
- No visible quick actions, pinned actions, or recent actions.
- Sidebar has no concrete workspace responsibility.
- Navigation is surface-first instead of workflow-first.
- Feature discovery depends on prior knowledge of keyboard shortcuts.
- Visual system is minimal but too plain to feel premium.

## Product Definition

An AI command layer that understands the current page and helps users act on it instantly.

## Five Primary Jobs

1. Ask AI about the current page or selected content.
2. Summarize, explain, rewrite, translate, or extract information from the current context.
3. Run high-value site-specific actions such as reviewing GitHub PRs or summarizing YouTube videos.
4. Save useful context to memory, notes, knowledge, or workflow history.
5. Continue longer tasks in a focused sidebar workspace with progress and artifacts.

## Redesigned Information Architecture

- Popup: action launchpad. Shows context, quick actions, pinned actions, recent actions, and settings shortcut.
- Sidebar: workspace after action selection. Shows active task, conversation, progress, artifacts, memory, knowledge, history, and workflow status.
- Command Palette: keyboard-first universal command search and execution.
- Context Menu: right-click contextual action entry point.
- Floating Toolbar: selected-text action surface.
- Settings: provider, privacy, shortcut, and runtime preferences only.
- History: completed actions and generated artifacts.
- Memory: saved facts, preferences, and reusable context.
- Knowledge: indexed documents and page captures.
- Workflows: multi-step automation status and reusable workflows.
- Chat: only as an action-specific workspace thread, never the homepage.
- Recent: latest actions surfaced in popup and sidebar.
- Favorites: pinned actions surfaced in popup and command palette.

## Validation Criteria

- The popup communicates the product promise in one glance.
- Every visible control is an action or clear secondary utility.
- Context-specific actions appear before generic actions.
- The sidebar contains work, not navigation chrome.
- Settings are accessible but never visually primary.
- Dark mode feels premium and readable at Chrome popup scale.
