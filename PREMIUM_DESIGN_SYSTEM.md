# Premium Design System

This document defines the design language for the browser extension. The goal is not to make a
pretty extension. The goal is to make the product feel precise, expensive, fast, and inevitable.

The product should feel closer to Cursor, Raycast, Arc Browser, Linear, Notion AI, Vercel, and
Apple software than to a conventional SaaS dashboard.

## 1. Visual Identity

### Personality

The interface should feel:

- Quiet.
- Fast.
- Intentional.
- Polished.
- Intelligent.
- Dense without feeling cramped.
- Minimal without feeling empty.

The extension is not a destination. It is a layer that appears at the point of work, helps, and
gets out of the way.

### Typography

Use a modern system sans-serif stack. The typography should feel native, crisp, and professional.

Preferred feel:

- Apple-like clarity.
- Linear-like density.
- Raycast-like command readability.

Typography rules:

- No decorative fonts.
- No oversized marketing headings inside product surfaces.
- No negative letter spacing.
- Use font weight for hierarchy before using size.
- Body copy should be compact but readable.
- Labels should be short and direct.
- Command names should be action-first.

Recommended scale:

- Display: only for rare onboarding or first-launch surfaces.
- Title: popup/sidebar section headers.
- Body: normal text and command descriptions.
- Label: compact controls and metadata.
- Caption: hints, shortcuts, timestamps, secondary context.

### Spacing

Spacing should be tight, rhythmic, and calm.

Principles:

- Use less space than a SaaS dashboard.
- Use more space than a browser context menu.
- Keep surfaces compact enough to feel powerful.
- Preserve generous inner padding on floating surfaces.
- Group related actions tightly.
- Separate unrelated groups with subtle dividers or air, not heavy cards.

The spacing system should be based on small increments, with most UI using 4, 6, 8, 12, 16, and
24px rhythms.

### Radius

Radius should feel modern but not bubbly.

Rules:

- Small controls: 6px.
- Floating panels: 10 to 14px.
- Command palette: 14 to 16px.
- Badges and pills: full radius only when the element is genuinely small.
- Avoid oversized rounded cards.
- Avoid nested rounded panels.

### Elevation

Elevation communicates layer, not decoration.

Use elevation for:

- Command palette.
- Floating toolbar.
- Context menu.
- Dialogs.
- Toasts.
- Sidebar overlays.

Avoid elevation for:

- Normal page sections.
- Static settings content.
- Repeated list rows.

Elevation should combine:

- Fine border.
- Soft shadow.
- Slight background separation.
- Optional blur when floating above page content.

### Blur And Glass

Glass should be restrained and functional.

Use blur when:

- A floating surface sits over arbitrary web content.
- The user needs to preserve context behind the surface.
- The surface is temporary.

Do not use blur when:

- It reduces text contrast.
- It makes the interface feel decorative.
- The surface contains dense reading content.

Glass should never be the product’s main personality. It is a utility for layering.

### Borders

Borders should be subtle and structural.

Use borders to:

- Define floating surface edges.
- Separate toolbar groups.
- Clarify selected rows.
- Create focus states.

Avoid:

- Heavy borders.
- High-contrast boxes around every element.
- Card-heavy layouts.

### Icon Style

Icons should be:

- Monoline.
- Crisp.
- Small.
- Consistent stroke.
- Used as recognition aids, not decoration.

Prefer Lucide-style icons.

Rules:

- Icon-only buttons require tooltips.
- Use icons for common commands: copy, insert, summarize, search, close, settings, pin, history.
- Do not create custom icons unless a concept is product-specific.
- Icons should align optically with text, not merely mathematically.

### Density

The product should feel dense in the way professional tools feel dense.

Good density:

- Commands visible without scrolling.
- Keyboard shortcuts visible when helpful.
- Compact rows with clear hierarchy.
- Secondary metadata available but subdued.

Bad density:

- Crowded toolbars.
- Multiple competing buttons.
- Long instructional text.
- Stacked cards.

### Contrast And Hierarchy

Hierarchy should be created through:

- Text weight.
- Opacity.
- Position.
- Spacing.
- Surface elevation.
- Accent only when action is needed.

