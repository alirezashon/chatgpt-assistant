import type {
  AgentCapability,
  AgentCostModel,
  AgentDefinition,
  AgentHealth,
  MultiAgentKind,
  MultiAgentPermission,
} from './multi-agent-types';

const CAPABILITY_BY_KIND: Readonly<Record<MultiAgentKind, AgentCapability>> = {
  automation: capability('automation', 'Automation', ['automation', 'workflow'], ['workflow.start']),
  browser: capability('browser', 'Browser Automation', ['browser', 'web'], ['browser.read']),
  coding: capability('coding', 'Coding', ['code', 'implementation', 'frontend'], ['filesystem.read', 'filesystem.write']),
  data: capability('data', 'Data Analysis', ['data', 'analytics'], ['knowledge.read']),
  planning: capability('planning', 'Planning', ['plan', 'strategy'], ['knowledge.read']),
  research: capability('research', 'Research', ['research', 'competitor', 'source'], ['knowledge.read', 'network.request']),
  review: capability('review', 'Review', ['review', 'merge', 'quality'], ['blackboard.read']),
  security: capability('security', 'Security Review', ['security', 'risk'], ['filesystem.read', 'security.review']),
  testing: capability('testing', 'Testing', ['test', 'qa', 'verify'], ['command.execute', 'filesystem.read']),
  writing: capability('writing', 'Writing And Design', ['write', 'design', 'copy'], ['knowledge.read']),
};

/** Creates a first-party specialized agent definition with scoped defaults. */
export function createSpecializedAgentDefinition(input: {
  readonly id: string;
  readonly kind: MultiAgentKind;
  readonly name?: string;
  readonly extraCapabilities?: readonly AgentCapability[];
  readonly extraPermissions?: readonly MultiAgentPermission[];
}): AgentDefinition {
  const baseCapability = CAPABILITY_BY_KIND[input.kind];
  const permissions = unique([
    'agent.message',
    'blackboard.read',
    'blackboard.write',
    ...baseCapability.permissions,
    ...(input.extraPermissions ?? []),
  ]);
  const health: AgentHealth = {
    lastHeartbeatAt: Date.now(),
    latencyMs: 250,
    status: 'healthy',
    successRate: 1,
  };
  const costModel: AgentCostModel = {
    baseCost: 1,
    tokenCostPer1k: 0.5,
    toolCostMultiplier: 1,
  };

  return {
    id: input.id,
    kind: input.kind,
    profile: {
      allowedActions: permissions,
      capabilities: [baseCapability, ...(input.extraCapabilities ?? [])],
      costModel,
      health,
      id: `${input.id}-profile`,
      knowledgeAccess: permissions.filter((permission) => permission === 'knowledge.read'),
      limitations: ['Must operate through supervisor, blackboard, and approved tools.'],
      maxConcurrentTasks: 1,
      memoryAccess: ['memory.read.shared', 'memory.write.shared'],
      name: input.name ?? baseCapability.name,
      purpose: baseCapability.description,
      tools: baseCapability.toolNames,
      version: {
        channel: 'stable',
        version: '1.0.0',
      },
    },
  };
}

function capability(
  id: string,
  name: string,
  keywords: readonly string[],
  permissions: readonly MultiAgentPermission[],
): AgentCapability {
  return {
    confidence: 0.9,
    description: `${name} specialist for multi-agent collaboration.`,
    id,
    keywords,
    name,
    permissions,
    toolNames: [],
  };
}

function unique(values: readonly MultiAgentPermission[]): readonly MultiAgentPermission[] {
  return [...new Set(values)];
}
