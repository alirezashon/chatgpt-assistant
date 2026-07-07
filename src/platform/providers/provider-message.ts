import type { ProviderMessage } from '@/platform/providers/provider-types';
import { normalizeProviderText } from '@/platform/providers/provider-utils';

export function normalizeProviderMessage(message: ProviderMessage): ProviderMessage {
  return {
    ...message,
    content: normalizeProviderText(message.content),
  };
}
