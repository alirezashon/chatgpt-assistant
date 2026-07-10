import type { WorkspaceRuntimeState } from '@/app/workspace';
import { createMarkdownLink } from '@/features/actions/action-utils';
import type { Conversation } from '@/features/conversations';
import type { EntityId } from '@/shared/types';

export interface MarkdownExportResult {
  readonly content: string;
  readonly conversationCount: number;
  readonly filename: string;
}

export function createMarkdownExport(
  workspace: WorkspaceRuntimeState,
  targetIds: readonly EntityId[],
  generatedAt = new Date().toISOString(),
): MarkdownExportResult {
  const conversations = getTargetConversations(workspace, targetIds);

  if (conversations.length === 0) {
    throw new Error('No conversations are available to export.');
  }

  const lines = [
    '# ChatGPT Workspace Export',
    '',
    `Generated: ${generatedAt}`,
    `Workspace: ${escapeMarkdownText(workspace.workspace.name)}`,
    `Conversations: ${conversations.length.toString()}`,
    '',
    ...conversations.flatMap((conversation, index) =>
      createConversationSection(workspace, conversation, index + 1),
    ),
  ];

  return {
    content: `${lines.join('\n')}\n`,
    conversationCount: conversations.length,
    filename: createMarkdownExportFilename(conversations, generatedAt),
  };
}

export function downloadMarkdownExport(result: MarkdownExportResult): void {
  downloadTextFile(result.filename, result.content, 'text/markdown;charset=utf-8');
}

function getTargetConversations(
  workspace: WorkspaceRuntimeState,
  targetIds: readonly EntityId[],
): readonly Conversation[] {
  const targetIdSet = new Set(targetIds);

  return workspace.conversations.conversations.filter((conversation) =>
    targetIdSet.has(conversation.id),
  );
}

function createConversationSection(
  workspace: WorkspaceRuntimeState,
  conversation: Conversation,
  position: number,
): readonly string[] {
  const folderName = getFolderName(workspace, conversation.id) ?? 'Unassigned';
  const title = escapeMarkdownText(conversation.title);

  return [
    `## ${position.toString()}. ${title}`,
    '',
    `- Link: ${createMarkdownLink('Open conversation', conversation.url)}`,
    `- Folder: ${escapeMarkdownText(folderName)}`,
    `- Favorite: ${conversation.favorite ? 'Yes' : 'No'}`,
    `- Active: ${conversation.isActive ? 'Yes' : 'No'}`,
    `- Archived: ${conversation.isArchived ? 'Yes' : 'No'}`,
    `- Updated: ${conversation.updatedAt}`,
    `- Conversation ID: \`${conversation.id}\``,
    '',
  ];
}

function getFolderName(workspace: WorkspaceRuntimeState, conversationId: EntityId): string | null {
  const assignment = workspace.assignments.assignments.find(
    (candidate) => candidate.conversationId === conversationId,
  );
  const folderId = assignment?.folderId ?? null;

  if (folderId === null) {
    return null;
  }

  return workspace.folders.folders.find((folder) => folder.id === folderId)?.name ?? null;
}

function createMarkdownExportFilename(
  conversations: readonly Conversation[],
  generatedAt: string,
): string {
  const dateSegment = generatedAt.slice(0, 10);
  const titleSegment =
    conversations.length === 1
      ? sanitizeFilename(conversations[0]?.title ?? 'conversation')
      : 'bulk';

  return `chatgpt-workspace-${titleSegment}-${dateSegment}.md`;
}

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+\-.!|>])/gu, '\\$1');
}

function sanitizeFilename(value: string): string {
  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return normalized.length > 0 ? normalized.slice(0, 48) : 'conversation';
}

function downloadTextFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
