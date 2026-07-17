import { useSidebarController } from '@/content/hooks/use-sidebar-controller';
import { WorkspaceLayout } from '@/content/layouts/WorkspaceLayout';
import { ToastProvider } from '@/content/components/toast/ToastProvider';

export function ExtensionUiRoot() {
  const sidebar = useSidebarController();

  return (
    <ToastProvider>
      <WorkspaceLayout
        floatingButtonPosition={sidebar.floatingButtonPosition}
        isSidebarOpen={sidebar.isOpen}
        onCloseSidebar={sidebar.close}
        onMoveFloatingButton={sidebar.moveFloatingButton}
        onResizeSidebar={sidebar.resize}
        onToggleSidebar={sidebar.toggle}
        sidebarWidth={sidebar.sidebarWidth}
      />
    </ToastProvider>
  );
}
