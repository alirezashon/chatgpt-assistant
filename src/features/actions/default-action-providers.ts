import { getWorkspaceEngine } from '@/app/workspace';
import type {
  ActionContext,
  ActionDefinition,
  ActionProvider,
} from '@/features/actions/action-types';
import {
  createMarkdownLink,
  getConversationTitle,
  getConversationUrl,
  openUrlInNewTab,
  writeClipboardText,
} from '@/features/actions/action-utils';
import {
  createConversationExport,
  downloadConversationExport,
  type ConversationExportFormat,
} from '@/features/actions/conversation-export';
import { createClientHandoffExportProfile } from '@/features/actions/export-profile-builder';
import { createMarkdownExport, downloadMarkdownExport } from '@/features/actions/markdown-export';
import { createContextualUpgradePrompt } from '@/features/actions/upgrade-prompts';
import { createAISummaryTeaser } from '@/features/ai';

export const conversationActionProvider: ActionProvider = {
  getActions(context: ActionContext): readonly ActionDefinition[] {
    const singleTargetId = context.targetIds[0] ?? null;
    const hasSingleTarget = context.targetIds.length === 1 && singleTargetId !== null;
    const assignment =
      singleTargetId === null
        ? null
        : (context.workspace.assignments.assignments.find(
            (candidate) => candidate.conversationId === singleTargetId,
          ) ?? null);
    const isFavorite =
      singleTargetId !== null && context.favoriteService.isFavorite(singleTargetId);

    return [
      {
        execute: () => Promise.resolve({ type: 'folderPickerRequested' }),
        icon: 'folder',
        id: 'move-to-folder',
        kind: 'normal',
        label: 'Move to Folder',
        scope: 'bulk',
      },
      {
        execute: async (actionContext) => {
          await Promise.all(
            actionContext.targetIds.map((conversationId) =>
              actionContext.favoriteService.toggleFavorite({ conversationId }),
            ),
          );

          return { message: 'Favorite status updated.', type: 'completed' };
        },
        icon: 'heart',
        id: 'toggle-favorite',
        kind: 'normal',
        label: isFavorite ? 'Remove Favorite' : 'Favorite',
        scope: 'bulk',
      },
      {
        disabled: !hasSingleTarget,
        execute: () => Promise.resolve({ type: 'renameRequested' }),
        icon: 'rename',
        id: 'rename-conversation',
        kind: 'normal',
        label: 'Rename',
        scope: 'conversation',
      },
      {
        disabled: !hasSingleTarget,
        execute: async (actionContext) => {
          const conversationId = actionContext.targetIds[0];

          if (conversationId === undefined) {
            throw new Error('No conversation selected.');
          }

          const url = getConversationUrl(actionContext.workspace, conversationId);

          if (url === null) {
            throw new Error('Conversation link is unavailable.');
          }

          await writeClipboardText(url);

          return { message: 'Conversation link copied.', type: 'completed' };
        },
        icon: 'copy',
        id: 'copy-conversation-link',
        kind: 'normal',
        label: 'Copy Conversation Link',
        scope: 'conversation',
      },
      {
        disabled: !hasSingleTarget,
        execute: async (actionContext) => {
          const conversationId = actionContext.targetIds[0];

          if (conversationId === undefined) {
            throw new Error('No conversation selected.');
          }

          await writeClipboardText(getConversationTitle(actionContext.workspace, conversationId));

          return { message: 'Conversation title copied.', type: 'completed' };
        },
        icon: 'copy',
        id: 'copy-conversation-title',
        kind: 'normal',
        label: 'Copy Conversation Title',
        scope: 'conversation',
      },
      {
        disabled: !hasSingleTarget,
        execute: async (actionContext) => {
          const conversationId = actionContext.targetIds[0];

          if (conversationId === undefined) {
            throw new Error('No conversation selected.');
          }

          const url = getConversationUrl(actionContext.workspace, conversationId);

          if (url === null) {
            throw new Error('Conversation link is unavailable.');
          }

          await writeClipboardText(
            createMarkdownLink(getConversationTitle(actionContext.workspace, conversationId), url),
          );

          return { message: 'Markdown link copied.', type: 'completed' };
        },
        icon: 'copy',
        id: 'copy-markdown-link',
        kind: 'normal',
        label: 'Copy Markdown Link',
        scope: 'conversation',
      },
      {
        disabled: !hasSingleTarget,
        execute: async (actionContext) => {
          const conversationId = actionContext.targetIds[0];

          if (conversationId === undefined) {
            throw new Error('No conversation selected.');
          }

          const url = getConversationUrl(actionContext.workspace, conversationId);

          if (url === null) {
            return Promise.reject(new Error('Conversation link is unavailable.'));
          }

          openUrlInNewTab(url);

          return Promise.resolve({ type: 'completed' });
        },
        icon: 'external',
        id: 'open-in-new-tab',
        kind: 'normal',
        label: 'Open in New Tab',
        scope: 'conversation',
      },
      {
        disabled: !hasSingleTarget,
        execute: async (actionContext) => {
          const conversationId = actionContext.targetIds[0];

          if (conversationId === undefined) {
            throw new Error('No conversation selected.');
          }

          const teaser = createAISummaryTeaser(actionContext.workspace, conversationId);

          await writeClipboardText(teaser.copiedText);

          return { message: 'AI summary preview copied.', type: 'completed' };
        },
        icon: 'sparkle',
        id: 'preview-ai-summary',
        kind: 'normal',
        label: 'Preview AI Summary',
        scope: 'conversation',
      },
      {
        disabled: true,
        execute: () => Promise.resolve({ type: 'completed' }),
        icon: 'sparkle',
        id: 'full-ai-summary',
        kind: 'normal',
        label: 'Full AI Summary',
        premiumFeatureId: 'ai-summaries',
        scope: 'conversation',
        upgradePrompt: createContextualUpgradePrompt('ai-summaries', 'ai-summary'),
      },
      {
        disabled: assignment === null,
        execute: async (actionContext) => {
          await Promise.all(
            actionContext.targetIds.map((conversationId) =>
              getWorkspaceEngine().execute('removeConversationAssignment', { conversationId }),
            ),
          );

          return { message: 'Conversation removed from folder.', type: 'completed' };
        },
        icon: 'folder',
        id: 'remove-from-folder',
        kind: 'normal',
        label: 'Remove From Folder',
        scope: 'bulk',
      },
      {
        disabled: assignment === null,
        execute: async (actionContext) => {
          await Promise.all(
            actionContext.targetIds.map((conversationId) =>
              getWorkspaceEngine().execute('removeConversationAssignment', { conversationId }),
            ),
          );

          return { message: 'Assignment deleted.', type: 'completed' };
        },
        icon: 'trash',
        id: 'delete-assignment',
        kind: 'danger',
        label: 'Delete Assignment',
        scope: 'bulk',
        separatorBefore: true,
      },
    ];
  },
  id: 'conversation-actions',
};

