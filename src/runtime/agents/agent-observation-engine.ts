import type { AgentObservation, AgentToolResponse, AgentValue } from './agent-types';

/** Normalizes tool responses into observations and progress signals. */
export class AgentObservationEngine {
  /** Creates an observation from a tool response. */
  public observe(toolName: string, response: AgentToolResponse): AgentObservation {
    return {
      ...response.observation,
      source: toolName,
    };
  }

  /** Creates a synthetic observation for failures or state changes. */
  public synthetic(
    source: string,
    summary: string,
    success: boolean,
    data: AgentValue = null,
  ): AgentObservation {
    return {
      data,
      id: crypto.randomUUID(),
      source,
      success,
      summary,
      timestamp: Date.now(),
    };
  }

  /** Verifies whether an observation indicates useful progress. */
  public indicatesProgress(observation: AgentObservation): boolean {
    return observation.success && observation.summary.trim().length > 0;
  }
}
