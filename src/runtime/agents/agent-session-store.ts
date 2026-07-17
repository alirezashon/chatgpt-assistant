import type { AgentSession } from './agent-types';

/** Agent session persistence boundary. */
export interface AgentSessionStore {
  /** Saves a session. */
  save(session: AgentSession): Promise<void>;
  /** Reads a session. */
  get(sessionId: string): Promise<AgentSession | undefined>;
  /** Lists sessions. */
  list(): Promise<readonly AgentSession[]>;
}

/** In-memory agent session store. */
export class MemoryAgentSessionStore implements AgentSessionStore {
  private readonly sessions = new Map<string, AgentSession>();

  /** Saves a session. */
  public save(session: AgentSession): Promise<void> {
    this.sessions.set(session.id, session);
    return Promise.resolve();
  }

  /** Reads a session. */
  public get(sessionId: string): Promise<AgentSession | undefined> {
    return Promise.resolve(this.sessions.get(sessionId));
  }

  /** Lists sessions. */
  public list(): Promise<readonly AgentSession[]> {
    return Promise.resolve([...this.sessions.values()]);
  }
}
