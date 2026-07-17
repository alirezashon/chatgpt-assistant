import type { AgentDefinition, AgentExecutor, MultiAgentKind } from './multi-agent-types';
import { MultiAgentRuntimeError } from './multi-agent-types';

/** Registered agent with executor. */
export interface RegisteredAgent {
  /** Definition. */
  readonly definition: AgentDefinition;
  /** Executor. */
  readonly executor: AgentExecutor;
}

/** Dynamic registry for specialized agents and plugin-contributed agents. */
export class MultiAgentRegistry {
  private readonly agents = new Map<string, RegisteredAgent>();

  /** Registers or replaces an agent definition and executor. */
  public register(definition: AgentDefinition, executor: AgentExecutor): void {
    validateDefinition(definition);
    this.agents.set(definition.id, { definition, executor });
  }

  /** Returns one registered agent. */
  public get(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  /** Requires one registered agent. */
  public require(agentId: string): RegisteredAgent {
    const agent = this.get(agentId);

    if (agent === undefined) {
      throw new MultiAgentRuntimeError('MULTI_AGENT_UNAVAILABLE', `Agent not registered: ${agentId}`, {
        agentId,
      });
    }

    return agent;
  }

  /** Lists registered definitions. */
  public definitions(): readonly AgentDefinition[] {
    return [...this.agents.values()].map((agent) => agent.definition);
  }

  /** Finds healthy agents by kind. */
  public byKind(kind: MultiAgentKind): readonly RegisteredAgent[] {
    return [...this.agents.values()].filter(
      (agent) =>
        agent.definition.kind === kind &&
        (agent.definition.profile.health.status === 'healthy' ||
          agent.definition.profile.health.status === 'degraded'),
    );
  }

  /** Finds healthy agents that can satisfy all requested capabilities. */
  public capable(requiredCapabilities: readonly string[]): readonly RegisteredAgent[] {
    return [...this.agents.values()].filter((agent) => {
      if (
        agent.definition.profile.health.status === 'offline' ||
        agent.definition.profile.health.status === 'unavailable'
      ) {
        return false;
      }

      const capabilityIds = new Set(agent.definition.profile.capabilities.map((capability) => capability.id));
      return requiredCapabilities.every((capability) => capabilityIds.has(capability));
    });
  }
}

function validateDefinition(definition: AgentDefinition): void {
  if (definition.id.trim().length === 0) {
    throw new MultiAgentRuntimeError('MULTI_AGENT_INVALID_GOAL', 'Agent id cannot be empty.');
  }

  if (definition.profile.capabilities.length === 0) {
    throw new MultiAgentRuntimeError('MULTI_AGENT_UNAVAILABLE', 'Agent must declare capabilities.', {
      agentId: definition.id,
    });
  }
}
