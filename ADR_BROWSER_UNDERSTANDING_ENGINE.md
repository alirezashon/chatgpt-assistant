# ADR: Browser Understanding Engine

## Status

Accepted

## Context

The autonomous browser agent needs a semantic perception layer. It should understand a page in terms
of sections, components, elements, actions, content, state, intent, relationships, and risk. It must
not depend on fragile CSS classes, generated ids, or raw DOM scraping as the agent-facing contract.

The engine sits between the browser page and the context/action/agent runtimes:

Browser Page -> Perception Layer -> Semantic Representation -> Context Engine -> Action Engine ->
Agent Runtime.

## Architectures Considered

### 1. DOM Only

Fast and local, but weak for accessibility names, visual hierarchy, hidden overlays, and canvas/image
content. Rejected as the sole architecture.

### 2. Accessibility Tree Only

Reliable for interactive controls and keyboard semantics, but incomplete for visual layout, tables,
charts, code blocks, and custom web apps. Rejected as the sole architecture.

### 3. Screenshot Vision Model

Strong for visual hierarchy, modals, charts, and screenshots, but expensive, privacy-sensitive, and
not always available in content scripts. Rejected as the default path; accepted as an optional adapter.

### 4. OCR Pipeline

Useful for images, PDFs, canvas, video frames, and screenshots. It is costlier and should be scoped to
regions. Accepted as an optional adapter.

### 5. Hybrid DOM + Accessibility + Vision

Combines speed, reliability, visual understanding, and extensibility. Accepted.

### 6. Knowledge Graph Representation

Best fit for traversal, semantic targeting, reasoning, diffing, and agent observations. Accepted.

### 7. Multimodal Transformer Approach

Powerful but expensive, privacy-sensitive, and unnecessary for every incremental update. Rejected for
the core local runtime; retained as a future high-confidence analyzer.

### 8. Browser Native Semantic APIs

Promising when available, but inconsistent and immature. Accepted as future adapters behind the same
analyzer interfaces.

## Decision

Use a hybrid semantic perception architecture:

- DOM analyzer extracts structure, text, forms, links, tables, dialogs, code blocks, media, and
  mutation fingerprints.
- accessibility analyzer extracts role, accessible name, state, hierarchy, keyboard accessibility,
  and interactive affordances.
- visual and OCR analyzers are adapter interfaces that can enrich the model with screenshots,
  regions, layout, objects, and text positions.
- privacy engine detects and redacts sensitive regions and values before export.
- semantic classifier assigns purpose, intent, importance, actionability, confidence, dependencies,
  and risk.
- graph builder creates a page knowledge graph.
- change detector compares semantic snapshots and emits DOM/semantic diffs.
- targeting engine resolves semantic queries to stable element references rather than CSS selectors.

## Trade-Offs

- Local DOM/accessibility analysis is less visually complete than multimodal models, but fast and
  private.
- Optional vision/OCR adapters add complexity but keep the core runtime cheap and testable.
- Semantic graph construction has overhead, but enables reliable targeting, diffing, and agent
  observation.

## Consequences

- Agents ask what is available on a page instead of requesting CSS selectors.
- Dynamic pages can be updated incrementally from semantic diffs.
- Sensitive inputs are redacted before context export.
- Browser restart can preserve semantic snapshots through a state-store adapter.
- Future screenshot, OCR, and native semantic APIs can enrich the graph without changing agent code.
