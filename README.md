# ChatGPT Workspace

ChatGPT Workspace is a local-first Chrome Extension that adds workspace organization tools to the ChatGPT website. The current repository contains the production-ready project foundation for a Manifest V3 extension built with React, TypeScript, Vite, Tailwind CSS, ESLint, Prettier, Husky, and lint-staged.

The MVP will eventually support folders, chat assignment, favorites, tags, better local search, and Markdown/PDF export. Those product features are intentionally not implemented in this bootstrap.

## Current Scope

This bootstrap includes:

- Manifest V3 configuration.
- Vite multi-entry extension build.
- Strict TypeScript configuration.
- React entry points for popup, options, and content script surfaces.
- Tailwind CSS setup.
- ESLint and Prettier setup.
- Husky and lint-staged setup.
- Path aliases and absolute imports.
- Environment variable support.
- Scalable source folder structure.

## Tech Stack

- Chrome Extension Manifest V3
- React
- TypeScript
- Vite
- Tailwind CSS
- ESLint
- Prettier
- Husky
- lint-staged
- npm

## Installation

Install dependencies:

```bash
npm install
```

## Development

Start the Vite development server:

```bash
npm run dev
```

For extension testing, use the production build and load the generated `dist` directory into Chrome.

## Build

Create a Chrome-loadable extension build:

```bash
npm run build
```

The compiled extension is written to:

```text
dist/
```

## Quality Checks

Run TypeScript:

```bash
npm run typecheck
```

Run ESLint:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

Run the full verification pipeline:

```bash
npm run check
```

## Load Into Chrome

1. Run `npm run build`.
2. Open Chrome.
3. Go to `chrome://extensions`.
4. Enable Developer mode.
5. Click `Load unpacked`.
6. Select the `dist` folder from this repository.
7. Open the extension popup to verify it displays `ChatGPT Workspace` and `Version 0.1.0`.

## Folder Overview

```text
src/
├─ app/
├─ assets/
├─ background/
├─ components/
├─ constants/
├─ content/
├─ features/
├─ hooks/
├─ layouts/
├─ lib/
├─ options/
├─ popup/
├─ services/
├─ shared/
├─ storage/
├─ styles/
├─ types/
└─ utils/
```

### `src/app`

Application-level composition and future app providers.

### `src/assets`

Static source assets such as images, icons, and local media before build processing.

### `src/background`

Manifest V3 background service worker entry point and future background coordination code.

### `src/components`

Reusable UI components that are not tied to one feature.

### `src/constants`

Application constants such as product name, version, route names, and extension-level identifiers.

### `src/content`

Content script entry point and future ChatGPT page integration code.

### `src/features`

Feature-based modules such as folders, favorites, tags, search, and export when implementation begins.

### `src/hooks`

Reusable React hooks that are not owned by one specific feature.

### `src/layouts`

Shared layout components for popup, options, and future injected UI surfaces.

### `src/lib`

Small framework-facing library helpers and third-party integration wrappers.

### `src/options`

Options page React entry point and future options UI.

### `src/popup`

Popup React entry point. The current popup only verifies the extension shell.

### `src/services`

Application services that coordinate use cases without depending on UI.

### `src/shared`

Cross-context shared code for content scripts, background worker, popup, and options.

### `src/storage`

Future storage repositories, migrations, and storage adapters.

### `src/styles`

Global styles and Tailwind entry CSS.

### `src/types`

Global and environment type declarations.

### `src/utils`

Small pure utility functions.

## Architecture

The project is organized so UI, domain behavior, Chrome APIs, storage, and ChatGPT DOM integration can remain separate as features are added.

Current extension entries:

- `src/background/service-worker.ts`
- `src/content/main.tsx`
- `src/popup/main.tsx`
- `src/options/main.tsx`

The build emits stable entry names under `dist/assets` so `public/manifest.json` can reference the background worker and content script directly.

## Environment Variables

Environment variables are read through Vite and must use the `VITE_` prefix.

Example:

```text
VITE_APP_NAME=ChatGPT Workspace
VITE_APP_VERSION=0.1.0
```

See `.env.example`.

## Contribution Guidelines

- Keep TypeScript strict.
- Do not use `any`.
- Keep business logic outside UI components.
- Keep Chrome APIs behind dedicated adapters when implementation begins.
- Keep ChatGPT DOM access isolated to content-specific adapters.
- Run `npm run check` before submitting changes.
