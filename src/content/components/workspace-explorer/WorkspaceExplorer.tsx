import { useEffect, useMemo, useState } from 'react';

import { ActionMenu } from '@/content/components/actions/ActionMenu';
import { ActionToolbar } from '@/content/components/actions/ActionToolbar';
import { FolderPickerDialog } from '@/content/components/actions/FolderPickerDialog';
import { RenameConversationDialog } from '@/content/components/actions/RenameConversationDialog';
import { ConversationAssignmentPanel } from '@/content/components/folders/ConversationAssignmentPanel';
import { DeleteFolderDialog } from '@/content/components/folders/DeleteFolderDialog';
import { FolderDialog } from '@/content/components/folders/FolderDialog';
import { ScrollableArea } from '@/content/components/ui/ScrollableArea';
import { ConversationListView } from '@/content/components/workspace-explorer/ConversationListView';
import { ExplorerFilterTabs } from '@/content/components/workspace-explorer/ExplorerFilterTabs';
import { FolderTreeView } from '@/content/components/workspace-explorer/FolderTreeView';
import { useWorkspaceExplorerController } from '@/content/components/workspace-explorer/use-workspace-explorer-controller';
import { WorkspaceExplorerHeader } from '@/content/components/workspace-explorer/WorkspaceExplorerHeader';
import {
  WorkspaceExplorerErrorState,
  WorkspaceExplorerSkeleton,
} from '@/content/components/workspace-explorer/WorkspaceExplorerStates';
import { WorkspaceOnboardingPanel } from '@/content/components/workspace-explorer/WorkspaceOnboardingPanel';
import { WorkspaceSearchPanel } from '@/content/components/workspace-explorer/WorkspaceSearchPanel';
import { WorkspaceStatsView } from '@/content/components/workspace-explorer/WorkspaceStatsView';
import { WorkspaceTasksPanel } from '@/content/components/workspace-explorer/WorkspaceTasksPanel';

type WorkspacePanel = 'tasks' | 'workspace';

