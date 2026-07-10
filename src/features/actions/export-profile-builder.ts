import type { ConversationExportFormat } from '@/features/actions/conversation-export';
import type { PremiumFeatureId } from '@/features/entitlements';
import type { EntityId } from '@/shared/types';

export interface ExportProfileDraftInput {
  readonly brandingEnabled?: boolean;
  readonly formats: readonly ConversationExportFormat[];
  readonly includeFolders?: boolean;
  readonly includeTags?: boolean;
  readonly name: string;
  readonly targetIds: readonly EntityId[];
}

export interface ExportProfileDraft {
  readonly brandingEnabled: boolean;
  readonly formats: readonly ConversationExportFormat[];
  readonly gatedFeatureId: PremiumFeatureId;
  readonly includeFolders: boolean;
  readonly includeTags: boolean;
  readonly name: string;
  readonly targetCount: number;
}

export function createExportProfileDraft(input: ExportProfileDraftInput): ExportProfileDraft {
  const formats = normalizeFormats(input.formats);
  const normalizedName = input.name.trim().replace(/\s+/gu, ' ');

  return {
    brandingEnabled: input.brandingEnabled ?? true,
    formats,
    gatedFeatureId: 'saved-export-profiles',
    includeFolders: input.includeFolders ?? true,
    includeTags: input.includeTags ?? true,
    name: normalizedName.length === 0 ? 'Client handoff profile' : normalizedName,
    targetCount: new Set(input.targetIds).size,
  };
}

export function createClientHandoffExportProfile(
  targetIds: readonly EntityId[],
): ExportProfileDraft {
  return createExportProfileDraft({
    brandingEnabled: true,
    formats: ['pdf', 'html', 'json'],
    includeFolders: true,
    includeTags: true,
    name: 'Client handoff profile',
    targetIds,
  });
}

function normalizeFormats(
  formats: readonly ConversationExportFormat[],
): readonly ConversationExportFormat[] {
  const normalizedFormats = formats.filter((format) =>
    ['html', 'json', 'markdown', 'pdf'].includes(format),
  );

  return normalizedFormats.length === 0 ? ['markdown'] : [...new Set(normalizedFormats)];
}
