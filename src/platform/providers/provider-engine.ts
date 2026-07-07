import type { ProviderAdapter, ProviderContext } from '@/platform/providers/provider-adapter';
import { DefaultProviderAuthentication } from '@/platform/providers/provider-authentication';
import { ProviderCache } from '@/platform/providers/provider-cache';
import { DEFAULT_PROVIDER_CONFIG, type ProviderConfig } from '@/platform/providers/provider-config';
import { ProviderEvents } from '@/platform/providers/provider-events';
import { ProviderFactory } from '@/platform/providers/provider-factory';
import { ProviderLifecycle } from '@/platform/providers/provider-lifecycle';
import { ProviderMessagePipeline } from '@/platform/providers/provider-message-pipeline';
import { ProviderRegistry } from '@/platform/providers/provider-registry';
import { ProviderSessionStore } from '@/platform/providers/provider-session';
import { providerPlatformStore } from '@/platform/providers/provider-state';
import { ProviderStreaming } from '@/platform/providers/provider-streaming';
import { ProviderTelemetry } from '@/platform/providers/provider-telemetry';
import type { ProviderConversation, ProviderHistory } from '@/platform/providers/provider-types';
import type { Store } from '@/state';

export class ProviderEngine {
  public readonly cache: ProviderCache<unknown>;
  public readonly events: ProviderEvents;
  public readonly factory: ProviderFactory;
  public readonly lifecycle: ProviderLifecycle;
  public readonly pipeline: ProviderMessagePipeline;
  public readonly registry: ProviderRegistry;
  public readonly streaming: ProviderStreaming;
  public readonly telemetry: ProviderTelemetry;

  private readonly sessions = new ProviderSessionStore();
  private readonly store: Store<ReturnType<typeof providerPlatformStore.getState>>;

  public constructor(config: ProviderConfig = DEFAULT_PROVIDER_CONFIG) {
    this.events = new ProviderEvents();
    this.registry = new ProviderRegistry();
    this.factory = new ProviderFactory(this.registry, this.events);
    this.lifecycle = new ProviderLifecycle(
      new DefaultProviderAuthentication(),
      this.sessions,
      this.events,
    );
    this.pipeline = new ProviderMessagePipeline();
    this.streaming = new ProviderStreaming(this.events);
    this.cache = new ProviderCache(config);
    this.telemetry = new ProviderTelemetry(config);
    this.store = providerPlatformStore;

    this.events.subscribe('providerRegistered', () => this.syncState());
    this.events.subscribe('providerConnected', () => this.syncState());
    this.events.subscribe('providerDisconnected', () => this.syncState());
  }

  public registerAdapter(adapter: ProviderAdapter): void {
    this.factory.registerAdapter(adapter);
  }

  public async connect(providerId: string, context: ProviderContext): Promise<void> {
    const adapter = this.registry.getAdapter(providerId);

    await this.lifecycle.connect(adapter, context);
    this.events.emit('providerChanged', {
      providerId,
    });
    this.telemetry.record({
      metadata: {},
      name: 'provider_connected',
      providerId,
    });
  }

  public async disconnect(providerId: string): Promise<void> {
    await this.lifecycle.disconnect(this.registry.getAdapter(providerId));
  }

  public async openConversation(
    providerId: string,
    conversationId: string,
  ): Promise<ProviderConversation> {
    const conversation = await this.registry
      .getAdapter(providerId)
      .openConversation(conversationId);

    this.events.emit('conversationOpened', {
      conversation,
    });

    return conversation;
  }

  public async getHistory(providerId: string, conversationId: string): Promise<ProviderHistory> {
    return await this.registry.getAdapter(providerId).getHistory(conversationId);
  }

  public getState() {
    return this.store.getState();
  }

  private syncState(): void {
    this.store.setState({
      providers: this.registry.listIdentities(),
      sessions: this.sessions.values(),
      status: 'ready',
    });
  }
}

let defaultProviderEngine: ProviderEngine | null = null;

export function getProviderEngine(): ProviderEngine {
  defaultProviderEngine ??= new ProviderEngine();

  return defaultProviderEngine;
}
