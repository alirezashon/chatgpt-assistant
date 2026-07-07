import type { ProviderConversation } from '@/platform/providers/provider-types';
import { normalizeProviderText } from '@/platform/providers/provider-utils';

export function normalizeProviderConversationTitle(conversation: ProviderConversation): string {
  const title = normalizeProviderText(conversation.title);

  return title.length === 0 ? 'Untitled conversation' : title;
}
