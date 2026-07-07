import type { AssignmentState } from '@/features/assignments/assignment-types';
import { createStore } from '@/state';

export const initialAssignmentState: AssignmentState = {
  assignments: [],
  error: null,
  status: 'idle',
};

export const assignmentStore = createStore<AssignmentState>(initialAssignmentState);
