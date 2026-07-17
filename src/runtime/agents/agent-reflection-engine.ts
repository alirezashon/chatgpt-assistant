import type { AgentObservation, AgentSession } from './agent-types';

/** Evaluates progress and decides when to recover or complete. */
export class AgentReflectionEngine {
  /** Returns true when a step observation satisfies progress expectations. */
  public stepSucceeded(observation: AgentObservation): boolean {
    return observation.success;
  }

  /** Returns true when the session appears complete. */
  public goalComplete(session: AgentSession): boolean {
    const completedStepCount = Object.keys(session.outputs).length;
    return (
      completedStepCount >= session.plan.steps.length &&
      session.observations.every((item) => item.success)
    );
  }

  /** Builds a recovery reason. */
  public recoveryReason(session: AgentSession, observation: AgentObservation): string {
    return `Step failed after ${(session.failureCount + 1).toString()} failure(s): ${observation.summary}`;
  }
}
