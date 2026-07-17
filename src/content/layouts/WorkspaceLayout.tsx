import { FloatingButton } from '@/content/components/FloatingButton';
import { WorkspaceSidebar } from '@/content/components/WorkspaceSidebar';
import type { UiPosition } from '@/app/synchronization';

interface WorkspaceLayoutProps {
  readonly floatingButtonPosition: UiPosition | null;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  readonly onMoveFloatingButton: (position: UiPosition) => void;
  readonly onResizeSidebar: (width: number) => void;
  onToggleSidebar: () => void;
  readonly sidebarWidth: number;
}

export function WorkspaceLayout({
  floatingButtonPosition,
  isSidebarOpen,
  onCloseSidebar,
  onMoveFloatingButton,
  onResizeSidebar,
  onToggleSidebar,
  sidebarWidth,
}: WorkspaceLayoutProps) {
  return (
    <>
      <WorkspaceSidebar
        isOpen={isSidebarOpen}
        width={sidebarWidth}
        onClose={onCloseSidebar}
        onResize={onResizeSidebar}
      />
      <FloatingButton
        isOpen={isSidebarOpen}
        position={floatingButtonPosition}
        onClick={onToggleSidebar}
        onMove={onMoveFloatingButton}
      />
    </>
  );
}
