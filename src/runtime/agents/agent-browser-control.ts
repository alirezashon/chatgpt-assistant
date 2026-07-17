import type {
  AgentBrowserControlAdapter,
  AgentTool,
  AgentToolMetadata,
  AgentValue,
} from './agent-types';

/** Creates a browser-control tool backed by a semantic browser adapter. */
export function createBrowserControlTool(
  metadata: AgentToolMetadata,
  adapter: AgentBrowserControlAdapter,
): AgentTool {
  return {
    metadata,
    execute: async (request) =>
      adapter.execute(getActionName(request.input, metadata.name), request.input),
  };
}

function getActionName(input: AgentValue, fallback: string): string {
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    const record = input as Readonly<Record<string, AgentValue>>;
    const action = record['action'];

    if (typeof action === 'string') {
      return action;
    }
  }

  return fallback;
}
