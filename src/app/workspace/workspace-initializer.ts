import { createDefaultWorkspaceConfig } from '@/app/workspace/workspace-config';
import { WorkspaceEngine } from '@/app/workspace/workspace-engine';
import { WorkspaceEvents } from '@/app/workspace/workspace-events';
import { WorkspaceLifecycle } from '@/app/workspace/workspace-lifecycle';
import { WorkspaceRegistry } from '@/app/workspace/workspace-registry';
import { workspaceStore } from '@/app/workspace/workspace-state';
import type { WorkspaceContext } from '@/app/workspace/workspace-context';
import { configureSynchronizationEngine, createSynchronizationEngine } from '@/app/synchronization';
import { configureAIService, DefaultAIService, StorageAIRepository } from '@/features/ai';
import {
  configureAssignmentService,
  DefaultAssignmentService,
  StorageAssignmentRepository,
} from '@/features/assignments';
import {
  ConversationDetector,
  DefaultConversationService,
  InMemoryConversationRepository,
} from '@/features/conversations';
import { DefaultFolderService, StorageFolderRepository } from '@/features/folders';
import {
  configureSearchService,
  DefaultSearchService,
  StorageSearchRepository,
} from '@/features/search';
import {
  configureFavoriteService,
  DefaultFavoriteService,
  StorageFavoriteRepository,
} from '@/features/favorites';
import { logger } from '@/shared/logger';
import { ChromeStorageDriver } from '@/storage';

let workspaceEngine: WorkspaceEngine | null = null;

export function getWorkspaceEngine(): WorkspaceEngine {
  workspaceEngine ??= createWorkspaceEngine();

  return workspaceEngine;
}

export async function startWorkspaceEngine(): Promise<void> {
  await getWorkspaceEngine().start();
}

export function createWorkspaceEngine(): WorkspaceEngine {
  const config = createDefaultWorkspaceConfig();
  const storage = new ChromeStorageDriver();
  const conversationRepository = new InMemoryConversationRepository();
  const conversationService = new DefaultConversationService({
    repository: conversationRepository,
  });
  const conversationDetector = new ConversationDetector({
    service: conversationService,
  });
  const folderService = new DefaultFolderService({
    repository: new StorageFolderRepository(storage),
  });
  const assignmentService = new DefaultAssignmentService({
    repository: new StorageAssignmentRepository(storage),
    validationProviders: {
      hasConversation: (conversationId) =>
        conversationRepository.getById(conversationId) !== undefined,
      hasFolder: async (folderId) => {
        const folders = await folderService.getFolders();

        return folders.some((folder) => folder.id === folderId);
      },
    },
  });
  configureAssignmentService(assignmentService);
  configureFavoriteService(
    new DefaultFavoriteService({
      repository: new StorageFavoriteRepository(storage),
    }),
  );
  configureSearchService(
    new DefaultSearchService({
      repository: new StorageSearchRepository(storage),
    }),
  );
  configureAIService(
    new DefaultAIService({
      repository: new StorageAIRepository(storage),
    }),
  );
  const events = new WorkspaceEvents(config.eventHistoryLimit);
  const lifecycle = new WorkspaceLifecycle();
  const registry = new WorkspaceRegistry();
  const synchronizationEngine = createSynchronizationEngine(storage);

  configureSynchronizationEngine(synchronizationEngine);

  workspaceStore.setState({
    lifecycle: 'boot',
    workspace: config.workspace,
  });

  const context: WorkspaceContext = {
    assignmentService,
    config,
    conversationDetector,
    conversationRepository,
    conversationService,
    events,
    folderService,
    lifecycle,
    logger,
    registry,
    state: workspaceStore,
    storage,
    synchronizationEngine,
  };

  return new WorkspaceEngine(context);
}
