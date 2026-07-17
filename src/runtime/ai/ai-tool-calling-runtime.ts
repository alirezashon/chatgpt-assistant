import type { AIToolCall, AIToolDefinition, AIToolExecutor } from './ai-types';
import { AIError } from './ai-errors';

/** Security checker for model tool calls. */
export interface AIToolSecurityChecker {
  /** Returns whether tool execution is allowed. */
  canExecute(tool: AIToolDefinition, call: AIToolCall): boolean;
}

/** Validates and executes model tool calls through a controlled registry. */
export class AIToolCallingRuntime {
  private readonly tools = new Map<string, AIToolExecutor>();

  public constructor(private readonly security: AIToolSecurityChecker = allowAllTools) {}

  /** Registers a tool executor. */
  public register(executor: AIToolExecutor): void {
    this.tools.set(executor.definition.name, executor);
  }

  /** Lists tool definitions. */
  public definitions(): readonly AIToolDefinition[] {
    return [...this.tools.values()].map((executor) => executor.definition);
  }

  /** Executes one tool call. */
  public async execute(call: AIToolCall): Promise<string> {
    const executor = this.tools.get(call.name);

    if (executor === undefined) {
      throw new AIError('AI_SECURITY_BLOCKED', `Tool is not registered: ${call.name}`);
    }

    if (!this.security.canExecute(executor.definition, call)) {
      throw new AIError('AI_SECURITY_BLOCKED', `Tool call denied: ${call.name}`);
    }

    return executor.execute(call);
  }
}

const allowAllTools: AIToolSecurityChecker = {
  canExecute: () => true,
};
