import { STORAGE_KEYS } from '@/constants/storage';
import { hasChromeRuntime } from '@/lib/chrome/chrome-api';
import { ChromeExtensionStorage } from '@/lib/storage';

import type { SidebarTask, SidebarWorkspaceState } from './sidebar-workspace-types';

const MAX_TASKS = 8;

/** Saves sidebar workspace state. */
export async function saveSidebarTask(task: SidebarTask): Promise<void> {
  if (!hasChromeRuntime()) {
    return;
  }

  const storage = new ChromeExtensionStorage('local');
  const current = normalizeWorkspaceState(await storage.get(STORAGE_KEYS.sidebarWorkspace));
  const tasks = [task, ...current.tasks.filter((candidate) => candidate.id !== task.id)].slice(0, MAX_TASKS);

  await storage.set(STORAGE_KEYS.sidebarWorkspace, {
    activeTaskId: task.id,
    tasks,
  } satisfies SidebarWorkspaceState);
}

/** Loads sidebar workspace state. */
export async function loadSidebarWorkspace(): Promise<SidebarWorkspaceState> {
  if (!hasChromeRuntime()) {
    return fallbackWorkspace();
  }

  const storage = new ChromeExtensionStorage('local');
  return normalizeWorkspaceState(await storage.get(STORAGE_KEYS.sidebarWorkspace));
}

/** Normalizes persisted workspace state. */
export function normalizeWorkspaceState(value: unknown): SidebarWorkspaceState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fallbackWorkspace();
  }

  const candidate = value as Readonly<Record<string, unknown>>;
  const tasks = Array.isArray(candidate['tasks']) ? candidate['tasks'].filter(isSidebarTask) : [];
  const activeTaskId = typeof candidate['activeTaskId'] === 'string' ? candidate['activeTaskId'] : tasks[0]?.id;

  if (tasks.length === 0 || activeTaskId === undefined) {
    return fallbackWorkspace();
  }

  return {
    activeTaskId,
    tasks,
  };
}

function fallbackWorkspace(): SidebarWorkspaceState {
  const now = new Date().toISOString();
  const task: SidebarTask = {
    actionId: 'waiting-for-action',
    artifacts: [
      { format: 'Checklist', id: 'artifact-action-plan', pinned: true, title: 'Action plan' },
    ],
    context: [
      { label: 'Source', value: 'No active page task' },
      { label: 'Mode', value: 'Waiting for popup action' },
      { label: 'Workspace', value: 'Task-first' },
    ],
    createdAt: now,
    durationSec: 0,
    elapsedStartedAt: now,
    followUps: [
      { id: 'open-popup', title: 'Choose Action' },
      { id: 'run-workflow', title: 'Run Workflow' },
    ],
    historyLabel: 'Waiting for task',
    icon: 'PanelRight',
    id: 'task-waiting',
    messages: [
      {
        id: 'message-waiting',
        kind: 'thinking',
        label: 'Waiting',
        text: 'Choose an action from the popup to start a focused workspace.',
        timestamp: now,
      },
    ],
    results: [
      {
        content: ['Pick an action in Home', 'This workspace will attach results and artifacts here'],
        format: 'checklist',
        id: 'result-waiting',
        title: 'Ready for a task',
      },
    ],
    status: 'waiting',
    title: 'Waiting For Selected Action',
    updatedAt: now,
  };

  return {
    activeTaskId: task.id,
    tasks: [task],
  };
}

function isSidebarTask(value: unknown): value is SidebarTask {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['title'] === 'string' &&
    typeof candidate['status'] === 'string' &&
    Array.isArray(candidate['context']) &&
    Array.isArray(candidate['messages']) &&
    Array.isArray(candidate['results']) &&
    Array.isArray(candidate['artifacts']) &&
    Array.isArray(candidate['followUps'])
  );
}
