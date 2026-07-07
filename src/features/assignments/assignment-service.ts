import {
  AssignmentEvents,
  type AssignmentEventListener,
  type AssignmentEventName,
  type AssignmentEventUnsubscribe,
} from '@/features/assignments/assignment-events';
import {
  AssignmentNotFoundError,
  AssignmentValidationError,
} from '@/features/assignments/assignment-errors';
import { createAssignmentModel } from '@/features/assignments/assignment-model';
import type { AssignmentRepository } from '@/features/assignments/assignment-repository';
import { StorageAssignmentRepository } from '@/features/assignments/assignment-repository';
import { assignmentStore } from '@/features/assignments/assignment-store';
import type {
  AssignConversationInput,
  AssignmentState,
  AssignmentValidationIssue,
  ConversationAssignment,
  MoveConversationInput,
  RemoveAssignmentInput,
} from '@/features/assignments/assignment-types';
import { conversationStore } from '@/features/conversations';
import { folderStore } from '@/features/folders';
import type { Store } from '@/state';
import { ChromeStorageDriver, type StorageUnsubscribe } from '@/storage';

export interface AssignmentValidationProviders {
  readonly hasConversation: (conversationId: string) => boolean | Promise<boolean>;
  readonly hasFolder: (folderId: string) => boolean | Promise<boolean>;
}

export interface AssignmentService {
  assign(input: AssignConversationInput): Promise<ConversationAssignment>;
  findByConversation(conversationId: string): Promise<ConversationAssignment | null>;
  findByFolder(folderId: string): Promise<readonly ConversationAssignment[]>;
  initialize(): Promise<void>;
  listAssignments(): Promise<readonly ConversationAssignment[]>;
  move(input: MoveConversationInput): Promise<ConversationAssignment>;
  remove(input: RemoveAssignmentInput): Promise<ConversationAssignment>;
  subscribe<EventName extends AssignmentEventName>(
    eventName: EventName,
    listener: AssignmentEventListener<EventName>,
  ): AssignmentEventUnsubscribe;
}

interface AssignmentServiceOptions {
  readonly clock?: () => Date;
  readonly events?: AssignmentEvents;
  readonly idGenerator?: () => string;
  readonly repository: AssignmentRepository;
  readonly store?: Store<AssignmentState>;
  readonly validationProviders: AssignmentValidationProviders;
}

export class DefaultAssignmentService implements AssignmentService {
  private readonly clock: () => Date;
  private readonly events: AssignmentEvents;
  private readonly idGenerator: () => string;
  private readonly repository: AssignmentRepository;
  private readonly store: Store<AssignmentState>;
  private readonly validationProviders: AssignmentValidationProviders;
  private unsubscribeFromRepository: StorageUnsubscribe | null = null;

  public constructor(options: AssignmentServiceOptions) {
    this.clock = options.clock ?? createCurrentDate;
    this.events = options.events ?? new AssignmentEvents();
    this.idGenerator = options.idGenerator ?? createEntityId;
    this.repository = options.repository;
    this.store = options.store ?? assignmentStore;
    this.validationProviders = options.validationProviders;
  }

  public async initialize(): Promise<void> {
    this.unsubscribeFromRepository ??= this.repository.subscribe(() => {
      void this.synchronizeFromRepository();
    });

    await this.synchronizeFromRepository();
  }

  public async assign(input: AssignConversationInput): Promise<ConversationAssignment> {
    await this.assertCanAssign(input);

    const previousState = this.store.getState();
    const existingAssignment = await this.repository.findByConversation(input.conversationId);
    const timestamp = this.clock().toISOString();
    const assignment =
      existingAssignment === null
        ? createAssignmentModel({
            ...input,
            assignmentId: this.idGenerator(),
            createdAt: timestamp,
          })
        : {
            ...existingAssignment,
            folderId: input.folderId,
            updatedAt: timestamp,
          };

    await this.persistAssignment(assignment, previousState);

    if (existingAssignment === null) {
      this.events.emit('assignmentCreated', { assignment });
    } else {
      this.events.emit('assignmentUpdated', { assignment });
    }

    this.events.emit('folderContentsChanged', {
      folderId: assignment.folderId,
    });

    return assignment;
  }

  public async move(input: MoveConversationInput): Promise<ConversationAssignment> {
    return await this.assign(input);
  }

