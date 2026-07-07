import { STORAGE_KEYS } from '@/constants/storage';
import type { ConversationAssignment } from '@/features/assignments/assignment-types';
import type { StorageDriver, StorageUnsubscribe } from '@/storage';

export interface AssignmentRepository {
  assign(assignment: ConversationAssignment): Promise<void>;
  findByConversation(conversationId: string): Promise<ConversationAssignment | null>;
  findByFolder(folderId: string): Promise<readonly ConversationAssignment[]>;
  listAssignments(): Promise<readonly ConversationAssignment[]>;
  move(assignment: ConversationAssignment): Promise<void>;
  remove(conversationId: string): Promise<ConversationAssignment | null>;
  subscribe(listener: () => void): StorageUnsubscribe;
}

export class StorageAssignmentRepository implements AssignmentRepository {
  private readonly storage: StorageDriver;

  public constructor(storage: StorageDriver) {
    this.storage = storage;
  }

  public async assign(assignment: ConversationAssignment): Promise<void> {
    const assignments = await this.listAssignments();
    const nextAssignments = [
      ...assignments.filter((candidate) => candidate.conversationId !== assignment.conversationId),
      assignment,
    ];

    await this.saveAssignments(nextAssignments);
  }

  public async move(assignment: ConversationAssignment): Promise<void> {
    await this.assign(assignment);
  }

  public async remove(conversationId: string): Promise<ConversationAssignment | null> {
    const assignments = await this.listAssignments();
    const existingAssignment =
      assignments.find((assignment) => assignment.conversationId === conversationId) ?? null;

    await this.saveAssignments(
      assignments.filter((assignment) => assignment.conversationId !== conversationId),
    );

    return existingAssignment;
  }

  public async findByConversation(conversationId: string): Promise<ConversationAssignment | null> {
    const assignments = await this.listAssignments();

    return assignments.find((assignment) => assignment.conversationId === conversationId) ?? null;
  }

  public async findByFolder(folderId: string): Promise<readonly ConversationAssignment[]> {
    const assignments = await this.listAssignments();

    return assignments.filter((assignment) => assignment.folderId === folderId);
  }

  public async listAssignments(): Promise<readonly ConversationAssignment[]> {
    const storedAssignments = await this.storage.get(STORAGE_KEYS.assignments);

    if (!Array.isArray(storedAssignments)) {
      return [];
    }

    return storedAssignments.filter(isConversationAssignment);
  }

  public subscribe(listener: () => void): StorageUnsubscribe {
    return this.storage.subscribe((changes) => {
      const hasAssignmentChange = changes.some((change) => change.key === STORAGE_KEYS.assignments);

      if (hasAssignmentChange) {
        listener();
      }
    });
  }

  private async saveAssignments(assignments: readonly ConversationAssignment[]): Promise<void> {
    await this.storage.set(STORAGE_KEYS.assignments, assignments);
  }
}

function isConversationAssignment(value: unknown): value is ConversationAssignment {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['assignmentId'] === 'string' &&
    typeof candidate['conversationId'] === 'string' &&
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['folderId'] === 'string' &&
    typeof candidate['updatedAt'] === 'string'
  );
}
