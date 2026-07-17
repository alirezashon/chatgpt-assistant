# Browser Understanding Engine

The Browser Understanding Engine is the semantic perception layer for the browser-native AI agent. It
turns pages into a stable semantic graph instead of exposing raw DOM selectors.

## Pipeline

Page Capture -> DOM Analysis -> Accessibility Extraction -> Visual Analysis -> Text Understanding ->
Element Classification -> Relationship Detection -> Semantic Graph Creation -> Context Export.

## Model

The universal page model contains:

- page metadata and URL.
- sections and components.
- semantic elements.
- actions and state.
- content blocks.
- relationships.
- intent and risk.
- confidence and evidence.

## Targeting

The targeting API resolves human-like queries such as “checkout button”, “email input”, or “primary
submit action” to semantic targets with confidence and evidence. Agents never receive CSS selectors
as the primary contract.

## Privacy

The engine detects password fields, payment fields, private documents, healthcare/banking hints, and
restricted regions. Sensitive values are redacted before export or memory persistence.

## Extensibility

Visual, OCR, and browser-native semantic analyzers are interfaces. The first implementation uses
local DOM and accessibility semantics, while future adapters can add screenshots, OCR, object
detection, and multimodal reasoning.
