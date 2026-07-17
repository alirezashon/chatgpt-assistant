import { AIRuntime, type AIRuntimeDependencies } from './ai-runtime';
import { AIContextManager } from './ai-context-manager';
import { AIGovernanceManager, type AIGovernancePolicy } from './ai-governance-manager';
import { AIModelHealthMonitor } from './ai-model-health-monitor';
import { AITaskClassifier } from './ai-task-classifier';
import { AITraceManager } from './ai-trace-manager';
import { AIToolCallingRuntime } from './ai-tool-calling-runtime';
import type {
  AIClassifiedTask,
  AIContextChunk,
  AIModelMetadata,
  AIProviderAdapter,
  AIRequest,
  AIResponse,
  AIToolCall,
} from './ai-types';

/** High-level intelligence request. */
export interface AIIntelligenceRequest {
  /** Request id. */
  readonly id?: string;
  /** Natural-language intent. */
  readonly intent: string;
  /** Input text. */
  readonly input: string;
  /** Prompt template id. */
  readonly promptTemplateId?: string;
  /** Context chunks. */
  readonly context?: readonly AIContextChunk[];
  /** Memory context. */
  readonly memory?: readonly AIContextChunk[];
  /** Knowledge context. */
  readonly knowledge?: readonly AIContextChunk[];
  /** Tool result context. */
  readonly toolResults?: readonly AIContextChunk[];
  /** Privacy mode. */
  readonly privacyMode?: AIRequest['privacyMode'];
  /** Cost budget. */
  readonly maxCostUsd?: number;
  /** Output budget. */
  readonly maxOutputTokens?: number;
  /** Context token budget. */
  readonly contextTokenBudget?: number;
  /** Preferred model id. */
  readonly preferredModelId?: string;
  /** Cache TTL. */
  readonly cacheTtlMs?: number;
}

/** AI operating runtime dependencies. */
export interface AIModelRuntimeDependencies extends AIRuntimeDependencies {
  readonly classifier?: AITaskClassifier;
  readonly contextManager?: AIContextManager;
  readonly governance?: AIGovernanceManager;
  readonly health?: AIModelHealthMonitor;
  readonly runtime?: AIRuntime;
  readonly tools?: AIToolCallingRuntime;
  readonly traces?: AITraceManager;
}

/** AI operating runtime that classifies tasks, prepares context, governs models, executes, traces, and tracks tools. */
export class AIModelRuntime {
  public readonly classifier: AITaskClassifier;
  public readonly contextManager: AIContextManager;
  public readonly governance: AIGovernanceManager;
  public readonly health: AIModelHealthMonitor;
  public readonly runtime: AIRuntime;
  public readonly tools: AIToolCallingRuntime;
  public readonly traces: AITraceManager;

  public constructor(dependencies: AIModelRuntimeDependencies = {}) {
    this.classifier = dependencies.classifier ?? new AITaskClassifier();
    this.contextManager = dependencies.contextManager ?? new AIContextManager();
    this.governance = dependencies.governance ?? new AIGovernanceManager();
    this.health = dependencies.health ?? new AIModelHealthMonitor();
    this.runtime =
      dependencies.runtime ??
      new AIRuntime({
        ...dependencies,
        routeGuard: (request, route) => {
          this.governance.assertAllowed({
            estimatedCostUsd: route.estimatedCostUsd,
            model: route.model,
            privacyMode: request.privacyMode,
            provider: route.provider,
          });
          this.traces.routed(request.id, route);
        },
      });
    this.tools = dependencies.tools ?? new AIToolCallingRuntime();
    this.traces = dependencies.traces ?? new AITraceManager();
    this.runtime.registerPrompt({
      id: 'ai.default',
      system: 'You are a governed AI model runtime. Follow platform policy and use only supplied context.',
      user: '{{input}}',
      version: 1,
    });
  }

  /** Registers provider and records initial model health. */
  public async registerProvider(provider: AIProviderAdapter): Promise<void> {
    await this.runtime.registerProvider(provider);
    await this.health.checkProvider(provider);
  }

  /** Sets enterprise governance policy. */
  public setGovernancePolicy(policy: AIGovernancePolicy): void {
    this.governance.setPolicy(policy);
  }

  /** Executes a high-level intelligence request. */
  public async execute(request: AIIntelligenceRequest): Promise<AIResponse & { readonly classifiedTask: AIClassifiedTask }> {
    const startedAt = Date.now();
    const classifiedTask = this.classifier.classify({ intent: request.intent });
    const context = this.contextManager.prepare({
      tokenBudget: request.contextTokenBudget ?? 3_000,
      ...(request.context === undefined ? {} : { baseContext: request.context }),
      ...(request.knowledge === undefined ? {} : { knowledge: request.knowledge }),
      ...(request.memory === undefined ? {} : { memory: request.memory }),
      ...(request.toolResults === undefined ? {} : { toolResults: request.toolResults }),
    });
    const aiRequest = this.toAIRequest(request, classifiedTask, context);

    try {
      const response = await this.runtime.complete(aiRequest);
      this.traces.completed(aiRequest.id, response, Date.now() - startedAt);
      return { ...response, classifiedTask };
    } catch (error) {
      this.traces.failed(aiRequest.id, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /** Executes model-requested tools and returns context chunks for injection. */
  public async executeToolCalls(requestId: string, calls: readonly AIToolCall[]): Promise<readonly AIContextChunk[]> {
    const chunks: AIContextChunk[] = [];

    for (const call of calls) {
      const result = await this.tools.execute(call);
      this.traces.toolCalled(requestId, call.name);
      chunks.push({
        content: result,
        id: `tool-${call.id}`,
        priority: 80,
        sensitivity: 'public',
      });
    }

    return chunks;
  }

  /** Health snapshot. */
  public modelHealth(): readonly ReturnType<AIModelHealthMonitor['list']>[number][] {
    return this.health.list();
  }

  /** Returns traces. */
  public trace(requestId?: string) {
    return this.traces.list(requestId);
  }

  private toAIRequest(
    request: AIIntelligenceRequest,
    classifiedTask: AIClassifiedTask,
    context: readonly AIContextChunk[],
  ): AIRequest {
    return {
      context,
      id: request.id ?? crypto.randomUUID(),
      intent: request.intent,
      privacyMode: request.privacyMode ?? 'balanced',
      promptTemplateId: request.promptTemplateId ?? 'ai.default',
      requiredCapabilities: classifiedTask.requiredCapabilities,
      stream: false,
      taskType: classifiedTask.taskType,
      variables: {
        input: request.input,
      },
      ...(request.cacheTtlMs === undefined ? {} : { cacheTtlMs: request.cacheTtlMs }),
      ...(request.maxCostUsd === undefined ? {} : { maxCostUsd: request.maxCostUsd }),
      ...(request.maxOutputTokens === undefined ? {} : { maxOutputTokens: request.maxOutputTokens }),
      ...(request.preferredModelId === undefined ? {} : { preferredModelId: request.preferredModelId }),
    };
  }

  /** Asserts a route is governed. Used by custom routers/tests and future host integrations. */
  public assertModelAllowed(input: {
    readonly estimatedCostUsd: number;
    readonly model: AIModelMetadata;
    readonly privacyMode: AIRequest['privacyMode'];
    readonly provider: AIProviderAdapter;
  }): void {
    this.governance.assertAllowed(input);
  }
}