Avoid using saturated color for hierarchy unless it represents state or action.

## 2. Color System

The system should use semantic tokens, not raw color decisions.

### Background Tokens

`background.canvas`

- Base extension page background.
- Used in options, sidebar, and popup shells.
- Should be calm and low-contrast.

`background.page`

- Main product surface background.
- Slightly elevated from canvas.

`background.overlay`

- Full-screen overlay or dim layer behind modals/palette.
- Must preserve page context without feeling heavy.

### Surface Tokens

`surface.base`

- Normal panels and controls.

`surface.raised`

- Sidebar cards, popovers, dropdowns.

`surface.floating`

- Command palette, floating toolbar, context menu.
- Should include border and shadow.

`surface.glass`

- Floating over arbitrary web pages.
- Uses blur and translucency carefully.

`surface.inverse`

- Dark-on-light or light-on-dark contrast surface for rare emphasis.

### Interaction Tokens

`interaction.hover`

- Subtle row/control hover.
- Should feel like light passing over an object, not a color block.

`interaction.pressed`

- Slightly darker/deeper than hover.
- Communicates physical depression.

`interaction.selected`

- Active row, selected command, selected tab.
- Should be clear for keyboard navigation.

`interaction.focus`

- Keyboard focus ring.
- Must be visible and accessible.

`interaction.disabled`

- Low opacity, no hover elevation.

### Semantic State Tokens

`state.success`

- Completed command, copied, saved, connected.
- Use sparingly.

`state.warning`

- Recoverable issue, missing optional permission, degraded provider.

`state.danger`

- Destructive action, failed command, permission risk.

`state.info`

- Neutral system status, context detected, provider changed.

### Accent Tokens

`accent.primary`

- Primary action and selected command highlight.
- Should be premium, not loud.

`accent.secondary`

- Secondary brand tone for subtle highlights.

`accent.ai`

- Used only for AI-specific moments such as generation, streaming, or context intelligence.
- Avoid making every surface “AI colored.”

### Text Tokens

`text.primary`

- Main readable text.

`text.secondary`

- Descriptions, metadata, helper text.

`text.tertiary`

- Hints, placeholders, timestamps.

`text.inverse`

- Text on inverse/dark surfaces.

`text.danger`

- Destructive labels.

### Border Tokens

`border.subtle`

- Normal separators and surface edges.

`border.strong`

- Selected/focused controls.

`border.danger`

- Destructive or error state.

### Shadow Tokens

`shadow.low`

- Small raised controls.

`shadow.medium`

- Popovers, context menus, toolbars.

`shadow.high`

- Command palette and dialogs.

`shadow.focus`

- Focus halo, not decorative glow.

## 3. Motion Language

Motion should communicate state, causality, and continuity. It should never be ornamental.

### Philosophy

Motion should feel:

- Fast.
- Soft.
- Precise.
- Native.
- Interruptible.

If an animation makes the user wait, it is too slow.

### Durations

Recommended ranges:

- Hover: 80 to 120ms.
- Press: 60 to 90ms.
- Small popover open: 120 to 160ms.
- Command palette open: 150 to 200ms.
- Sidebar transition: 180 to 240ms.
- Toast enter/exit: 160 to 220ms.
- Success confirmation: 300 to 500ms, mostly non-blocking.

### Curves

Use curves that feel crisp.

- Enter: ease-out or spring with minimal bounce.
- Exit: ease-in, shorter than enter.
- Reorder/list movement: spring, low bounce.
- Loading shimmer: linear or very soft ease.

Avoid exaggerated bounce.

### Opening

Opening should combine:

- Slight opacity fade.
- Very small scale or translate.
- Fast settling.

Command palette should feel summoned, not opened.

### Closing

Closing should be faster than opening.

Rules:

- Do not animate close if the user is navigating away.
- Dismissals should feel immediate.
- Escape key should close surfaces instantly or near-instantly.

### Hover

Hover should communicate affordance.

Use:

- Subtle background shift.
- Slight border shift.
- Optional tiny shadow lift for floating controls.

Avoid:

- Large scale.
- Bright glows.
- Colorful hover blocks.

