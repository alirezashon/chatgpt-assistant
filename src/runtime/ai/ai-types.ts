import type { CancellationToken, Disposable } from '@/runtime/utils';

/** AI task families used for model routing. */
export type AITaskType =
  | 'automation'
  | 'classification'
  | 'code-review'
  | 'coding'
  | 'conversation'
  | 'embedding'
  | 'extraction'
  | 'planning'
  | 'reasoning'
  | 'research'
  | 'rewrite'
  | 'summarization'
  | 'translation'
  | 'vision';

/** Privacy routing mode. */
export type AIPrivacyMode = 'balanced' | 'maximum-privacy' | 'maximum-quality';

/** AI provider identifier. */
export type AIProviderId = string;

/** AI model identifier. */
export type AIModelId = string;

/** Supported model capability. */
export type AIModelCapability =
  | 'analysis'
  | 'audio'
  | 'coding'
  | 'document-understanding'
  | 'embeddings'
  | 'function-calling'
  | 'json-output'
  | 'local'
  | 'moderation'
  | 'planning'
  | 'reasoning'
  | 'research'
  | 'streaming'
  | 'text-generation'
  | 'tool-use'
  | 'vision';

/** Provider authentication mode. */
export type AIAuthenticationMode = 'api-key' | 'none' | 'oauth' | 'system';

/** AI provider status. */
export type AIProviderAvailability = 'available' | 'degraded' | 'offline' | 'unavailable';

/** Price metadata per million tokens. */
export interface AIModelPricing {
  /** Input token cost per million. */
  readonly inputPerMillion: number;
  /** Output token cost per million. */
  readonly outputPerMillion: number;
  /** Currency code. */
  readonly currency: string;
}

/** AI model metadata used by router and cost manager. */
export interface AIModelMetadata {
  /** Model id. */
  readonly id: AIModelId;
  /** Provider id. */
  readonly providerId: AIProviderId;
  /** Display name. */
  readonly name: string;
  /** Capability ids. */
  readonly capabilities: readonly AIModelCapability[];
  /** Maximum context window in tokens. */
  readonly contextWindowTokens: number;
  /** Maximum output tokens. */
  readonly maxOutputTokens: number;
  /** Pricing metadata. */
  readonly pricing: AIModelPricing;
  /** Expected median latency. */
  readonly latencyMs: number;
  /** Quality score from 0 to 1. */
  readonly quality: number;
  /** Security level from 0 to 1. */
  readonly securityLevel?: number;
  /** Availability score from 0 to 1. */
  readonly availabilityScore?: number;
  /** Whether model is approved for enterprise data. */
  readonly enterpriseApproved?: boolean;
  /** Data residency region. */
  readonly dataResidency?: string;
}

/** Provider-level metadata. */
export interface AIProviderMetadata {
  /** Provider id. */
  readonly id: AIProviderId;
  /** Display name. */
  readonly name: string;
  /** Authentication mode. */
  readonly authentication: AIAuthenticationMode;
  /** Provider capabilities. */
  readonly capabilities: readonly AIModelCapability[];
  /** Whether provider is local to the device/network. */
  readonly local: boolean;
}

/** Chat-style prompt message. */
export interface AIPromptMessage {
  /** Message role. */
  readonly role: 'assistant' | 'system' | 'user';
  /** Message content. */
  readonly content: string;
}

/** Prompt template. */
export interface AIPromptTemplate {
  /** Stable template id. */
  readonly id: string;
  /** Template version. */
  readonly version: number;
  /** System prompt template. */
  readonly system: string;
  /** User prompt template. */
  readonly user: string;
}

