import type { AgentTool, AgentToolMetadata } from './agent-types';
import { AgentRuntimeError } from './agent-types';

/** Registry of agent tools. Tools may be first-party, plugin-contributed, or workflow-backed. */
export class AgentToolRegistry {
  private readonly tools = new Map<string, AgentTool>();

  /** Registers or replaces a tool. */
  public register(tool: AgentTool): void {
    this.tools.set(tool.metadata.name, tool);
  }

  /** Returns a tool by name. */
  public get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  /** Requires a tool by name. */
  public require(name: string): AgentTool {
    const tool = this.get(name);

    if (tool === undefined) {
      throw new AgentRuntimeError('AGENT_TOOL_NOT_FOUND', `Agent tool not registered: ${name}`);
    }

    return tool;
  }

  /** Lists tool metadata. */
  public metadata(): readonly AgentToolMetadata[] {
    return [...this.tools.values()].map((tool) => tool.metadata);
  }
}