### Selection

Selection should be crisp and obvious.

Use:

- Selected row background.
- Left accent line or subtle border when needed.
- Shortcut hint becoming more visible.

Avoid:

- Pulsing selection by default.
- Heavy outlines.

### Context Menu

Context menus should:

- Appear near the invocation point.
- Animate from the origin subtly.
- Keep selected row movement instant.
- Dismiss without ceremony.

### Sidebar

Sidebar should:

- Slide only when it helps spatial understanding.
- Preserve scroll position.
- Avoid reanimating stable content.
- Use skeletons for content changes rather than whole-panel fades.

### Floating Toolbar

Floating toolbar should:

- Appear after a short delay when text selection stabilizes.
- Track selection position without jitter.
- Fade/translate in subtly.
- Hide quickly on scroll, Escape, or selection clear.

### Command Palette

Command palette should:

- Open centered or slightly above center.
- Focus search immediately.
- Animate results only when they change meaningfully.
- Keep keyboard selection stable while async results load.

### Search Results

Search result changes should:

- Use quick opacity/position transitions.
- Preserve row height.
- Highlight matched text without jumping.
- Avoid full list reflows where possible.

### Loading

Loading should feel intelligent.

Use:

- Inline progress text for commands.
- Skeletons for structured content.
- Streaming for AI text.
- Small spinner only when no richer state exists.

Avoid:

- Global loading screens.
- Blocking overlays.
- Infinite spinners without status.

### Success

Success should be quiet.

Use:

- Checkmark morph.
- Small toast.
- Row state change.
- “Copied” replacing “Copy” briefly.

### Failure

Failure should be clear but not dramatic.

Use:

- Inline error.
- Retry action.
- Short explanation.
- Diagnostic affordance only when useful.

### When Animation Should Not Happen

Do not animate:

- During rapid keyboard navigation if it causes lag.
- For reduced-motion users.
- On large text blocks that need readability.
- For every streaming token.
- On destructive confirmation state changes.
- When it could imply success before success is real.

## 4. Component Language

### Buttons

Button hierarchy:

- Primary: one per focused surface.
- Secondary: normal actions.
- Tertiary: low-emphasis actions.
- Icon: utility actions.
- Danger: destructive actions.

Rules:

- Buttons should be compact.
- Labels should be verbs.
- Icon buttons require tooltips.
- Destructive buttons should not be visually dominant until confirmation.

### Cards

Cards are not the default layout primitive.

Use cards for:

- Repeated objects.
- Summaries.
- Settings groups.
- Result blocks.

Avoid:

- Cards inside cards.
- Marketing-style card grids.
- Decorative cards with no interaction.

### Panels

Panels define product surfaces.

Use panels for:

- Sidebar.
- Command palette.
- Popovers.
- Dialogs.

Panels need:

- Clear boundary.
- Stable padding.
- Predictable header/body/footer structure when applicable.

### Inputs

Inputs should feel immediate and precise.

Rules:

- Search inputs auto-focus where expected.
- Placeholder text should be useful but short.
- Clear button appears only when there is text.
- Validation should be inline.
- Focus state must be visible.

### Search

Search is a command surface, not just an input.

It should support:

- Natural language.
- Keyboard navigation.
- Recent commands.
- Suggested actions.
- Empty and no-result states.
- Shortcut hints.

### Lists

Lists should be highly scannable.

Row structure:

- Leading icon or source.
- Primary title.
- Secondary description.
- Optional trailing shortcut/status.

Rules:

- Row heights remain stable.
- Hover and selected states are distinct.
- Keyboard selection always visible.

### Dropdowns

Dropdowns should be compact and contextual.

Use for:

- Mode selection.
- Provider selection.
- Sort/filter options.

Avoid using dropdowns for primary workflows.

### Context Menus

Context menus should be:

- Short.
- Contextual.
- Grouped.
- Keyboard navigable.

Never show every command. Show relevant commands.

### Tabs

Tabs should be used sparingly.

Good uses:

- Sidebar modes.
- Settings sections.
- Result categories.

Bad uses:

- Hiding primary actions.
- Complex nested workflows.

