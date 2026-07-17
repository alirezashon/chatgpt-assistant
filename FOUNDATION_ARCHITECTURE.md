# AI Productivity Layer Foundation

This project is a production-grade Chrome Extension Manifest V3 foundation for a contextual AI
productivity layer across the web. It is command-first: popup, sidebar, content overlays, context
menus, and keyboard shortcuts are surfaces over the same command and context architecture.

## Folder Responsibilities

`src/background`

- Owns privileged Chrome APIs: context menus, keyboard commands, side panel, tab messaging, and
  extension lifecycle.
- Never imports React UI.
- Routes work through typed messages and command IDs.

`src/content`

- Runs inside web pages.
- Observes cheap page signals such as selection and focused element.
- Creates isolated Shadow DOM mount slots for future command palette, floating toolbar, selection
  toolbar, and inline result surfaces.
- Does not call AI providers or store secrets.

`src/popup`

- Lightweight launcher surface.
- Opens the command palette, sidebar, and options page.
- Should never become the primary product surface.

`src/sidebar`

- Durable surface for longer workflows such as summaries, review output, citations, and multi-step
  tasks.
- Receives command results through the shared runtime/store architecture.

`src/options`

- Minimal extension configuration.
- Keep it shallow: provider setup, privacy controls, shortcuts, and site permissions only.

`src/features`

- Feature-first business modules.
- Each feature owns its types, registry, services, hooks, tests, and optional feature-specific UI.
- Cross-feature communication should happen through public feature exports, not deep imports.

Current foundation feature contracts:

- `features/commands`: command IDs, definitions, invocation, output modes.
- `features/context`: page context snapshots and cheap context extraction.
- `features/ai-provider`: future provider interface only; no provider implementation yet.
- `features/surfaces`: shared surface IDs and state types.

`src/lib`

- Framework-independent platform services.
- Chrome API wrappers, runtime config, storage abstraction, typed message bus, and error utilities.
- May be used by background, content, popup, sidebar, options, and features.

`src/providers`

- React application providers shared by extension pages.
- Currently owns TanStack Query and toast provider setup.
- Content overlays can use this later when React surfaces are mounted into Shadow DOM slots.

`src/store`

- Global client state with Zustand.
- Keep it UI/runtime state only. Persisted data belongs in storage abstractions or repositories.

`src/hooks`

- Shared React hooks that are not feature-specific.
- Feature-specific hooks belong in `src/features/<feature>`.

`src/components`

- Shared presentation primitives only.
- No Chrome APIs, AI calls, storage calls, or page observers.

`src/constants`

- Stable IDs and product-wide constants.
- Command IDs, context menu IDs, storage keys, and app metadata live here.

`src/utils`

- Small pure utilities.
- No Chrome APIs, React state, DOM observers, or feature knowledge.

`src/styles`

- Global CSS imported by extension pages.
- Content-script UI should use Shadow DOM styles to avoid leaking into host pages.

`src/types`

- Ambient and global TypeScript declarations.

`public`

- Static extension assets and `manifest.json`.

## Dependency Direction

Use this direction:

```txt
entrypoints -> features -> lib -> constants/types/utils
entrypoints -> providers/store/hooks/components
features -> lib/constants/types/utils
components -> utils/constants/types
```

Avoid this direction:

```txt
lib -> features
components -> features
features -> entrypoints
content -> background imports
background -> content imports
```

The only cross-runtime communication path should be `src/lib/messaging`.

## Communication Model

1. Content script extracts page context and selection.
2. Content script sends typed runtime messages to background.
3. Background handles privileged browser actions.
4. Popup/sidebar/options call background or active tab through typed messages.
5. Commands are identified by stable command IDs from `src/constants/commands.ts`.
6. Future AI execution should happen in background or a service module called by background.

## Circular Dependency Rules

- Feature folders expose a public `index.ts`.
- Other modules import from the feature root, not internal files.
- `src/lib` must stay generic and must not import from feature implementations.
- Shared types should move upward into `src/types` or a feature public contract when two modules need
  them.
- If two features need each other, introduce a small interface in `src/lib` or a new coordinating
  feature instead of mutual imports.

## Extension Surfaces

The foundation supports:

- Popup via `popup.html` and `src/popup`.
- Sidebar via `sidebar.html` and `src/sidebar`.
- Background service worker via `src/background/service-worker.ts`.
- Content script via `src/content/main.tsx`.
- Context menus via `src/background/context-menu.ts`.
- Keyboard commands via manifest commands and `src/background/keyboard-commands.ts`.
- Floating toolbar, selection toolbar, command palette, and inline-result mount slots via
  `src/content/surface-hosts.ts`.

## Error Strategy

- Normalize unknown errors with `src/lib/errors`.
- Message handlers return `{ ok: false, error }` instead of throwing across runtime boundaries.
- Chrome API errors are isolated in `src/lib/chrome`.
- Future user-visible errors should be mapped to friendly copy at the surface layer.

## Performance Strategy

- Content script does cheap passive observation only.
- Selection observation is throttled.
- Full page extraction and AI calls are deferred until explicit command execution.
- UI surfaces are separate bundles where possible.
- Background owns long-running orchestration and cancellation.

## Security And Privacy Strategy

- Web page content is untrusted context, never instruction authority.
- Secrets and provider keys must stay outside content scripts.
- AI provider calls should be routed through background/service modules.
- Context capture should happen after user intent.
- Site disable lists and privacy modes are modeled in `DEFAULT_EXTENSION_SETTINGS`.

## NPM Scripts

- `npm run dev`: Vite development server for extension pages.
- `npm run dev:content`: watch-build content script bundle.
- `npm run build`: typecheck and build extension bundles.
- `npm run typecheck`: strict TypeScript verification.
- `npm run lint`: ESLint with strict TypeScript rules.
- `npm run test`: Vitest suite.
- `npm run test:e2e`: extension smoke tests through Playwright.
- `npm run check`: full local quality gate.
