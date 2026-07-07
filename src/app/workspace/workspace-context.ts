import type { WorkspaceEngineConfig } from '@/app/workspace/workspace-config';
import type { WorkspaceEvents } from '@/app/workspace/workspace-events';
import type { WorkspaceLifecycle } from '@/app/workspace/workspace-lifecycle';
import type { WorkspaceRegistry } from '@/app/workspace/workspace-registry';
import type { WorkspaceRuntimeState } from '@/app/workspace/workspace-types';
import type { SynchronizationEngine } from '@/app/synchronization';
import type { AssignmentService } from '@/features/assignments';
import type {
  ConversationDetector,
  ConversationRepository,
  ConversationService,
} from '@/features/conversations';
import type { FolderService } from '@/features/folders';
import type { Logger } from '@/shared/logger';
import type { Store } from '@/state';
import type { StorageDriver } from '@/storage';

export interface WorkspaceContext {
  readonly assignmentService: AssignmentService;
  readonly config: WorkspaceEngineConfig;
  readonly conversationDetector: ConversationDetector;
  readonly conversationRepository: ConversationRepository;
  readonly conversationService: ConversationService;
  readonly events: WorkspaceEvents;
  readonly folderService: FolderService;
  readonly lifecycle: WorkspaceLifecycle;
  readonly logger: Logger;
  readonly registry: WorkspaceRegistry;
  readonly state: Store<WorkspaceRuntimeState>;
  readonly storage: StorageDriver;
  readonly synchronizationEngine: SynchronizationEngine;
}