### Badges

Badges communicate state or category.

Examples:

- Beta.
- Local.
- Pro.
- Connected.
- Private.
- New.

Badges should be small and quiet.

### Tags

Tags represent user or system categorization.

Rules:

- Tags are compact.
- Colors should be restrained.
- Avoid rainbow tag systems.

### Tooltips

Tooltips should:

- Explain icon-only actions.
- Show shortcuts.
- Appear quickly but not instantly.
- Never contain long instructions.

### Empty States

Empty states should be useful, not decorative.

They need:

- Clear state.
- One recommended action.
- Optional shortcut.
- Calm tone.

### Skeletons

Skeletons should match the final layout.

Avoid generic gray bars when a specific structure is known.

### Toasts

Toasts are for transient feedback.

Use for:

- Copied.
- Saved.
- Command completed.
- Provider connected.
- Permission granted.

Do not use toasts for complex errors.

### Dialogs

Dialogs should be rare.

Use for:

- Destructive confirmation.
- Permission explanation.
- Provider key setup.
- Unsaved workflow interruption.

Dialogs should have one primary action and one obvious cancel path.

## 5. Layout System

### Popup

Purpose:

- Quick launcher.
- Status.
- Shortcuts.
- Settings entry.

Rules:

- Width: compact, roughly 340 to 400px.
- No dashboards.
- No long scrolling.
- No chat interface.
- One primary action.

### Sidebar

Purpose:

- Long-running workflows.
- AI output.
- Research.
- Command history.
- Multi-step tasks.

Rules:

- Width: 360 to 460px.
- Minimum usable width: 320px.
- Avoid card-heavy layouts.
- Sticky command/input regions only when necessary.
- Preserve user context and scroll.

### Floating Toolbar

Purpose:

- Immediate selected-text actions.

Rules:

- Small.
- Horizontal.
- Icon-first.
- Maximum 5 visible actions.
- Overflow menu for more.
- Never cover selected text unnecessarily.

### Command Palette

Purpose:

- Primary power interface.

Rules:

- Width: 560 to 720px desktop.
- Mobile/touch: nearly full width with safe margins.
- Opens above center.
- Search at top.
- Results below.
- Footer may show context, provider, or shortcut hints.

### Context Menu

Purpose:

- Native-feeling right-click actions.

Rules:

- Keep it short.
- Group actions.
- Show command names, not marketing labels.
- Avoid nested menus unless necessary.

### Responsive Behavior

The extension mostly lives in constrained browser surfaces.

Rules:

- Surfaces must work at narrow widths.
- Text should truncate gracefully.
- Buttons must not wrap awkwardly.
- Toolbars collapse to icons.
- Sidebar content should use progressive disclosure.

## 6. Interaction Language

### Keyboard-First UX

Every major action should be reachable by keyboard.

Required:

- Command palette shortcut.
- Arrow navigation.
- Enter to execute.
- Escape to close.
- Tab order that matches visual order.
- Shortcut hints for frequent commands.

Keyboard interactions should never feel secondary.

### Mouse UX

Mouse UX should be direct.

Rules:

- Hover reveals secondary affordances.
- Click targets are forgiving.
- Contextual actions appear where the user is working.
- Avoid requiring long pointer travel.

### Touch Support

Touch is secondary but should not break.

Rules:

- Minimum target size should be comfortable.
- Hover-only actions need tap alternatives.
- Floating toolbar should not be too dense on touch devices.

### Focus States

Focus states are mandatory.

They should be:

- Visible.
- Elegant.
- Consistent.
- Not confused with selection.

### Accessibility

Accessibility is part of polish.

Rules:

- Semantic labels.
- Predictable focus.
- Escape closes temporary surfaces.
- Reduced motion respected.
- Contrast passes WCAG AA.

### Command Discovery

Discovery should happen through use.

Use:

- Suggested commands.
- Recent commands.
- Contextual empty states.
- Shortcut hints.
- Right-click actions.

Avoid:

- Large onboarding tours.
- Feature checklists in primary surfaces.
- Explaining the whole product at once.

### Selection Philosophy

When the user selects text, the product should infer intent but stay respectful.

