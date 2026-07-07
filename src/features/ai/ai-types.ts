import type { WorkspaceRuntimeState } from '@/app/workspace';
import type { Chat, EntityId, Folder, ISODateTimeString, WorkspaceSettings } from '@/shared/types';

export type AIProviderKind =
  'anthropic' | 'deepseek' | 'gemini' | 'grok' | 'local' | 'openai' | 'openrouter';

export type AITaskType =
  | 'auto-folder-suggestion'
  | 'conversation-naming'
  | 'conversation-summarization'
  | 'duplicate-detection'
  | 'extract-topics'
  | 'find-similar'
  | 'future-ai-agent'
  | 'natural-language-search'
  | 'prompt-recommendation'
  | 'related-conversations'
  | 'tag-recommendation'
  | 'workspace-analytics'
  | 'workspace-cleanup';

export type AIActionId =
  | 'categorize'
  | 'explain'
  | 'extract-topics'
  | 'find-similar'
  | 'generate-notes'
  | 'rewrite'
  | 'suggest-folder'
  | 'summarize'
  | 'translate';

export type AIJobPriority = 'critical' | 'high' | 'low' | 'normal';
export type AIJobStatus = 'cancelled' | 'failed' | 'queued' | 'retrying' | 'running' | 'succeeded';
export type AIPlatformStatus = 'disabled' | 'error' | 'idle' | 'ready' | 'running';

export interface AIProviderCapability {
  readonly maxInputTokens?: number;
  readonly streaming: boolean;
  readonly supportsEmbeddings: boolean;
  readonly supportsStructuredOutput: boolean;
  readonly taskTypes: readonly AITaskType[];
}

export interface AIContext {
  readonly conversation?: Chat;
  readonly folder?: Folder;
  readonly notes?: readonly string[];
  readonly preferences: WorkspaceSettings;
  readonly recentActivity: readonly EntityId[];
  readonly workspace: WorkspaceRuntimeState;
}

export interface AITaskRequest {
  readonly cacheKey?: string;
  readonly context: AIContext;
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly input: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly promptId?: string;
  readonly type: AITaskType;
}

export interface AIProviderResponse {
  readonly content: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly model?: string;
  readonly providerId: string;
  readonly usage?: AIUsage;
}

export interface AIUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export interface AITaskResult {
  readonly content: string;
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly providerId?: string;
  readonly taskId: EntityId;
  readonly type: AITaskType;
}

export interface AIProvider {
  readonly capabilities: AIProviderCapability;
  readonly id: string;
  readonly kind: AIProviderKind;
  readonly label: string;
  executeTask(request: AITaskRequest, signal: AbortSignal): Promise<AIProviderResponse>;
}

export interface AIJob {
  readonly attempts: number;
  readonly completedAt?: ISODateTimeString;
  readonly createdAt: ISODateTimeString;
  readonly error?: string;
  readonly id: EntityId;
  readonly maxRetries: number;
  readonly priority: AIJobPriority;
  readonly progress: number;
  readonly request: AITaskRequest;
  readonly result?: AITaskResult;
  readonly startedAt?: ISODateTimeString;
  readonly status: AIJobStatus;
  readonly updatedAt: ISODateTimeString;
}

export interface AIHistoryEntry {
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly jobId: EntityId;
  readonly providerId?: string;
  readonly status: AIJobStatus;
  readonly taskType: AITaskType;
}

export interface AICacheEntry {
  readonly createdAt: ISODateTimeString;
  readonly expiresAt: ISODateTimeString;
  readonly id: EntityId;
  readonly key: string;
  readonly result: AITaskResult;
  readonly taskType: AITaskType;
  readonly version: string;
}

export interface AISettings {
  readonly cacheEnabled: boolean;
  readonly enabled: boolean;
  readonly localOnly: boolean;
  readonly maxConcurrentJobs: number;
  readonly providerId: string | null;
  readonly requireExplicitConsent: boolean;
}

export interface AIActionDefinition {
  readonly description: string;
  readonly id: AIActionId;
  readonly label: string;
  readonly taskType: AITaskType;
}

export interface AIPromptTemplate {
  readonly id: string;
  readonly taskType: AITaskType;
  readonly template: string;
  readonly version: string;
}

export interface AIEmbeddingVector {
  readonly dimensions: number;
  readonly values: readonly number[];
}

export interface AIEmbeddingCacheEntry {
  readonly createdAt: ISODateTimeString;
  readonly expiresAt: ISODateTimeString;
  readonly id: EntityId;
  readonly key: string;
  readonly vector: AIEmbeddingVector;
  readonly version: string;
}

export interface AITextChunk {
  readonly content: string;
  readonly endOffset: number;
  readonly id: EntityId;
  readonly index: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly sourceId: EntityId;
  readonly startOffset: number;
}

export interface AISemanticDocument {
  readonly content: string;
  readonly embedding?: AIEmbeddingVector;
  readonly id: EntityId;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly sourceId: EntityId;
  readonly updatedAt: ISODateTimeString;
}

export interface AIState {
  readonly activeJobs: readonly AIJob[];
  readonly error: Error | null;
  readonly history: readonly AIHistoryEntry[];
  readonly settings: AISettings;
  readonly status: AIPlatformStatus;
}
