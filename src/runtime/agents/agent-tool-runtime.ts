import type { EventBus } from '@/runtime/events';

import type { AgentObservationEngine } from './agent-observation-engine';
import type { AgentSecurityManager } from './agent-security-manager';
import type { AgentToolRegistry } from './agent-tool-registry';
import type {
  AgentApprovalRequest,
  AgentGoal,
  AgentObservation,
  AgentRuntimeEvents,
  AgentToolRequest,
  AgentToolResponse,
} from './agent-types';

/** Executes agent tools through permission and approval boundaries. */
export class AgentToolRuntime {
  public constructor(
    private readonly tools: AgentToolRegistry,
    private readonly security: AgentSecurityManager,
    private readonly observations: AgentObservationEngine,
    private readonly events: EventBus<AgentRuntimeEvents>,
  ) {}

  /** Returns approval request when required, otherwise executes the tool. */
  public async execute(
    toolName: string,
    goal: AgentGoal,
    request: AgentToolRequest,
  ): Promise<AgentToolExecutionResult> {
    const tool = this.tools.require(toolName);
    this.security.assertToolAllowed(goal, tool.metadata);

    if (this.security.requiresApproval(tool.metadata)) {
      const approval: AgentApprovalRequest = {
        id: `${request.sessionId}:${request.stepId}:${toolName}`,
        input: request.input,
        reason: `High-risk tool requires approval: ${toolName}`,
        risk: tool.metadata.risk,
        sessionId: request.sessionId,
        stepId: request.stepId,
        toolName,
      };
      await this.events.emit('agent.approvalRequested', approval);
      return { approval };
    }

    const response = await tool.execute(request);
    return {
      observation: this.observations.observe(toolName, response),
      response,
    };
  }
}

/** Tool execution result. */
export type AgentToolExecutionResult =
  | {
      /** Approval required. */
      readonly approval: AgentApprovalRequest;
    }
  | {
      /** Tool response. */
      readonly response: AgentToolResponse;
      /** Observation. */
      readonly observation: AgentObservation;
    };
