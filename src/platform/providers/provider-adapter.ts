import type {
  ProviderCapabilities,
  ProviderConversation,
  ProviderHistory,
  ProviderIdentity,
  ProviderMessage,
  ProviderSession,
} from '@/platform/providers/provider-types';

export interface ProviderContext {
  readonly permissions: readonly string[];
  readonly workspaceId: string;
}

export interface ProviderSendMessageInput {
  readonly content: string;
  readonly conversationId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProviderAdapter {
  readonly capabilities: ProviderCapabilities;
  readonly identity: ProviderIdentity;
  authenticate(context: ProviderContext): Promise<ProviderSession>;
  disconnect(sessionId: string): Promise<void>;
  getHistory(conversationId: string): Promise<ProviderHistory>;
  listConversations(context: ProviderContext): Promise<readonly ProviderConversation[]>;
  openConversation(conversationId: string): Promise<ProviderConversation>;
  sendMessage(input: ProviderSendMessageInput): Promise<ProviderMessage>;
}

export interface ProviderModule {
  readonly id: string;
  register(registry: { registerAdapter(adapter: ProviderAdapter): void }): void;
}