  public async remove(input: RemoveAssignmentInput): Promise<ConversationAssignment> {
    const previousState = this.store.getState();
    const existingAssignment = await this.repository.findByConversation(input.conversationId);

    if (existingAssignment === null) {
      throw new AssignmentNotFoundError(input.conversationId);
    }

    this.store.setState({
      assignments: previousState.assignments.filter(
        (assignment) => assignment.conversationId !== input.conversationId,
      ),
      error: null,
      status: 'saving',
    });

    try {
      const removedAssignment = await this.repository.remove(input.conversationId);
      await this.synchronizeFromRepository();

      if (removedAssignment === null) {
        throw new AssignmentNotFoundError(input.conversationId);
      }

      this.events.emit('assignmentRemoved', {
        assignment: removedAssignment,
      });
      this.events.emit('folderContentsChanged', {
        folderId: removedAssignment.folderId,
      });

      return removedAssignment;
    } catch (error) {
      this.store.replaceState(previousState);
      this.store.setState({
        error: toError(error),
        status: 'error',
      });
      throw error;
    }
  }

  public async findByConversation(conversationId: string): Promise<ConversationAssignment | null> {
    return await this.repository.findByConversation(conversationId);
  }

  public async findByFolder(folderId: string): Promise<readonly ConversationAssignment[]> {
    return await this.repository.findByFolder(folderId);
  }

  public async listAssignments(): Promise<readonly ConversationAssignment[]> {
    return await this.synchronizeFromRepository();
  }

  public subscribe<EventName extends AssignmentEventName>(
    eventName: EventName,
    listener: AssignmentEventListener<EventName>,
  ): AssignmentEventUnsubscribe {
    return this.events.subscribe(eventName, listener);
  }

  private async persistAssignment(
    assignment: ConversationAssignment,
    previousState: AssignmentState,
  ): Promise<void> {
    const nextAssignments = [
      ...previousState.assignments.filter(
        (candidate) => candidate.conversationId !== assignment.conversationId,
      ),
      assignment,
    ];

    this.store.setState({
      assignments: nextAssignments,
      error: null,
      status: 'saving',
    });

    try {
      await this.repository.assign(assignment);
      await this.synchronizeFromRepository();
    } catch (error) {
      this.store.replaceState(previousState);
      this.store.setState({
        error: toError(error),
        status: 'error',
      });
      throw error;
    }
  }

  private async synchronizeFromRepository(): Promise<readonly ConversationAssignment[]> {
    this.store.setState({
      error: null,
      status: 'loading',
    });

    try {
      const assignments = await this.repository.listAssignments();

      this.store.setState({
        assignments,
        error: null,
        status: 'ready',
      });

      return assignments;
    } catch (error) {
      this.store.setState({
        error: toError(error),
        status: 'error',
      });
      throw error;
    }
  }

  private async assertCanAssign(input: AssignConversationInput): Promise<void> {
    const issues: AssignmentValidationIssue[] = [];
    const [hasConversation, hasFolder] = await Promise.all([
      this.validationProviders.hasConversation(input.conversationId),
      this.validationProviders.hasFolder(input.folderId),
    ]);

    if (!hasConversation) {
      issues.push({
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Conversation could not be found.',
      });
    }

    if (!hasFolder) {
      issues.push({
        code: 'FOLDER_NOT_FOUND',
        message: 'Folder could not be found.',
      });
    }

    if (issues.length > 0) {
      throw new AssignmentValidationError('Conversation assignment is invalid.', issues);
    }
  }
}

let defaultAssignmentService: AssignmentService | null = null;

export function configureAssignmentService(service: AssignmentService): void {
  defaultAssignmentService = service;
}

export function getAssignmentService(): AssignmentService {
  defaultAssignmentService ??= new DefaultAssignmentService({
    repository: new StorageAssignmentRepository(new ChromeStorageDriver()),
    validationProviders: {
      hasConversation: (conversationId) =>
        conversationStore
          .getState()
          .conversations.some((conversation) => conversation.id === conversationId),
      hasFolder: (folderId) =>
        folderStore.getState().folders.some((folder) => folder.id === folderId),
    },
  });

  return defaultAssignmentService;
}

function createCurrentDate(): Date {
  return new Date();
}

function createEntityId(): string {
  return crypto.randomUUID();
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown assignment error.');
}
