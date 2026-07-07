import { useSidebarController } from '@/content/hooks/use-sidebar-controller';
import { WorkspaceLayout } from '@/content/layouts/WorkspaceLayout';

export function ExtensionUiRoot() {
  const sidebar = useSidebarController();

  return (
    <WorkspaceLayout
      isSidebarOpen={sidebar.isOpen}
      onCloseSidebar={sidebar.close}
      onToggleSidebar={sidebar.toggle}
    />
  );
}
