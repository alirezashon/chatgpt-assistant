import type { WorkspaceSubsystem, WorkspaceSubsystemName } from '@/app/workspace/workspace-types';
import type { Conversation, ConversationRepository } from '@/features/conversations';
import type { Folder } from '@/shared/types';

export class WorkspaceRegistry {
  private readonly conversations = new Map<string, Conversation>();
  private readonly folders = new Map<string, Folder>();
  private readonly subsystems = new Map<WorkspaceSubsystemName, WorkspaceSubsystem>();

  public registerSubsystem(name: WorkspaceSubsystemName, initialized: boolean): void {
    this.subsystems.set(name, {
      initialized,
      name,
    });
  }

  public getSubsystems(): readonly WorkspaceSubsystem[] {
    return Array.from(this.subsystems.values());
  }

  public syncConversations(repository: ConversationRepository): void {
    this.conversations.clear();

    for (const conversation of repository.getAll()) {
      this.conversations.set(conversation.id, conversation);
    }
  }

  public syncFolders(folders: readonly Folder[]): void {
    this.folders.clear();

    for (const folder of folders) {
      this.folders.set(folder.id, folder);
    }
  }

  public getConversationById(conversationId: string): Conversation | null {
    return this.conversations.get(conversationId) ?? null;
  }

  public getFolders(): readonly Folder[] {
    return Array.from(this.folders.values());
  }
}
