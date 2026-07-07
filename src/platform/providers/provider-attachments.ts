import type { ProviderAttachment, ProviderCapabilities } from '@/platform/providers/provider-types';

export function canProviderAcceptAttachment(
  capabilities: ProviderCapabilities,
  attachment: ProviderAttachment,
): boolean {
  const sizeAllowed =
    capabilities.maxAttachmentBytes === undefined ||
    attachment.bytes === undefined ||
    attachment.bytes <= capabilities.maxAttachmentBytes;

  return sizeAllowed && capabilities.supportedAttachments.includes(attachment.kind);
}
