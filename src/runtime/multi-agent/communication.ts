import type { AgentMessage, MultiAgentMessageType, MultiAgentValue } from './multi-agent-types';

/** Append-only typed communication log for agent collaboration and replay. */
export class AgentCommunicationLog {
  private readonly messages: AgentMessage[] = [];

  /** Sends a message. */
  public send(input: {
    readonly content: MultiAgentValue;
    readonly from: string;
    readonly sessionId: string;
    readonly taskId?: string;
    readonly to: string;
    readonly type: MultiAgentMessageType;
  }): AgentMessage {
    const message: AgentMessage = {
      content: input.content,
      from: input.from,
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      ...(input.taskId === undefined ? {} : { taskId: input.taskId }),
      timestamp: Date.now(),
      to: input.to,
      type: input.type,
    };
    this.messages.push(message);
    return message;
  }

  /** Lists messages for a session, optionally scoped to an agent. */
  public list(sessionId: string, agentId?: string): readonly AgentMessage[] {
    return this.messages.filter(
      (message) =>
        message.sessionId === sessionId &&
        (agentId === undefined ||
          message.from === agentId ||
          message.to === agentId ||
          message.to === 'broadcast'),
    );
  }
}
