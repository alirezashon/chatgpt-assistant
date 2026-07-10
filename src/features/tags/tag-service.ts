import { StorageTagRepository, type TagRepository } from '@/features/tags/tag-repository';
import type {
  ConversationTagAssignment,
  CreateTagInput,
  RenameTagInput,
  TagStorageState,
} from '@/features/tags/tag-types';
import type { EntityId, Tag } from '@/shared/types';
import { ChromeStorageDriver } from '@/storage';

export interface TagService {
  assignTag(conversationId: EntityId, tagId: EntityId): Promise<void>;
  createTag(input: CreateTagInput): Promise<Tag>;
  deleteTag(tagId: EntityId): Promise<void>;
  getConversationTagIds(conversationId: EntityId): Promise<readonly EntityId[]>;
  getState(): Promise<TagStorageState>;
  listTags(): Promise<readonly Tag[]>;
  renameTag(input: RenameTagInput): Promise<Tag>;
  unassignTag(conversationId: EntityId, tagId: EntityId): Promise<void>;
}

interface DefaultTagServiceOptions {
  readonly clock?: () => Date;
  readonly idGenerator?: () => EntityId;
  readonly repository: TagRepository;
}

export class DefaultTagService implements TagService {
  private readonly clock: () => Date;
  private readonly idGenerator: () => EntityId;
  private readonly repository: TagRepository;

  public constructor(options: DefaultTagServiceOptions) {
    this.clock = options.clock ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? (() => crypto.randomUUID());
    this.repository = options.repository;
  }

  public async getState(): Promise<TagStorageState> {
    return await this.repository.getState();
  }

  public async listTags(): Promise<readonly Tag[]> {
    return (await this.repository.getState()).tags;
  }

  public async createTag(input: CreateTagInput): Promise<Tag> {
    const state = await this.repository.getState();
    assertTagName(input.name, state.tags);

    const now = this.clock().toISOString();
    const tag: Tag = {
      createdAt: now,
      id: this.idGenerator(),
      name: normalizeTagName(input.name),
      updatedAt: now,
      ...(input.color === undefined ? {} : { color: input.color }),
    };

    await this.repository.saveState({
      ...state,
      tags: [...state.tags, tag],
    });

    return tag;
  }

  public async renameTag(input: RenameTagInput): Promise<Tag> {
    const state = await this.repository.getState();
    const tag = findTagOrThrow(state.tags, input.id);
    assertTagName(input.name, state.tags, input.id);

    const updatedTag: Tag = {
      ...tag,
      name: normalizeTagName(input.name),
      updatedAt: this.clock().toISOString(),
    };

    await this.repository.saveState({
      ...state,
      tags: state.tags.map((candidate) => (candidate.id === input.id ? updatedTag : candidate)),
    });

    return updatedTag;
  }

  public async deleteTag(tagId: EntityId): Promise<void> {
    const state = await this.repository.getState();
    findTagOrThrow(state.tags, tagId);

    await this.repository.saveState({
      assignments: state.assignments.filter((assignment) => assignment.tagId !== tagId),
      tags: state.tags.filter((tag) => tag.id !== tagId),
    });
  }

  public async assignTag(conversationId: EntityId, tagId: EntityId): Promise<void> {
    const state = await this.repository.getState();
    findTagOrThrow(state.tags, tagId);

    const assignment: ConversationTagAssignment = {
      conversationId,
      tagId,
    };
    const alreadyAssigned = state.assignments.some(
      (candidate) => candidate.conversationId === conversationId && candidate.tagId === tagId,
    );

    if (alreadyAssigned) {
      return;
    }

    await this.repository.saveState({
      ...state,
      assignments: [...state.assignments, assignment],
    });
  }

  public async unassignTag(conversationId: EntityId, tagId: EntityId): Promise<void> {
    const state = await this.repository.getState();

    await this.repository.saveState({
      ...state,
      assignments: state.assignments.filter(
        (assignment) =>
          !(assignment.conversationId === conversationId && assignment.tagId === tagId),
      ),
    });
  }

  public async getConversationTagIds(conversationId: EntityId): Promise<readonly EntityId[]> {
    return (await this.repository.getState()).assignments
      .filter((assignment) => assignment.conversationId === conversationId)
      .map((assignment) => assignment.tagId);
  }
}

let defaultTagService: TagService | null = null;

export function getTagService(): TagService {
  defaultTagService ??= new DefaultTagService({
    repository: new StorageTagRepository(new ChromeStorageDriver()),
  });

  return defaultTagService;
}

function normalizeTagName(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function assertTagName(
  value: string,
  tags: readonly Tag[],
  currentTagId: EntityId | null = null,
): void {
  const normalized = normalizeTagName(value);

  if (normalized.length === 0) {
    throw new Error('Tag name is required.');
  }

  if (
    tags.some(
      (tag) =>
        tag.id !== currentTagId && tag.name.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
    )
  ) {
    throw new Error('Tag name already exists.');
  }
}

function findTagOrThrow(tags: readonly Tag[], tagId: EntityId): Tag {
  const tag = tags.find((candidate) => candidate.id === tagId);

  if (tag === undefined) {
    throw new Error('Tag was not found.');
  }

  return tag;
}
