import type { MemoryGraph, MemoryGraphNode, MemoryItem, MemoryRelationship } from './memory-types';

/** Maintains knowledge graph nodes and relationships derived from memory. */
export class MemoryKnowledgeGraph {
  /** Creates graph node for a memory item. */
  public createNode(item: MemoryItem): MemoryGraphNode {
    return {
      id: item.id,
      kind: item.type === 'preference' ? 'preference' : 'memory',
      label: item.title,
      metadata: {
        tags: item.tags,
        type: item.type,
      },
    };
  }

  /** Infers relationships between a new item and existing items. */
  public inferRelationships(
    item: MemoryItem,
    existing: readonly MemoryItem[],
  ): readonly MemoryRelationship[] {
    return existing
      .filter((candidate) => candidate.id !== item.id)
      .filter((candidate) => overlaps(item.tags, candidate.tags))
      .map((candidate) => ({
        confidence: 0.7,
        from: item.id,
        id: `${item.id}:related:${candidate.id}`,
        to: candidate.id,
        type: 'related_to' as const,
      }));
  }

  /** Creates a graph snapshot. */
  public snapshot(
    nodes: readonly MemoryGraphNode[],
    relationships: readonly MemoryRelationship[],
  ): MemoryGraph {
    return {
      nodes,
      relationships,
    };
  }
}

function overlaps(left: readonly string[], right: readonly string[]): boolean {
  return left.some((tag) => right.includes(tag));
}
