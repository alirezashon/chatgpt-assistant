# ADR: Personal Knowledge Retrieval And RAG Intelligence Engine

## Status

Accepted

## Context

The assistant needs a knowledge intelligence layer that can ingest and retrieve from browser pages,
documents, PDFs, repositories, issues, emails, notes, files, and enterprise sources. It must support
source transparency, permission-aware retrieval, freshness, incremental updates, and agent tools.

This must not be a simple vector search. Retrieval needs keyword, semantic, metadata, graph,
freshness, authority, quality, and permission signals.

## Architectures Considered

### 1. Pure Vector Database

Good semantic recall, weak explainability, metadata filtering, exact matches, freshness, and graph
relationships. Rejected as the sole architecture.

### 2. Keyword Search Engine

Fast, explainable, and cheap, but poor semantic recall. Accepted as one retrieval stage.

### 3. Traditional Full Text Search

Strong document search baseline, but incomplete for code structure, graph reasoning, and RAG context
selection. Accepted as an index strategy, not the whole system.

### 4. Knowledge Graph

Excellent for entities, relationships, provenance, and explainability. Weak for fuzzy text matching
alone. Accepted.

### 5. Graph RAG

Strong for relationship-aware retrieval and source transparency, but needs text/vector indexes for
recall. Accepted as part of the hybrid.

### 6. Hybrid Search

Combines keyword, vector, metadata, and graph ranking. Accepted as the core retrieval architecture.

### 7. Agentic Retrieval

Useful for complex research but slower and costlier. Accepted as a future planner layer over the same
retrieval APIs.

### 8. Multi-stage Retrieval

Best balance for accuracy, latency, and explainability: understand query, expand, retrieve, traverse,
rank, select context. Accepted.

### 9. Semantic Cache Retrieval

Useful for repeated queries and cost reduction, but not sufficient for fresh knowledge. Accepted as a
future optimization.

### 10. Enterprise Search Architecture

Strong permission model, connector abstraction, sync, source authority, and auditability. Accepted as
the operating model.

## Decision

Use a multi-stage hybrid Graph RAG architecture:

- connectors fetch source records with auth, permissions, schema, metadata, and sync strategy.
- ingestion validates, extracts, cleans, normalizes, chunks, enriches, embeds, and indexes records.
- indexes include keyword, vector, metadata, and graph stores.
- retrieval combines keyword retrieval, vector retrieval, graph traversal, metadata filtering, and
  ranking.
- context builder deduplicates, orders, and token-budgets chunks for AI runtime prompts.
- every result carries source references, confidence, and ranking reasons.
- incremental updates use source id, version, content hash, and deletion hooks.

## Trade-Offs

- Hybrid indexes are more complex than vector-only search but avoid black-box retrieval.
- Local deterministic embeddings are less powerful than cloud models but private, offline, and
  replaceable.
- Permission checks add overhead but are mandatory for enterprise and private sources.
- Connector abstractions require more up-front design but keep integrations replaceable.

## Consequences

- Retrieval is explainable and source-backed.
- Agents can use knowledge as tools without seeing unauthorized data.
- Connectors can be added without changing the retrieval engine.
- Incremental updates and deletes are first-class.
- Future vector DBs, cloud embeddings, and agentic retrievers can replace local components behind
  stable interfaces.
