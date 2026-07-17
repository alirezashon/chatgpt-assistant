import type { AgentTaskResult, MultiAgentDecision, MultiAgentTask } from './multi-agent-types';

/** Resolves competing, debating, or peer-reviewed agent outputs. */
export class AgentConflictResolver {
  /** Chooses the strongest result and records alternatives. */
  public resolve(input: {
    readonly candidates: readonly { readonly agentId: string; readonly result: AgentTaskResult }[];
    readonly task: MultiAgentTask;
  }): { readonly decision: MultiAgentDecision; readonly result: AgentTaskResult } {
    const ranked = [...input.candidates].sort(
      (left, right) =>
        score(right.result) - score(left.result) ||
        right.result.confidence - left.result.confidence ||
        left.result.cost - right.result.cost,
    );
    const winner = ranked[0];

    if (winner === undefined) {
      throw new Error(`No candidates produced output for task ${input.task.id}`);
    }

    return {
      decision: {
        agentId: winner.agentId,
        alternatives: ranked.slice(1).map((candidate) => candidate.agentId),
        id: crypto.randomUUID(),
        reason: `Selected highest quality/confidence output for ${input.task.title}.`,
        taskId: input.task.id,
        timestamp: Date.now(),
      },
      result: winner.result,
    };
  }
}

function score(result: AgentTaskResult): number {
  const issuePenalty = Math.min(0.4, result.issues.length * 0.1);
  const costPenalty = Math.min(0.2, result.cost / 100);
  return result.confidence * 0.4 + result.quality * 0.45 - issuePenalty - costPenalty + (result.success ? 0.15 : -0.5);
}
