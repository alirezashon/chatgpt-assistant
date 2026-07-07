import { workspaceStore } from '@/app/workspace';
import { DEFAULT_SETTINGS } from '@/constants/settings';
import { DEFAULT_AI_CONFIG, type AIConfig } from '@/features/ai/ai-config';
import { AIEngine } from '@/features/ai/ai-engine';
import {
  AIEvents,
  type AIEventListener,
  type AIEventName,
  type AIEventUnsubscribe,
} from '@/features/ai/ai-events';
import { AIHistory } from '@/features/ai/ai-history';
import { StorageAIRepository, type AIRepository } from '@/features/ai/ai-repository';
import { normalizeAISettings } from '@/features/ai/ai-settings';
import { aiStore } from '@/features/ai/ai-store';
import { AITaskManager } from '@/features/ai/ai-task-manager';
import type {
  AIContext,
  AIJob,
  AIJobPriority,
  AIProvider,
  AISettings,
  AIState,
  AITaskRequest,
  AITaskType,
} from '@/features/ai/ai-types';
import { createAICacheKey, createAIId, createAITimestamp } from '@/features/ai/ai-utils';
import type { EntityId } from '@/shared/types';
import type { Store } from '@/state';
import { ChromeStorageDriver } from '@/storage';

export interface AISubmitTaskInput {
  readonly conversationId?: EntityId;
  readonly folderId?: EntityId;
  readonly input: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly priority?: AIJobPriority;
  readonly promptId?: string;
  readonly type: AITaskType;
}

export interface AIService {
  cancelJob(jobId: EntityId): boolean;
  clearCache(): Promise<void>;
  getState(): AIState;
  initialize(): Promise<void>;
  registerProvider(provider: AIProvider): void;
  submitTask(input: AISubmitTaskInput): Promise<AIJob>;
  subscribe<EventName extends AIEventName>(
    eventName: EventName,
    listener: AIEventListener<EventName>,
  ): AIEventUnsubscribe;
  updateSettings(settings: Partial<AISettings>): Promise<AISettings>;
}

interface AIServiceOptions {
  readonly config?: AIConfig;
  readonly engine?: AIEngine;
  readonly events?: AIEvents;
  readonly repository: AIRepository;
  readonly store?: Store<AIState>;
}

export class DefaultAIService implements AIService {
  private readonly config: AIConfig;
  private readonly engine: AIEngine;
  private readonly events: AIEvents;
  private readonly history: AIHistory;
  private readonly repository: AIRepository;
  private readonly store: Store<AIState>;
  private readonly taskManager: AITaskManager;
  private initialized = false;

  public constructor(options: AIServiceOptions) {
    this.config = options.config ?? DEFAULT_AI_CONFIG;
    this.engine = options.engine ?? new AIEngine(this.config);
    this.events = options.events ?? new AIEvents();
    this.history = new AIHistory(this.config);
    this.repository = options.repository;
    this.store = options.store ?? aiStore;
    this.taskManager = new AITaskManager({
      config: this.config,
      engine: this.engine,
      events: this.events,
      history: this.history,
      repository: this.repository,
      store: this.store,
    });
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    const [settings, history, cache] = await Promise.all([
      this.repository.getSettings(),
      this.repository.getHistory(),
      this.repository.getCache(),
    ]);

    this.history.hydrate(history);
    this.engine.cache.hydrate(cache);
    this.store.setState({
      error: null,
      history,
      settings,
      status: settings.enabled ? 'ready' : 'disabled',
    });
  }

  public getState(): AIState {
    return this.store.getState();
  }

  public registerProvider(provider: AIProvider): void {
    this.engine.registry.registerProvider(provider);
    this.events.emit('aiProviderRegistered', {
      providerId: provider.id,
    });
  }

  public async submitTask(input: AISubmitTaskInput): Promise<AIJob> {
    await this.initialize();
    const request: AITaskRequest = {
      context: this.createContext(input.conversationId, input.folderId),
      createdAt: createAITimestamp(),
      id: createAIId('ai-task'),
      input: input.input,
      metadata: input.metadata ?? {},
      type: input.type,
      ...(input.promptId === undefined ? {} : { promptId: input.promptId }),
    };
    const job = this.taskManager.enqueue(
      {
        ...request,
        cacheKey: createAICacheKey(request),
      },
      input.priority ?? this.config.defaultPriority,
    );

    return job;
  }

  public cancelJob(jobId: EntityId): boolean {
    return this.taskManager.cancel(jobId);
  }

  public async updateSettings(settings: Partial<AISettings>): Promise<AISettings> {
    const nextSettings = normalizeAISettings({
      ...this.store.getState().settings,
      ...settings,
    });

    await this.repository.saveSettings(nextSettings);
    this.store.setState({
      settings: nextSettings,
      status: nextSettings.enabled ? 'ready' : 'disabled',
    });
    this.events.emit('aiSettingsUpdated', {
      providerId: nextSettings.providerId,
    });

    return nextSettings;
  }

  public async clearCache(): Promise<void> {
    this.engine.cache.clear();
    await this.repository.clearCache();
    this.events.emit('aiCacheInvalidated', {
      reason: 'manual-clear',
    });
  }

  public subscribe<EventName extends AIEventName>(
    eventName: EventName,
    listener: AIEventListener<EventName>,
  ): AIEventUnsubscribe {
    return this.events.subscribe(eventName, listener);
  }

  private createContext(conversationId?: EntityId, folderId?: EntityId): AIContext {
    const workspace = workspaceStore.getState();
    const conversation =
      conversationId === undefined
        ? undefined
        : workspace.conversations.conversations.find(
            (candidate) => candidate.id === conversationId,
          );
    const folder =
      folderId === undefined
        ? undefined
        : workspace.folders.folders.find((candidate) => candidate.id === folderId);

    return {
      ...(conversation === undefined ? {} : { conversation }),
      ...(folder === undefined ? {} : { folder }),
      preferences: DEFAULT_SETTINGS,
      recentActivity: workspace.conversations.conversations
        .slice()
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 20)
        .map((conversation) => conversation.id),
      workspace,
    };
  }
}

let defaultAIService: AIService | null = null;

export function configureAIService(service: AIService): void {
  defaultAIService = service;
}

export function getAIService(): AIService {
  defaultAIService ??= new DefaultAIService({
    repository: new StorageAIRepository(new ChromeStorageDriver()),
  });

  return defaultAIService;
}
