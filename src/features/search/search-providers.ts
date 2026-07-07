import type {
  SearchDocument,
  SearchProvider,
  SearchProviderContext,
} from '@/features/search/search-types';
import { createSearchDocumentId } from '@/features/search/search-utils';

export const conversationSearchProvider: SearchProvider = {
  getDocuments(context: SearchProviderContext): readonly SearchDocument[] {
    return context.workspace.conversations.conversations.map((conversation) => ({
      content: [conversation.title, conversation.url, conversation.metadata.detectedFrom].join(' '),
      entityId: conversation.id,
      id: createSearchDocumentId('conversation', conversation.id),
      keywords: [
        conversation.isActive ? 'active' : '',
        conversation.favorite ? 'favorite' : '',
        ...conversation.tags,
      ],
      metadata: {
        active: conversation.isActive,
        folderId: conversation.folderId,
      },
      providerId: 'conversation',
      title: conversation.title,
      type: 'conversation',
      updatedAt: conversation.updatedAt,
      url: conversation.url,
    }));
  },
  id: 'conversation',
  type: 'conversation',
};

export const folderSearchProvider: SearchProvider = {
  getDocuments(context: SearchProviderContext): readonly SearchDocument[] {
    return context.workspace.folders.folders.map((folder) => ({
      content: [folder.name, folder.icon, folder.color].join(' '),
      entityId: folder.id,
      id: createSearchDocumentId('folder', folder.id),
      keywords: [folder.icon, folder.color],
      metadata: {
        color: folder.color,
        icon: folder.icon,
        order: folder.order,
      },
      providerId: 'folder',
      title: folder.name,
      type: 'folder',
      updatedAt: folder.updatedAt,
    }));
  },
  id: 'folder',
  type: 'folder',
};

export const assignmentSearchProvider: SearchProvider = {
  getDocuments(context: SearchProviderContext): readonly SearchDocument[] {
    const conversationById = new Map(
      context.workspace.conversations.conversations.map((conversation) => [
        conversation.id,
        conversation,
      ]),
    );
    const folderById = new Map(
      context.workspace.folders.folders.map((folder) => [folder.id, folder]),
    );

    return context.workspace.assignments.assignments.map((assignment) => {
      const conversation = conversationById.get(assignment.conversationId);
      const folder = folderById.get(assignment.folderId);
      const title = conversation === undefined ? 'Assigned conversation' : conversation.title;
      const folderName = folder?.name ?? 'Unknown folder';

      const document: SearchDocument = {
        content: [title, folderName, assignment.metadata.source].join(' '),
        entityId: assignment.assignmentId,
        id: createSearchDocumentId('assignment', assignment.assignmentId),
        keywords: [folderName, assignment.metadata.source],
        metadata: {
          conversationId: assignment.conversationId,
          folderId: assignment.folderId,
        },
        providerId: 'assignment',
        title: `${title} in ${folderName}`,
        type: 'assignment',
        updatedAt: assignment.updatedAt,
      };

      return conversation?.url === undefined
        ? document
        : {
            ...document,
            url: conversation.url,
          };
    });
  },
  id: 'assignment',
  type: 'assignment',
};

export const DEFAULT_SEARCH_PROVIDERS: readonly SearchProvider[] = [
  conversationSearchProvider,
  folderSearchProvider,
  assignmentSearchProvider,
];
