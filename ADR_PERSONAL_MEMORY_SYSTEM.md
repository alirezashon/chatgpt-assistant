# ADR: Personal Memory And Knowledge Intelligence System

## Status

Accepted

## Context

The assistant needs persistent intelligence that improves over time while respecting user control and
privacy. This is not chat history and not “store everything.” Memory must be extracted, scored,
permissioned, retrieved, applied, and forgotten.

## Architectures Considered

### 1. Simple Key Value Memory

Fast and cheap, but weak retrieval, no relationships, poor contradiction handling, and little
personalization. Rejected as the whole system.

### 2. Conversation History Search

Easy to build, but stores too much, retrieves noisy context, and confuses chat logs with memory.
Rejected.

### 3. Vector Database RAG

Strong semantic retrieval, but insufficient for explicit preferences, expiration, permissions,
relationships, and contradictions. Accepted as one retrieval signal.

### 4. Knowledge Graph

Strong for user-project-technology-task relationships and contradiction tracking, but weak for fuzzy
semantic recall alone. Accepted as one core representation.

### 5. Episodic Memory Architecture

Good for past experiences and task history. Needs semantic abstraction to become generally useful.
Accepted.

### 6. Semantic Memory Architecture

Good for stable facts/preferences about the user. Needs source tracking, confidence, and conflict
handling. Accepted.

### 7. Cognitive Memory Model

Best conceptual model: observe, extract, evaluate, store, retrieve, apply, forget. Too broad unless
implemented as concrete subsystems. Accepted as the operating model.

### 8. Hybrid Vector + Graph + Structured Memory

Combines explicit structured memory, semantic similarity, relationships, recency, confidence,
importance, expiration, and privacy. Accepted.

### 9. Agent Memory Architecture

Useful for session/task memories, but agent-only memory would exclude commands, workflows, UI, and AI
gateway personalization. Accepted as a consumer of the memory runtime, not the whole system.

## Decision

Use a hybrid cognitive memory architecture:

- structured memory items for working, short-term, episodic, semantic, procedural, and preference
  memories.
- deterministic local embedding interface for semantic retrieval, with future local/private vector
  adapters.
- knowledge graph for entities and relationships.
- extraction pipeline with signal detection, importance scoring, privacy checks, optional approval,
  and storage.
- retrieval engine blending keyword, vector similarity, graph relationship relevance, recency,
  confidence, and importance.
- contradiction detector that lowers confidence on conflicting older memories and records conflict
  relationships.
- forgetting system with delete, category deletion, expiration, decay, and delete-all controls.

## Trade-Offs

- Hybrid memory is more complex than keyword search but avoids noisy chat-history recall.
- Local deterministic embeddings are less powerful than model embeddings but private, offline, and
  replaceable.
- Privacy gates can reject useful observations, but memory must be user-governed.
- Contradiction handling may require clarification UI later; v1 records conflicts and updates
  confidence deterministically.

## Consequences

- Memory retrieval is never only keyword search.
- Memory cannot silently override user intent; consumers receive ranked context with confidence and
  provenance.
- Users can delete individual memories, categories, expired memories, or all memory data.
- Sensitive observations are blocked unless policy explicitly allows them.
- Future local vector databases and private embedding models can be added behind stable interfaces.
