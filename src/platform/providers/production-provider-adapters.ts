import type { ProviderAdapter } from '@/platform/providers/provider-adapter';
import { ProviderError } from '@/platform/providers/provider-errors';
import type {
  ProviderCapabilities,
  ProviderConversation,
  ProviderHistory,
  ProviderIdentity,
  ProviderKind,
  ProviderMessage,
  ProviderSession,
} from '@/platform/providers/provider-types';

type ProductionProviderDefinition = Readonly<{
  authStrategies: ProviderCapabilities['authStrategies'];
  displayName: string;
  featureFlags: readonly string[];
  id: string;
  kind: ProviderKind;
  requestsPerMinute?: number;
  supportedCapabilities: ProviderCapabilities['supportedCapabilities'];
}>;

const PRODUCTION_PROVIDER_DEFINITIONS: readonly ProductionProviderDefinition[] = [
  {
    authStrategies: ['api-key'],
    displayName: 'OpenAI API',
    featureFlags: ['chat-completions', 'responses-api'],
    id: 'openai-api',
    kind: 'openai-api',
    requestsPerMinute: 60,
    supportedCapabilities: ['streaming', 'tool-calling', 'vision', 'file-upload'],
  },
  {
    authStrategies: ['api-key'],
    displayName: 'Anthropic API',
    featureFlags: ['messages-api'],
    id: 'anthropic-api',
    kind: 'anthropic-api',
    requestsPerMinute: 50,
    supportedCapabilities: ['streaming', 'vision', 'pdf-upload', 'tool-calling'],
  },
  {
    authStrategies: ['api-key', 'oauth'],
    displayName: 'Gemini',
    featureFlags: ['generate-content'],
    id: 'gemini',
    kind: 'gemini',
    requestsPerMinute: 60,
    supportedCapabilities: ['streaming', 'vision', 'file-upload', 'tool-calling'],
  },
  {
    authStrategies: ['api-key'],
    displayName: 'OpenRouter',
    featureFlags: ['multi-model-routing'],
    id: 'openrouter',
    kind: 'openrouter',
    requestsPerMinute: 40,
    supportedCapabilities: ['streaming', 'vision', 'tool-calling'],
  },
  {
    authStrategies: ['local'],
    displayName: 'Local LLM',
    featureFlags: ['offline-inference'],
    id: 'local-llm',
    kind: 'local-llm',
    supportedCapabilities: ['streaming'],
  },
];

export function createProductionProviderAdapters(): readonly ProviderAdapter[] {
  return PRODUCTION_PROVIDER_DEFINITIONS.map(
    (definition) => new NotConfiguredProductionProviderAdapter(definition),
  );
}

export function registerProductionProviderAdapters(registry: {
  registerAdapter(adapter: ProviderAdapter): void;
}): void {
  for (const adapter of createProductionProviderAdapters()) {
    registry.registerAdapter(adapter);
  }
}

class NotConfiguredProductionProviderAdapter implements ProviderAdapter {
  public readonly capabilities: ProviderCapabilities;
  public readonly identity: ProviderIdentity;

  public constructor(definition: ProductionProviderDefinition) {
    this.identity = {
      displayName: definition.displayName,
      id: definition.id,
      kind: definition.kind,
      version: '1.0.0',
    };
    this.capabilities = {
      authStrategies: definition.authStrategies,
      featureFlags: definition.featureFlags,
      rateLimits:
        definition.requestsPerMinute === undefined
          ? {}
          : {
              requestsPerMinute: definition.requestsPerMinute,
            },
      supportedAttachments: [],
      supportedCapabilities: definition.supportedCapabilities,
    };
  }

  public authenticate(): Promise<ProviderSession> {
    return Promise.reject(this.createConfigurationError());
  }

  public disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public getHistory(): Promise<ProviderHistory> {
    return Promise.reject(this.createConfigurationError());
  }

  public listConversations(): Promise<readonly ProviderConversation[]> {
    return Promise.reject(this.createConfigurationError());
  }

  public openConversation(): Promise<ProviderConversation> {
    return Promise.reject(this.createConfigurationError());
  }

  public sendMessage(): Promise<ProviderMessage> {
    return Promise.reject(this.createConfigurationError());
  }

  private createConfigurationError(): ProviderError {
    return new ProviderError(
      'PROVIDER_NOT_CONFIGURED',
      `${this.identity.displayName} adapter is registered but not configured yet.`,
    );
  }
}