export function WorkspaceExplorer() {
  const controller = useWorkspaceExplorerController();
  const [activePanel, setActivePanel] = useState<WorkspacePanel>('workspace');
  const selectedIds = controller.quickActions.selectedConversationIds;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const menuActions = controller.quickActions.actions.getActions(
    controller.quickActions.menu.targetIds,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'a') {
        event.preventDefault();
        controller.quickActions.actions.setSelectedConversationIds(
          controller.model.conversations.map((item) => item.conversation.id),
        );
      }

      if (event.key === 'Escape') {
        controller.quickActions.actions.closeMenu();
        controller.quickActions.actions.closeFolderPicker();
        controller.quickActions.actions.clearSelection();
      }

      if (event.key === 'Delete' && selectedIds.length > 0) {
        void controller.quickActions.actions.execute('remove-from-folder', selectedIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [controller.model.conversations, controller.quickActions.actions, selectedIds]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <WorkspaceExplorerHeader onCreateFolder={controller.openCreateDialog} />
      <div className="border-b border-emerald-100 bg-white px-5 py-3">
        <div className="grid grid-cols-2 rounded-md border border-emerald-100 bg-emerald-50/70 p-0.5">
          {(['workspace', 'tasks'] as const).map((panel) => (
            <button
              key={panel}
              aria-pressed={activePanel === panel}
              className={[
                'h-9 rounded px-3 text-sm font-semibold transition',
                activePanel === panel
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-emerald-900',
              ].join(' ')}
              type="button"
              onClick={() => {
                setActivePanel(panel);
              }}
            >
              {panel === 'workspace' ? 'Workspace' : 'Tasks'}
            </button>
          ))}
        </div>
      </div>

      {activePanel === 'tasks' ? (
        <WorkspaceTasksPanel
          activeConversationTitle={controller.model.activeConversation?.title ?? null}
          assignedCount={controller.model.stats.assignedConversations}
          folderCount={controller.model.stats.folderCount}
          totalCount={controller.model.stats.totalConversations}
          onCreateFolder={controller.openCreateDialog}
        />
      ) : (
        <>
          <WorkspaceExplorerErrorState
            conversationError={controller.conversationError}
            syncError={controller.syncError}
            workspaceError={controller.workspaceError}
          />
          {!controller.uiPreferences.onboardingDismissed ? (
            <WorkspaceOnboardingPanel
              hasConversation={controller.model.activeConversation !== null}
              hasFolders={controller.workspaceState.folders.folders.length > 0}
              onCreateFolder={controller.openCreateDialog}
              onDismiss={controller.dismissOnboarding}
            />
          ) : null}
          <WorkspaceSearchPanel />
          <ActionToolbar
            selectedCount={selectedIds.length}
            onClear={controller.quickActions.actions.clearSelection}
            onExecute={(actionId) => {
              void controller.quickActions.actions.execute(actionId, selectedIds);
            }}
          />

          {controller.isLoading ? (
            <WorkspaceExplorerSkeleton />
          ) : (
            <>
              <ConversationAssignmentPanel
                activeConversation={controller.model.activeConversation}
                assignment={controller.model.activeConversationAssignment}
                folders={controller.workspaceState.folders.folders}
                isSaving={controller.workspaceState.assignments.status === 'saving'}
                onAssign={(folderId) => {
                  void controller.assignActiveConversation(folderId);
                }}
                onRemove={() => {
                  void controller.removeActiveConversationAssignment();
                }}
              />
              <ScrollableArea className="flex-1">
                <FolderTreeView
                  expandedFolderIds={new Set(controller.uiPreferences.expandedFolderIds)}
                  folderNodes={controller.model.folderNodes}
                  openMenuId={controller.openMenuId}
                  selectedFolderId={controller.model.selectedFolder?.id ?? null}
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
                <ExplorerFilterTabs
                  activeFilter={controller.filter}
                  selectedFolderName={controller.model.selectedFolder?.name ?? null}
                  onSelect={controller.selectFilter}
                />
                <ConversationListView
                  conversations={controller.model.conversations}
                  filter={controller.filter}
                  selectedConversationIds={selectedIdSet}
                  selectedFolderName={controller.model.selectedFolder?.name ?? null}
                  onOpenContextMenu={(conversationId, x, y) => {
                    const targetIds = selectedIdSet.has(conversationId)
                      ? selectedIds
                      : [conversationId];

                    controller.quickActions.actions.openMenu({ targetIds, x, y });
                  }}
                  onRangeSelect={(conversationIds) => {
                    controller.quickActions.actions.setSelectedConversationIds(conversationIds);
                  }}
                  onToggleSelection={controller.quickActions.actions.toggleSelection}
                />
                <WorkspaceStatsView stats={controller.model.stats} />
              </ScrollableArea>
            </>
          )}
        </>
      )}

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

      <ActionMenu
        actions={menuActions}
        open={controller.quickActions.menu.open}
        targetIds={controller.quickActions.menu.targetIds}
        x={controller.quickActions.menu.x}
        y={controller.quickActions.menu.y}
        onClose={controller.quickActions.actions.closeMenu}
        onExecute={(actionId, targetIds) => {
          void controller.quickActions.actions.execute(actionId, targetIds);
        }}
      />

      {controller.quickActions.folderPicker.open ? (
        <FolderPickerDialog
          folders={controller.workspaceState.folders.folders}
          query={controller.quickActions.folderPicker.query}
          recentFolderIds={controller.uiPreferences.recentlyUsedFolderIds}
          targetCount={controller.quickActions.folderPicker.targetIds.length}
          onClose={controller.quickActions.actions.closeFolderPicker}
          onMove={(folderId) => {
            void controller.quickActions.actions.moveTargetsToFolder(folderId);
          }}
          onQueryChange={controller.quickActions.actions.setFolderPickerQuery}
        />
      ) : null}

      {controller.quickActions.rename.open &&
      controller.quickActions.rename.conversationId !== null ? (
        <RenameConversationDialog
          conversationId={controller.quickActions.rename.conversationId}
          conversations={controller.workspaceState.conversations.conversations}
          onClose={controller.quickActions.actions.closeRename}
          onRename={controller.quickActions.actions.renameConversation}
        />
      ) : null}
    </section>
  );
}
