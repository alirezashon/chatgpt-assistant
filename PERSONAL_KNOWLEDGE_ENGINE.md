# Personal Knowledge Engine

The Personal Knowledge Engine ingests, indexes, retrieves, and prepares source-backed context from
personal and enterprise knowledge sources.

## Pipeline

Data Sources -> Connectors -> Fetch -> Validate -> Extract -> Clean -> Normalize -> Chunk -> Enrich
-> Embed -> Index -> Graph -> Retrieval -> Context Builder -> AI Runtime.

## Indexes

- keyword index for exact and explainable matching.
- vector index for semantic similarity.
- metadata index for permissions, source type, freshness, authority, and filters.
- graph index for entity and relationship traversal.

## Retrieval

The retrieval pipeline performs query understanding, query expansion, keyword retrieval, vector
retrieval, graph traversal, ranking, and context selection. Every result includes source references,
confidence, and ranking reasons.

## Privacy

Retrieval is permission-aware. Unauthorized chunks are filtered before ranking and before context
building. Local-only embedding and index implementations are available by default.
