import type { AgentMemoryEntry, AgentMemoryScope, AgentValue } from './agent-types';

/** Agent memory store boundary. */
export interface AgentMemoryStore {
  /** Adds a memory entry. */
  add(entry: AgentMemoryEntry): Promise<void>;
  /** Searches memory by query and optional scope. */
  search(query: string, scope?: AgentMemoryScope): Promise<readonly AgentMemoryEntry[]>;
  /** Lists memory entries for a session. */
  listForSession(sessionId: string): Promise<readonly AgentMemoryEntry[]>;
}

/** In-memory agent memory store for local runtime and tests. */
export class MemoryAgentMemoryStore implements AgentMemoryStore {
  private readonly entries: AgentMemoryEntry[] = [];

  /** Adds a memory entry. */
  public add(entry: AgentMemoryEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  /** Searches memory by deterministic text matching. */
  public search(query: string, scope?: AgentMemoryScope): Promise<readonly AgentMemoryEntry[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return Promise.resolve(
      this.entries
        .filter((entry) => scope === undefined || entry.scope === scope)
        .filter((entry) => terms.some((term) => entry.summary.toLowerCase().includes(term)))
        .slice(-20),
    );
  }

  /** Lists memory entries for a session. */
  public listForSession(sessionId: string): Promise<readonly AgentMemoryEntry[]> {
    return Promise.resolve(this.entries.filter((entry) => entry.sessionId === sessionId));
  }
}

/** Facade for scoped agent memory operations. */
export class AgentMemory {
  public constructor(private readonly store: AgentMemoryStore = new MemoryAgentMemoryStore()) {}

  /** Remembers safe agent state. */
  public remember(input: {
    readonly scope: AgentMemoryScope;
    readonly sessionId?: string;
    readonly summary: string;
    readonly value: AgentValue;
    readonly sensitivity?: AgentMemoryEntry['sensitivity'];
  }): Promise<void> {
    return this.store.add({
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      scope: input.scope,
      ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
      sensitivity: input.sensitivity ?? 'public',
      summary: input.summary,
      value: input.value,
    });
  }

  /** Retrieves memory relevant to a goal or step. */
  public retrieve(query: string): Promise<readonly AgentMemoryEntry[]> {
    return this.store.search(query);
  }

  /** Lists session memory. */
  public listForSession(sessionId: string): Promise<readonly AgentMemoryEntry[]> {
    return this.store.listForSession(sessionId);
  }
}
