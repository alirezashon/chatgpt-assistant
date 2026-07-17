import type {
  AgentObservation,
  AgentSession,
  AgentSessionStatus,
  AgentTimelineEvent,
  AgentValue,
} from './agent-types';
import type { AgentSessionStore } from './agent-session-store';

/** Mutates and persists agent sessions. */
export class AgentStateManager {
  public constructor(private readonly store: AgentSessionStore) {}

  /** Saves a session. */
  public save(session: AgentSession): Promise<void> {
    return this.store.save(session);
  }

  /** Reads a session. */
  public get(sessionId: string): Promise<AgentSession | undefined> {
    return this.store.get(sessionId);
  }

  /** Lists sessions. */
  public list(): Promise<readonly AgentSession[]> {
    return this.store.list();
  }

  /** Updates status. */
  public async setStatus(session: AgentSession, status: AgentSessionStatus): Promise<AgentSession> {
    const next = {
      ...session,
      status,
      updatedAt: Date.now(),
    };
    await this.save(next);
    return next;
  }

  /** Appends a timeline event. */
  public async appendTimeline(
    session: AgentSession,
    event: Omit<AgentTimelineEvent, 'id' | 'timestamp'>,
  ): Promise<AgentSession> {
    const next = {
      ...session,
      timeline: [
        ...session.timeline,
        {
          ...event,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    };
    await this.save(next);
    return next;
  }

  /** Records an observation and optional output. */
  public async recordObservation(
    session: AgentSession,
    stepId: string,
    observation: AgentObservation,
    output: AgentValue,
  ): Promise<AgentSession> {
    const next = {
      ...session,
      observations: [...session.observations, observation],
      outputs: {
        ...session.outputs,
        [stepId]: output,
      },
      updatedAt: Date.now(),
    };
    await this.save(next);
    return next;
  }
}
