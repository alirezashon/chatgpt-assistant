import { ConversationAssignmentPanel } from '@/content/components/folders/ConversationAssignmentPanel';
import { DeleteFolderDialog } from '@/content/components/folders/DeleteFolderDialog';
import { FolderDialog } from '@/content/components/folders/FolderDialog';
import { FolderHeader } from '@/content/components/folders/FolderHeader';
import { FolderList } from '@/content/components/folders/FolderList';
import { FolderToolbar } from '@/content/components/folders/FolderToolbar';
import { useFolderSidebarController } from '@/content/components/folders/use-folder-sidebar-controller';

export function FolderSidebar() {
  const controller = useFolderSidebarController();

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <FolderHeader />
      <FolderToolbar onCreateFolder={controller.openCreateDialog} />
      <ConversationAssignmentPanel
        activeConversation={controller.activeConversation}
        assignment={controller.activeAssignment}
        folders={controller.folders}
        isSaving={controller.isAssignmentSaving}
        onAssign={(folderId) => {
          void controller.assignActiveConversation(folderId);
        }}
        onRemove={() => {
          void controller.removeActiveConversationAssignment();
        }}
      />
      <FolderList
        conversationsByFolderId={controller.conversationsByFolderId}
        error={controller.error}
        expandedFolderIds={controller.expandedFolderIds}
        folders={controller.folders}
        openMenuId={controller.openMenuId}
        selectedFolderId={controller.selectedFolderId}
        status={controller.status}
        onCreate={controller.openCreateDialog}
        onDelete={controller.openDeleteDialog}
        onMoveDown={(folder) => {
          void controller.moveFolder(folder, 'down');
        }}
        onMoveUp={(folder) => {
          void controller.moveFolder(folder, 'up');
        }}
        onRename={controller.openRenameDialog}
        onSelect={(folder) => {
          void controller.selectFolder(folder);
        }}
        onToggleExpanded={controller.toggleExpanded}
        onToggleMenu={controller.toggleMenu}
      />

      {controller.dialogState === null ? null : (
        <FolderDialog
          errorMessage={controller.formError}
          isSubmitting={controller.isSubmitting}
          state={controller.dialogState}
          onClose={controller.closeFolderDialog}
          onSubmit={async (values) => {
            await controller.submitFolderDialog(values);
          }}
        />
      )}

      {controller.deleteTarget === null ? null : (
        <DeleteFolderDialog
          errorMessage={controller.deleteError}
          folder={controller.deleteTarget}
          isDeleting={controller.isSubmitting}
          onClose={controller.closeDeleteDialog}
          onConfirm={async () => {
            await controller.confirmDeleteFolder();
          }}
        />
      )}
    </section>
  );
}
