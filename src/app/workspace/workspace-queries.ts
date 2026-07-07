import type { WorkspaceContext } from '@/app/workspace/workspace-context';
import type { WorkspaceQueryMap, WorkspaceRuntimeState } from '@/app/workspace/workspace-types';
import { selectActiveConversation, selectConversationById } from '@/features/conversations';
import type { Folder } from '@/shared/types';

export class WorkspaceQueries {
  private readonly context: WorkspaceContext;

  public constructor(context: WorkspaceContext) {
    this.context = context;
  }

  public getWorkspace(): WorkspaceRuntimeState {
    return this.context.state.getState();
  }

  public getFolders(): readonly Folder[] {
    return this.context.state.getState().folders.folders;
  }

  public getCurrentConversation(): ReturnType<typeof selectActiveConversation> {
    return selectActiveConversation(this.context.state.getState().conversations);
  }

  public getConversationById(
    input: WorkspaceQueryMap['getConversationById'],
  ): ReturnType<typeof selectConversationById> {
    return selectConversationById(
      this.context.state.getState().conversations,
      input.conversationId,
    );
  }
}