/** AI runtime request. */
export interface AIRequest {
  /** Stable request id. */
  readonly id: string;
  /** Task type. */
  readonly taskType: AITaskType;
  /** User intent. */
  readonly intent: string;
  /** Prompt template id. */
  readonly promptTemplateId: string;
  /** Template variables. */
  readonly variables: Readonly<Record<string, string>>;
  /** Context chunks ordered by priority. */
  readonly context: readonly AIContextChunk[];
  /** Required model capabilities. */
  readonly requiredCapabilities: readonly AIModelCapability[];
  /** Privacy mode. */
  readonly privacyMode: AIPrivacyMode;
  /** Optional preferred model id. */
  readonly preferredModelId?: AIModelId;
  /** Maximum budget for request. */
  readonly maxCostUsd?: number;
  /** Optional maximum output tokens. */
  readonly maxOutputTokens?: number;
  /** Optional cache ttl. Zero disables caching. */
  readonly cacheTtlMs?: number;
  /** Enables streaming. */
  readonly stream: boolean;
  /** Cancellation token. */
  readonly cancellationToken?: CancellationToken;
}

/** Context chunk before token budgeting. */
export interface AIContextChunk {
  /** Stable chunk id. */
  readonly id: string;
  /** Chunk content. */
  readonly content: string;
  /** Priority, higher is more important. */
  readonly priority: number;
  /** Sensitivity label. */
  readonly sensitivity: 'confidential' | 'personal' | 'public' | 'restricted';
  /** Approximate token count. */
  readonly estimatedTokens?: number;
}

/** Built provider request. */
export interface AIProviderRequest {
  /** Request id. */
  readonly id: string;
  /** Model metadata. */
  readonly model: AIModelMetadata;
  /** Prompt messages. */
  readonly messages: readonly AIPromptMessage[];
  /** Maximum output tokens. */
  readonly maxOutputTokens: number;
  /** Streaming enabled. */
  readonly stream: boolean;
  /** Cancellation token. */
  readonly cancellationToken?: CancellationToken;
}

/** Streaming chunk. */
export interface AIStreamChunk {
  /** Chunk text. */
  readonly text: string;
  /** True when stream is complete. */
  readonly done: boolean;
}

/** Provider response. */
export interface AIProviderResponse {
  /** Model id used. */
  readonly modelId: AIModelId;
  /** Provider id used. */
  readonly providerId: AIProviderId;
  /** Final output text. */
  readonly text: string;
  /** Input tokens. */
  readonly inputTokens: number;
  /** Output tokens. */
  readonly outputTokens: number;
}

/** AI runtime response. */
export interface AIResponse extends AIProviderResponse {
  /** Cost estimate in USD. */
  readonly costUsd: number;
  /** True when response came from cache. */
  readonly cached: boolean;
  /** Evaluation score from 0 to 1. */
  readonly evaluationScore: number;
}

/** Provider adapter contract. */
export interface AIProviderAdapter extends Disposable {
  /** Provider metadata. */
  readonly metadata: AIProviderMetadata;
  /** Returns current availability. */
  availability(): Promise<AIProviderAvailability> | AIProviderAvailability;
  /** Returns supported models. */
  models(): Promise<readonly AIModelMetadata[]> | readonly AIModelMetadata[];
  /** Executes a request. */
  complete(request: AIProviderRequest): Promise<AIProviderResponse>;
  /** Streams a request. */
  stream?(request: AIProviderRequest): AsyncIterable<AIStreamChunk>;
  /** Embeds text or document content. */
  embed?(input: string): Promise<readonly number[]>;
  /** Moderates text or multimodal content. */
  moderate?(input: string): Promise<{ readonly flagged: boolean; readonly categories: readonly string[] }>;
  /** Executes a vision request. */
  vision?(request: AIProviderRequest): Promise<AIProviderResponse>;
  /** Executes an audio request. */
  audio?(request: AIProviderRequest): Promise<AIProviderResponse>;
  /** Executes provider-native tool calling. */
  toolCalling?(request: AIProviderRequest): Promise<AIProviderResponse>;
}

/** AI model health metadata. */
export interface AIModelHealth {
  /** Model id. */
  readonly modelId: AIModelId;
  /** Provider id. */
  readonly providerId: AIProviderId;
  /** Availability. */
  readonly availability: AIProviderAvailability;
  /** Rolling success rate. */
  readonly successRate: number;
  /** Rolling latency. */
  readonly latencyMs: number;
  /** Last checked timestamp. */
  readonly checkedAt: number;
}

