# ADR: Contextual Floating Action Surface Architecture

## Status

Accepted

## Context

The Floating Action Surface is the primary in-page interaction layer for contextual commands. It must
appear near user intent, especially text selections and editable targets, without being a generic
toolbar or isolated demo UI.

The surface must integrate with the platform architecture:

- Context Intelligence Engine.
- Action Intelligence Engine.
- Command Platform.
- Extension Micro Kernel.
- Event Bus.
- Messaging Runtime.

It must also survive hostile webpages, arbitrary CSS, SPA navigation, dynamic DOM changes,
accessibility constraints, and Chrome Extension Manifest V3 content-script limitations.

## Options Considered

### 1. React Portal Injected Into Page

React renders directly into a page-owned DOM node.

Security:

- Weak. Host page CSS and DOM scripts can interfere with the surface.

CSS Isolation:

- Weak. Requires aggressive reset styles and still risks leakage.

Performance:

- Good. Low overhead.

Memory:

- Good.

Accessibility:

- Good if carefully implemented.

Browser Compatibility:

- Strong.

Developer Experience:

- Strong.

Verdict:

- Rejected. Too exposed to host page CSS and DOM interference.

### 2. Shadow DOM Isolated Component

React renders into an extension-owned Shadow Root mounted by the content script.

Security:

- Good. Host CSS does not cross the shadow boundary.

CSS Isolation:

- Strong. Styles are scoped and predictable.

Performance:

- Strong. Lower overhead than iframe and no cross-document bridge.

Memory:

- Good. One root, clean disposal.

Accessibility:

- Good with explicit ARIA and focus management.

Browser Compatibility:

- Strong in Chromium-based browsers.

Developer Experience:

- Strong. React can render normally.

Verdict:

- Accepted as the primary architecture.

### 3. iframe Isolated Surface

Render the surface inside an extension iframe.

Security:

- Very strong isolation.

CSS Isolation:

- Excellent.

Performance:

- Moderate. Additional document, messaging, layout, and focus overhead.

Memory:

- Higher than Shadow DOM.

Accessibility:

- Harder. Focus crossing iframe boundary is more complex.

Browser Compatibility:

- Good, but extension/page iframe restrictions can vary.

Developer Experience:

- Moderate. Requires cross-frame messaging for every interaction.

Verdict:

- Rejected for v1. Keep as future fallback for extremely hostile surfaces.

### 4. Native Browser Overlay

Use native Chrome UI surfaces such as context menus or side panel.

Security:

- Strong.

CSS Isolation:

- Excellent.

Performance:

- Strong.

Memory:

- Strong.

Accessibility:

- Strong.

Browser Compatibility:

- Limited. Native overlays cannot position near arbitrary selection rectangles.

Developer Experience:

- Limited control.

Verdict:

- Rejected. Does not satisfy in-page contextual placement.

### 5. Hybrid Approach

Use Shadow DOM for the primary in-page surface, native context menu as fallback, and iframe only for
future high-risk isolation cases.

Security:

- Strong enough for v1 with future escape hatch.

CSS Isolation:

- Strong.

Performance:

- Strong.

Memory:

- Good.

Accessibility:

- Good.

Browser Compatibility:

- Strong in target Chrome extension runtime.

Developer Experience:

- Strong.

Verdict:

- Accepted.

## Decision

Use a **Hybrid Shadow DOM Architecture**:

- Primary rendering uses a content-script-owned Shadow DOM host.
- React renders into the Shadow Root.
- State and business decisions live outside UI components.
- Actions are supplied by an adapter boundary connected to future Action Intelligence and Command
  Platform services.
- Native context menus remain a fallback interaction surface.
- iframe isolation may be introduced later without changing provider contracts.

## Trade-Offs

Benefits:

- Strong CSS isolation.
- Good security posture against hostile pages.
- Lower memory than iframe.
- Better keyboard/focus control than native browser surfaces.
- Works with React, animation, and accessibility requirements.
- Supports future surfaces through shared controller/runtime contracts.

Costs:

- Shadow DOM accessibility requires careful labeling.
- Font and style tokens must be injected explicitly.
- Hostile pages can still remove the host node, so runtime must tolerate remounting.
- Selection positioning must account for page scroll, zoom, and visual viewport.

## Consequences

- No UI component may own context detection or action generation.
- The surface consumes normalized selection/context and dynamic action candidates.
- Host page CSS cannot style extension UI.
- All listeners must be disposable.
- The positioning engine must be pure and testable.
- Action execution is delegated through adapter contracts.

## Future Migration

If Shadow DOM isolation becomes insufficient:

1. Keep `FloatingSurfaceAdapter` and controller contracts.
2. Replace only `FloatingSurfaceRenderer` with an iframe-backed renderer.
3. Preserve state, positioning, action, and accessibility contracts.
4. Keep native context menu as fallback when in-page rendering is blocked.