export const utilityActionProvider: ActionProvider = {
  getActions(context: ActionContext): readonly ActionDefinition[] {
    return [
      {
        disabled: context.targetIds.length === 0,
        execute: (actionContext) => {
          const result = createMarkdownExport(actionContext.workspace, actionContext.targetIds);

          downloadMarkdownExport(result);

          return Promise.resolve({
            message: `${result.conversationCount.toString()} conversation export created.`,
            type: 'completed',
          });
        },
        icon: 'external',
        id: 'export-conversation',
        kind: 'normal',
        label: 'Export Markdown',
        scope: 'bulk',
      },
      ...createExportActions(context, [
        ['json', 'Export JSON'],
        ['html', 'Export HTML'],
        ['pdf', 'Export PDF'],
      ]),
      {
        disabled: true,
        execute: () => Promise.resolve({ type: 'completed' }),
        icon: 'copy',
        id: 'duplicate-metadata',
        kind: 'normal',
        label: 'Duplicate Metadata',
        scope: 'conversation',
      },
      {
        disabled: true,
        execute: (actionContext) => {
          const profile = createClientHandoffExportProfile(actionContext.targetIds);

          return Promise.resolve({
            message: `${profile.name} is available on Pro.`,
            type: 'completed',
          });
        },
        icon: 'external',
        id: 'export-profile-builder',
        kind: 'normal',
        label: 'Export Profile Builder',
        premiumFeatureId: 'saved-export-profiles',
        scope: 'bulk',
        upgradePrompt: createContextualUpgradePrompt('saved-export-profiles', 'export-profile'),
      },
      {
        execute: () => Promise.resolve({ type: 'selectionRequested' }),
        icon: 'select',
        id: 'select-all',
        kind: 'normal',
        label: 'Select All',
        scope: 'global',
        shortcut: 'Ctrl+A',
      },
      {
        execute: () => Promise.resolve({ type: 'selectionRequested' }),
        icon: 'select',
        id: 'deselect-all',
        kind: 'normal',
        label: 'Deselect All',
        scope: 'global',
      },
      {
        disabled: true,
        execute: () => Promise.resolve({ type: 'completed' }),
        icon: 'sparkle',
        id: 'future-ai-actions',
        kind: 'normal',
        label: 'Future AI Actions',
        scope: 'bulk',
      },
    ];
  },
  id: 'utility-actions',
};

function createExportActions(
  context: ActionContext,
  formats: readonly (readonly [ConversationExportFormat, string])[],
): readonly ActionDefinition[] {
  return formats.map(([format, label]) => ({
    disabled: context.targetIds.length === 0 || format === 'pdf',
    execute: (actionContext) => {
      const result = createConversationExport(
        actionContext.workspace,
        actionContext.targetIds,
        format,
      );

      downloadConversationExport(result);

      return Promise.resolve({
        message: `${result.conversationCount.toString()} conversation ${format.toUpperCase()} export created.`,
        type: 'completed',
      });
    },
    icon: 'external',
    id: `export-${format}`,
    kind: 'normal',
    label,
    ...(format === 'pdf'
      ? {
          premiumFeatureId: 'pdf-export' as const,
          upgradePrompt: createContextualUpgradePrompt('pdf-export', 'pdf-export'),
        }
      : {}),
    scope: 'bulk',
  }));
}

export const DEFAULT_ACTION_PROVIDERS: readonly ActionProvider[] = [
  conversationActionProvider,
  utilityActionProvider,
];
