import type { ActionState } from '@/features/actions/action-types';
import { createStore } from '@/state';

export const initialActionState: ActionState = {
  error: null,
  folderPicker: {
    open: false,
    query: '',
    targetIds: [],
  },
  history: [],
  menu: {
    open: false,
    targetIds: [],
    x: 0,
    y: 0,
  },
  rename: {
    conversationId: null,
    open: false,
  },
  selectedConversationIds: [],
  status: 'idle',
};

export const actionStore = createStore<ActionState>(initialActionState);