/** Classified task. */
export interface AIClassifiedTask {
  /** Task type. */
  readonly taskType: AITaskType;
  /** Required capabilities. */
  readonly requiredCapabilities: readonly AIModelCapability[];
  /** Quality requirement from 0 to 1. */
  readonly qualityRequirement: number;
  /** Latency requirement. */
  readonly latencyRequirementMs: number;
  /** Reason. */
  readonly reason: string;
}

/** Tool definition exposed to models. */
export interface AIToolDefinition {
  /** Tool name. */
  readonly name: string;
  /** Description. */
  readonly description: string;
  /** Input schema version. */
  readonly schemaVersion: number;
  /** Required permissions. */
  readonly permissions: readonly string[];
}

/** Tool call requested by model. */
export interface AIToolCall {
  /** Call id. */
  readonly id: string;
  /** Tool name. */
  readonly name: string;
  /** Input value. */
  readonly input: Readonly<Record<string, unknown>>;
}

/** Tool executor. */
export interface AIToolExecutor {
  /** Definition. */
  readonly definition: AIToolDefinition;
  /** Executes tool. */
  execute(call: AIToolCall): Promise<string>;
}

/** AI trace event. */
export interface AITraceEvent {
  /** Trace id. */
  readonly id: string;
  /** Request id. */
  readonly requestId: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Event type. */
  readonly type: 'cache-hit' | 'completed' | 'failed' | 'fallback' | 'routed' | 'tool-called';
  /** Provider id. */
  readonly providerId?: AIProviderId;
  /** Model id. */
  readonly modelId?: AIModelId;
  /** Latency. */
  readonly latencyMs?: number;
  /** Cost. */
  readonly costUsd?: number;
  /** Quality score. */
  readonly qualityScore?: number;
  /** Message. */
  readonly message: string;
}

/** Model routing input. */
export interface AIModelRouteRequest {
  /** Runtime request. */
  readonly request: AIRequest;
  /** Estimated input tokens. */
  readonly estimatedInputTokens: number;
}

/** Model routing strategy. */
export type AIModelRoutingStrategy =
  'balanced' | 'highest-quality' | 'lowest-cost' | 'lowest-latency';

/** Model routing policy weights. */
export interface AIModelRoutingPolicy {
  /** Routing strategy. */
  readonly strategy: AIModelRoutingStrategy;
  /** Cost importance from 0 to 1. */
  readonly costWeight: number;
  /** Latency importance from 0 to 1. */
  readonly latencyWeight: number;
  /** Quality importance from 0 to 1. */
  readonly qualityWeight: number;
}

/** Route decision returned by the model router. */
export interface AIModelRouteDecision {
  /** Selected provider. */
  readonly provider: AIProviderAdapter;
  /** Selected model. */
  readonly model: AIModelMetadata;
  /** Candidate score from 0 to 1. */
  readonly score: number;
  /** Estimated request cost. */
  readonly estimatedCostUsd: number;
  /** Human-readable route reason for diagnostics. */
  readonly reason: string;
}

/** Prepared provider request and related accounting metadata. */
export interface AIPreparedRequest {
  /** Original runtime request. */
  readonly request: AIRequest;
  /** Provider-level request. */
  readonly providerRequest: AIProviderRequest;
  /** Cache key if caching is allowed. */
  readonly cacheKey?: string;
  /** Estimated input tokens. */
  readonly estimatedInputTokens: number;
  /** Estimated output tokens. */
  readonly estimatedOutputTokens: number;
  /** Estimated request cost. */
  readonly estimatedCostUsd: number;
}

/** Result of a runtime task. */
export interface AITaskHandle {
  /** Task id. */
  readonly id: string;
  /** Cancels task execution. */
  cancel(): void;
}
