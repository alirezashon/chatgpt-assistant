import { create } from 'zustand';

import type { PageContextSnapshot } from '@/features/context';
import type { SurfaceId } from '@/features/surfaces';

interface AppStoreState {
  readonly activeSurface: SurfaceId | null;
  readonly currentContext: PageContextSnapshot | null;
  readonly lastCommandId: string | null;
  readonly setActiveSurface: (surface: SurfaceId | null) => void;
  readonly setCurrentContext: (context: PageContextSnapshot | null) => void;
  readonly setLastCommandId: (commandId: string | null) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  activeSurface: null,
  currentContext: null,
  lastCommandId: null,
  setActiveSurface: (surface) => {
    set({ activeSurface: surface });
  },
  setCurrentContext: (context) => {
    set({ currentContext: context });
  },
  setLastCommandId: (commandId) => {
    set({ lastCommandId: commandId });
  },
}));