Rules:

- Do not instantly cover the selection.
- Wait for selection to stabilize.
- Offer relevant actions.
- Hide quickly when intent changes.

## 7. Micro-Interactions

Premium details users should notice subconsciously:

- Command palette opens with immediate cursor focus.
- Search placeholder adapts to context.
- Selected command row has a subtle left accent.
- Keyboard shortcut hint brightens on row selection.
- Copy button briefly becomes a checkmark.
- Insert action previews target before applying.
- Floating toolbar gently follows selection repositioning.
- Toolbar hides on scroll with no lag.
- Context detected indicator appears briefly, then settles.
- AI streaming starts with a short thinking status, not a spinner.
- AI output uses progressive reveal without token jitter.
- Long commands show step labels: reading, extracting, drafting, applying.
- Command success updates the originating row, not only a toast.
- Failed command keeps user input intact.
- Retry appears in the same location as failure.
- Search matches are highlighted with subtle emphasis.
- Recently used commands quietly rise in ranking.
- Palette footer shows the active site context.
- Provider switch confirms with a small state change.
- Permission prompts explain exactly why access is needed.
- Disabled commands explain the missing requirement.
- Empty states include one strong next action.
- Dragging sidebar width shows a live guide.
- Sidebar remembers width per user.
- Hover on floating surface slightly sharpens border.
- Pressed buttons move visually inward by a tiny amount.
- Toasts stack cleanly and never cover active input.
- Skeletons match the shape of real content.
- Context menus align to pointer but avoid viewport edges.
- Escape key always feels instant.
- Reduced motion changes transitions to fades.
- Loading states prefer meaningful verbs over “Loading.”
- Smart suggestions appear after context detection, not before.
- AI-generated text has a subtle completion settle state.

## 8. Empty States

### First Launch

Tone:

- Confident.
- Minimal.
- One action.

Message direction:

- Teach the command shortcut.
- Do not explain every feature.

Primary action:

- Open command palette.

### No History

Message direction:

- History appears after commands are used.
- Suggest a context-aware first command.

### No Selection

Message direction:

- Select text on the page to unlock rewrite, explain, summarize, and extract actions.

Primary action:

- Summarize page or open command palette.

### No AI Key

Message direction:

- AI provider is not connected.
- Explain privacy briefly.

Primary action:

- Connect provider.

Secondary:

- Use local-only features if available.

### No Internet

Message direction:

- Online AI features are paused.
- Local actions remain available.

Primary action:

- Retry.

### Permission Denied

Message direction:

- Explain what permission was needed and why.
- Never guilt the user.

Primary action:

- Grant permission.

Secondary:

- Continue without it.

### Nothing Found

Message direction:

- State no results.
- Offer a broader search or create custom command.

### Provider Error

Message direction:

- Provider failed.
- User input is preserved.

Primary action:

- Retry.

Secondary:

- Switch provider.

## 9. Visual Consistency Rules

Required:

- Every icon-only button has a tooltip.
- Every temporary surface closes with Escape.
- Every command row supports keyboard selection.
- Every async command has progress feedback.
- Every destructive action has confirmation or undo.
- Every disabled action explains why.
- Every floating surface has a clear boundary.
- Every text input has visible focus.

Never:

- Never build generic dashboards as primary surfaces.
- Never use Bootstrap-like cards or tables.
- Never use Material Design visual language.
- Never use large gradients as the core identity.
- Never use decorative blur that reduces readability.
- Never animate layout in a way that causes text jitter.
- Never show every possible command when context can narrow the list.
- Never use more than one primary action in a focused surface.
- Never nest cards inside cards.
- Never make the user read long instructions before acting.

Avoid:

- Loud saturated colors.
- Over-rounded controls.
- Heavy borders.
- Long button labels.
- Full-screen blocking loaders.
- Repeated onboarding prompts.
- Floating UI that covers the work area.

Always:

- Prefer contextual actions.
- Prefer keyboard speed.
- Prefer stable layout.
- Prefer semantic tokens.
- Prefer concise labels.
- Prefer progressive disclosure.
- Prefer native-feeling motion.

## 10. Accessibility

