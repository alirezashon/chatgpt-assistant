import type { AIModelRouteDecision, AIResponse, AITraceEvent } from './ai-types';

/** AI observability trace manager. */
export class AITraceManager {
  private readonly events: AITraceEvent[] = [];

  /** Records route selection. */
  public routed(requestId: string, route: AIModelRouteDecision): AITraceEvent {
    return this.record({
      message: route.reason,
      modelId: route.model.id,
      providerId: route.provider.metadata.id,
      requestId,
      type: 'routed',
    });
  }

  /** Records completion. */
  public completed(requestId: string, response: AIResponse, latencyMs: number): AITraceEvent {
    return this.record({
      costUsd: response.costUsd,
      latencyMs,
      message: 'AI request completed.',
      modelId: response.modelId,
      providerId: response.providerId,
      qualityScore: response.evaluationScore,
      requestId,
      type: response.cached ? 'cache-hit' : 'completed',
    });
  }

  /** Records failure. */
  public failed(requestId: string, message: string): AITraceEvent {
    return this.record({
      message,
      requestId,
      type: 'failed',
    });
  }

  /** Records tool call. */
  public toolCalled(requestId: string, toolName: string): AITraceEvent {
    return this.record({
      message: `Tool called: ${toolName}`,
      requestId,
      type: 'tool-called',
    });
  }

  /** Lists events. */
  public list(requestId?: string): readonly AITraceEvent[] {
    return this.events.filter((event) => requestId === undefined || event.requestId === requestId);
  }

  private record(input: Omit<AITraceEvent, 'id' | 'timestamp'>): AITraceEvent {
    const event: AITraceEvent = {
      ...input,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.events.push(event);
    return event;
  }
}
