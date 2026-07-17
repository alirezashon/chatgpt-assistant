# Design System Phase 2

## Product Personality

The product should feel professional, minimal, fast, focused, intelligent, premium, trustworthy, and modern. It should never feel like a dashboard template, a ChatGPT clone, Bootstrap, Material UI, or a random collection of Tailwind blocks.

## Inspiration

Use Raycast for command density, Cursor for developer focus, Linear for hierarchy and quiet polish, Arc Browser for browser-native confidence, OpenAI for restraint, Notion for readable knowledge surfaces, Vercel for crisp operational UI, GitHub Desktop for focused workflows, and Apple HIG for interaction discipline.

## Token Rules

All product UI must route through semantic tokens and shared primitives. Page code may compose layout, but it should not invent new colors, radii, button styles, panel styles, focus rings, or typography treatment.

## Semantic Color System

- `background`: application shell.
- `surface`: primary elevated surface.
- `panel`: grouped content container.
- `primary`: main action.
- `secondary`: quiet action.
- `accent`: contextual intelligence and focus.
- `success`, `warning`, `danger`, `info`: status.
- `border`: default divider and outline.
- `muted`: secondary text and inactive icons.
- `overlay`: modal and palette backplate.
- `focus`: keyboard focus ring.
- `hover`, `selected`, `disabled`: interaction state.

Dark mode is the default. Light mode must remain compatible through CSS variables, but premium extension surfaces should prefer the dark shell.

## Typography

- Display: rare, large marketing or hero moments only.
- Heading: page-level workspace titles.
- Title: panel and card titles.
- Subtitle: secondary supporting copy.
- Body: working text.
- Caption: secondary metadata.
- Label: uppercase section labels.
- Monospace: shortcuts, IDs, commands, and technical values.

Use normal letter spacing except labels. Maximum readable line length is 72ch for body copy.

## Iconography

Use `lucide-react` only. Use 16px for most controls, 20px for primary cards, and 24px only for hero-like empty states. Icons use consistent stroke style and must be paired with accessible labels when icon-only.

## Component Rules

All core surfaces should use:

- `SurfaceRoot`
- `PageHeader`
- `Panel`
- `Button`
- `IconButton`
- `ActionTile`
- `CompactActionRow`
- `SectionTitle`
- `Badge`
- `KeyboardShortcut`
- `StatusIndicator`
- `MetricRow`
- `MessageBlock`

Components must support hover, focus-visible, disabled, loading where relevant, and keyboard interaction through native controls.

## Layout Templates

- Popup: fixed-width launchpad using context, quick actions, pinned actions, recent actions, and utility actions.
- Sidebar: workspace with active task, conversation, progress, artifacts, memory, knowledge, history, and workflow status.
- Settings: calm configuration page with only provider, privacy, shortcuts, and runtime preferences.
- Empty, loading, error, and success states: use the same panel, icon, title, body, and action structure.

## Motion

Motion should communicate state, not decorate. Use short timings, subtle transforms, and respect reduced motion. Hover transitions should be fast. Page transitions and command surfaces may use a small scale/fade only.

## Accessibility

Meet WCAG AA. Every interactive element needs visible focus, keyboard reachability, disabled semantics, and readable contrast. Icon-only buttons need `aria-label`. Status text must not rely on color alone.

## Responsive Rules

Popup width uses the popup token. Sidebar width is fluid. Surfaces must tolerate Chrome zoom, high DPI, small laptops, and large monitors. Text must truncate intentionally or wrap without overlapping.
