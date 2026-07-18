import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class ChatGPTAdapter implements ContextAdapter {
  public readonly id = 'chatgpt';

  public detect(input: { readonly url: URL }): boolean {
    return (
      input.url.hostname.includes('chatgpt.com') || input.url.hostname.includes('chat.openai.com')
    );
  }

  public extract(input: {
    readonly documentRef: Document;
    readonly selectedText: string;
  }): ContextAdapterResult {
    const messageCount = countChatMessages(input.documentRef);
    const hasDraft =
      input.selectedText.length > 0 || readComposerText(input.documentRef).trim().length > 0;
    const isEmptyChat = messageCount === 0;

    return {
      application: 'chatgpt',
      availableActions: isEmptyChat
        ? [
            actionCandidate(
              'prompt.improve',
              hasDraft ? 0.94 : 0.72,
              hasDraft ? 'Prompt draft detected' : 'Empty ChatGPT chat',
            ),
            actionCandidate('workflow.start', 0.7, 'Start from a blank chat'),
            actionCandidate('research.topic', 0.58, 'Research before prompting'),
            actionCandidate('memory.saveContext', 0.48, 'Save the starting context'),
          ]
        : [
            actionCandidate('chat.summarizeThread', 0.96, 'ChatGPT conversation with messages'),
            actionCandidate('chat.extractTasks', 0.88, 'Conversation can become tasks'),
            actionCandidate('memory.saveContext', 0.7, 'Conversation context can be reused'),
            actionCandidate('workflow.start', 0.62, 'Turn conversation into a workflow'),
          ],
      entities:
        messageCount === 0
          ? []
          : [
              {
                confidence: 0.92,
                label: 'ChatGPT conversation',
                type: 'article',
                value: `${messageCount.toString()} messages`,
              },
            ],
      pageKind: isEmptyChat ? 'chat-empty' : 'chat-thread',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}

function countChatMessages(documentRef: Document): number {
  const roleMessages = documentRef.querySelectorAll('[data-message-author-role]');

  if (roleMessages.length > 0) {
    return roleMessages.length;
  }

  return documentRef.querySelectorAll('article').length;
}

function readComposerText(documentRef: Document): string {
  const activeElement = documentRef.activeElement;

  if (activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLInputElement) {
    return activeElement.value;
  }

  if (activeElement instanceof HTMLElement && activeElement.isContentEditable) {
    return activeElement.innerText;
  }

  return '';
}
