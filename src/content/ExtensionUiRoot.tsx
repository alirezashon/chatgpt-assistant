import { useSidebarController } from '@/content/hooks/use-sidebar-controller';
import { WorkspaceLayout } from '@/content/layouts/WorkspaceLayout';
import { ToastProvider } from '@/content/components/toast/ToastProvider';

export function ExtensionUiRoot() {
  const sidebar = useSidebarController();

  return (
    <ToastProvider>
      <WorkspaceLayout
        isSidebarOpen={sidebar.isOpen}
        onCloseSidebar={sidebar.close}
        onToggleSidebar={sidebar.toggle}
      />
    </ToastProvider>
  );
}
