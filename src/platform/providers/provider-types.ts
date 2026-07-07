import type { EntityId, ISODateTimeString } from '@/shared/types';

export type ProviderKind =
  | 'anthropic-api'
  | 'browser-session'
  | 'chatgpt'
  | 'claude'
  | 'deepseek'
  | 'gemini'
  | 'grok'
  | 'local-llm'
  | 'openai-api'
  | 'openrouter'
  | 'perplexity'
  | 'unknown';

export type ProviderAuthStrategy =
  'api-key' | 'browser-session' | 'enterprise' | 'local' | 'oauth' | 'token-refresh';

export type ProviderCapabilityKey =
  | 'attachments'
  | 'canvas'
  | 'code-interpreter'
  | 'file-upload'
  | 'images'
  | 'mcp'
  | 'memory'
  | 'pdf-upload'
  | 'streaming'
  | 'tool-calling'
  | 'vision'
  | 'voice';

export type ProviderRole = 'assistant' | 'system' | 'tool' | 'user';
export type ProviderConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type ProviderStreamingStatus = 'cancelled' | 'completed' | 'error' | 'paused' | 'running';
export type ProviderFeatureFlag = string;

export type ProviderMetadata = Readonly<Record<string, string | number | boolean | null>>;

export interface ProviderIdentity {
  readonly displayName: string;
  readonly id: EntityId;
  readonly kind: ProviderKind;
  readonly version: string;
}

export interface ProviderCapabilities {
  readonly authStrategies: readonly ProviderAuthStrategy[];
  readonly featureFlags: readonly ProviderFeatureFlag[];
  readonly maxAttachmentBytes?: number;
  readonly rateLimits: ProviderRateLimits;
  readonly supportedAttachments: readonly ProviderAttachmentKind[];
  readonly supportedCapabilities: readonly ProviderCapabilityKey[];
}

export type ProviderAttachmentKind = 'audio' | 'code' | 'document' | 'image' | 'pdf' | 'video';

export interface ProviderRateLimits {
  readonly maxConcurrentStreams?: number;
  readonly requestsPerMinute?: number;
  readonly tokensPerMinute?: number;
}

export interface ProviderUser {
  readonly id: EntityId;
  readonly metadata: ProviderMetadata;
  readonly name: string;
}

export interface ProviderAssistant {
  readonly id: EntityId;
  readonly metadata: ProviderMetadata;
  readonly name: string;
}

export interface ProviderWorkspace {
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly metadata: ProviderMetadata;
  readonly name: string;
  readonly scope: 'cloud' | 'company' | 'local' | 'personal' | 'shared' | 'team';
  readonly updatedAt: ISODateTimeString;
}

export interface ProviderAttachment {
  readonly bytes?: number;
  readonly contentType: string;
  readonly id: EntityId;
  readonly kind: ProviderAttachmentKind;
  readonly metadata: ProviderMetadata;
  readonly name: string;
  readonly url?: string;
}

export interface ProviderMessage {
  readonly attachments: readonly ProviderAttachment[];
  readonly content: string;
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly metadata: ProviderMetadata;
  readonly role: ProviderRole;
  readonly threadId: EntityId;
}

export interface ProviderConversation {
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly metadata: ProviderMetadata;
  readonly providerId: EntityId;
  readonly title: string;
  readonly updatedAt: ISODateTimeString;
  readonly url?: string;
  readonly workspaceId?: EntityId;
}

export interface ProviderThread {
  readonly conversationId: EntityId;
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly messageIds: readonly EntityId[];
  readonly metadata: ProviderMetadata;
  readonly updatedAt: ISODateTimeString;
}

export interface ProviderHistory {
  readonly conversationId: EntityId;
  readonly messages: readonly ProviderMessage[];
  readonly threads: readonly ProviderThread[];
}

export interface ProviderSession {
  readonly createdAt: ISODateTimeString;
  readonly expiresAt?: ISODateTimeString;
  readonly id: EntityId;
  readonly metadata: ProviderMetadata;
  readonly providerId: EntityId;
  readonly status: ProviderConnectionStatus;
  readonly user?: ProviderUser;
}