### Keyboard Navigation

Required:

- Full keyboard access for palette, menus, dialogs, toolbar, sidebar controls.
- Logical tab order.
- Arrow-key list navigation.
- Home/End support in command lists where appropriate.
- Escape closes temporary surfaces.
- Enter executes selected primary item.

### Reduced Motion

When reduced motion is enabled:

- Replace movement with opacity changes.
- Disable spring motion.
- Disable shimmer loops.
- Keep progress meaningful through text/state.

### Screen Readers

Required:

- Proper labels for controls.
- Announce command progress when meaningful.
- Announce success/failure states.
- Use semantic roles for menus, dialogs, lists, and tabs.
- Do not rely on icon meaning alone.

### Contrast

Rules:

- Body text meets WCAG AA.
- Secondary text remains readable.
- Focus rings meet contrast requirements.
- Danger/success/warning are not color-only.

### Touch Targets

Rules:

- Primary touch targets should be at least 40px where possible.
- Dense desktop controls need larger touch alternatives.
- Avoid tiny adjacent destructive actions.

## 11. Design Tokens

### Typography Tokens

- `font.family.sans`
- `font.size.caption`
- `font.size.label`
- `font.size.body`
- `font.size.title`
- `font.size.display`
- `font.weight.regular`
- `font.weight.medium`
- `font.weight.semibold`
- `lineHeight.caption`
- `lineHeight.body`
- `lineHeight.title`

### Spacing Tokens

- `space.0`
- `space.1`
- `space.2`
- `space.3`
- `space.4`
- `space.5`
- `space.6`
- `space.8`
- `space.10`
- `space.12`
- `space.16`

Use small spacing for controls and larger spacing for section separation.

### Radius Tokens

- `radius.none`
- `radius.xs`
- `radius.sm`
- `radius.md`
- `radius.lg`
- `radius.xl`
- `radius.full`

### Shadow Tokens

- `shadow.none`
- `shadow.low`
- `shadow.medium`
- `shadow.high`
- `shadow.focus`
- `shadow.danger`

### Border Tokens

- `border.width.none`
- `border.width.hairline`
- `border.width.normal`
- `border.color.subtle`
- `border.color.strong`
- `border.color.focus`
- `border.color.danger`

### Color Tokens

- `background.canvas`
- `background.page`
- `background.overlay`
- `surface.base`
- `surface.raised`
- `surface.floating`
- `surface.glass`
- `surface.inverse`
- `text.primary`
- `text.secondary`
- `text.tertiary`
- `text.inverse`
- `text.danger`
- `interaction.hover`
- `interaction.pressed`
- `interaction.selected`
- `interaction.focus`
- `interaction.disabled`
- `state.success`
- `state.warning`
- `state.danger`
- `state.info`
- `accent.primary`
- `accent.secondary`
- `accent.ai`
- `border.subtle`
- `border.strong`
- `border.danger`

### Motion Tokens

- `motion.duration.instant`
- `motion.duration.fast`
- `motion.duration.normal`
- `motion.duration.slow`
- `motion.curve.enter`
- `motion.curve.exit`
- `motion.curve.standard`
- `motion.spring.subtle`
- `motion.spring.list`

### Opacity Tokens

- `opacity.disabled`
- `opacity.muted`
- `opacity.overlay`
- `opacity.glass`
- `opacity.hover`
- `opacity.pressed`

### Z-Index Strategy

Layering must be predictable.

Recommended order:

- `z.base`
- `z.pageOverlay`
- `z.floatingToolbar`
- `z.contextMenu`
- `z.commandPalette`
- `z.dialog`
- `z.toast`
- `z.debug`

Rules:

- Do not invent arbitrary z-index values.
- Content-script surfaces must use a top-level isolated host.
- Dialogs beat palettes.
- Toasts beat dialogs only when non-interactive and non-blocking.

## Final Standard

The extension should never feel like a web app squeezed into a browser popup.

It should feel like a native productivity instrument:

- summoned instantly.
- aware of context.
- visually quiet.
- mechanically precise.
- respectful of attention.
- powerful under the keyboard.

Every future component must earn its pixels.
