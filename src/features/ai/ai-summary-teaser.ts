import type { WorkspaceRuntimeState } from '@/app/workspace';
import type { EntityId } from '@/shared/types';

export interface AISummaryTeaser {
  readonly conversationId: EntityId;
  readonly copiedText: string;
  readonly localSignals: readonly string[];
  readonly title: string;
  readonly upgradeMessage: string;
}

export function createAISummaryTeaser(
  workspace: WorkspaceRuntimeState,
  conversationId: EntityId,
): AISummaryTeaser {
  const conversation = workspace.conversations.conversations.find(
    (candidate) => candidate.id === conversationId,
  );

  if (conversation === undefined) {
    throw new Error('Conversation is unavailable for AI summary preview.');
  }

  const localSignals = createLocalSignals(workspace, conversationId);
  const upgradeMessage =
    'Pro AI summaries can turn this ChatGPT thread into decisions, next steps, risks, and follow-ups.';
  const copiedText = [
    `AI Summary Preview: ${conversation.title}`,
    '',
    'Local signals:',
    ...localSignals.map((signal) => `- ${signal}`),
    '',
    upgradeMessage,
  ].join('\n');

  return {
    conversationId,
    copiedText,
    localSignals,
    title: conversation.title,
    upgradeMessage,
  };
}

function createLocalSignals(
  workspace: WorkspaceRuntimeState,
  conversationId: EntityId,
): readonly string[] {
  const conversation = workspace.conversations.conversations.find(
    (candidate) => candidate.id === conversationId,
  );

  if (conversation === undefined) {
    return [];
  }

  const assignment = workspace.assignments.assignments.find(
    (candidate) => candidate.conversationId === conversationId,
  );
  const folder = workspace.folders.folders.find(
    (candidate) => candidate.id === assignment?.folderId,
  );
  const signals = [
    folder === undefined ? 'No folder assigned yet' : `Folder: ${folder.name}`,
    conversation.tags.length === 0
      ? 'No tags yet'
      : `Tags: ${conversation.tags.length.toString()} saved`,
    conversation.favorite ? 'Marked as favorite' : 'Not marked as favorite',
    `Last detected: ${conversation.updatedAt}`,
  ];

  return signals;
}
