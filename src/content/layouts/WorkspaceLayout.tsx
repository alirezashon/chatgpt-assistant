import { FloatingButton } from '@/content/components/FloatingButton';
import { WorkspaceSidebar } from '@/content/components/WorkspaceSidebar';

interface WorkspaceLayoutProps {
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  onToggleSidebar: () => void;
}

export function WorkspaceLayout({
  isSidebarOpen,
  onCloseSidebar,
  onToggleSidebar,
}: WorkspaceLayoutProps) {
  return (
    <>
      <WorkspaceSidebar isOpen={isSidebarOpen} onClose={onCloseSidebar} />
      <FloatingButton isOpen={isSidebarOpen} onClick={onToggleSidebar} />
    </>
  );
}
