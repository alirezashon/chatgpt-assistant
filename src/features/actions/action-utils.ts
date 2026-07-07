import type { WorkspaceRuntimeState } from '@/app/workspace';
import type { EntityId } from '@/shared/types';

export function getConversationTitle(
  workspace: WorkspaceRuntimeState,
  conversationId: EntityId,
): string {
  return (
    workspace.conversations.conversations.find((conversation) => conversation.id === conversationId)
      ?.title ?? 'Conversation'
  );
}

export function getConversationUrl(
  workspace: WorkspaceRuntimeState,
  conversationId: EntityId,
): string | null {
  return (
    workspace.conversations.conversations.find((conversation) => conversation.id === conversationId)
      ?.url ?? null
  );
}

export function createMarkdownLink(title: string, url: string): string {
  return `[${title.replaceAll('[', '\\[').replaceAll(']', '\\]')}](${url})`;
}

export async function writeClipboardText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function openUrlInNewTab(url: string): void {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== 'https:' || !isAllowedChatGptHost(parsedUrl.hostname)) {
    throw new Error('Refused to open an unsupported conversation URL.');
  }

  window.open(parsedUrl.toString(), '_blank', 'noopener,noreferrer');
}

function isAllowedChatGptHost(hostname: string): boolean {
  return hostname === 'chatgpt.com' || hostname === 'chat.openai.com';
}
