import { STORAGE_KEYS } from '@/constants/storage';
import { localizeActionTitle, type AppLocale } from '@/i18n';
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
  const tasks = [task, ...current.tasks.filter((candidate) => candidate.id !== task.id)].slice(
    0,
    MAX_TASKS,
  );

  await storage.set(STORAGE_KEYS.sidebarWorkspace, {
    activeTaskId: task.id,
    tasks,
  } satisfies SidebarWorkspaceState);
}

/** Saves the complete sidebar workspace state. */
export async function saveSidebarWorkspace(workspace: SidebarWorkspaceState): Promise<void> {
  if (!hasChromeRuntime()) {
    return;
  }

  const storage = new ChromeExtensionStorage('local');
  await storage.set(STORAGE_KEYS.sidebarWorkspace, workspace);
}

/** Loads sidebar workspace state. */
export async function loadSidebarWorkspace(locale: AppLocale): Promise<SidebarWorkspaceState> {
  if (!hasChromeRuntime()) {
    return fallbackWorkspace(locale);
  }

  const storage = new ChromeExtensionStorage('local');
  return normalizeWorkspaceState(await storage.get(STORAGE_KEYS.sidebarWorkspace), locale);
}

/** Normalizes persisted workspace state. */
export function normalizeWorkspaceState(
  value: unknown,
  locale: AppLocale = 'fa',
): SidebarWorkspaceState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fallbackWorkspace(locale);
  }

  const candidate = value as Readonly<Record<string, unknown>>;
  const tasks = Array.isArray(candidate['tasks']) ? candidate['tasks'].filter(isSidebarTask) : [];
  const activeTaskId =
    typeof candidate['activeTaskId'] === 'string' ? candidate['activeTaskId'] : tasks[0]?.id;

  if (tasks.length === 0 || activeTaskId === undefined) {
    return fallbackWorkspace(locale);
  }

  return {
    activeTaskId,
    tasks,
  };
}

function fallbackWorkspace(locale: AppLocale): SidebarWorkspaceState {
  const now = new Date().toISOString();
  const isFa = locale === 'fa';
  const task: SidebarTask = {
    actionId: 'waiting-for-action',
    artifacts: [
      {
        format: 'Checklist',
        id: 'artifact-action-plan',
        pinned: true,
        title: isFa ? 'برنامه اقدام' : 'Action plan',
      },
    ],
    context: [
      {
        label: isFa ? 'منبع' : 'Source',
        value: isFa ? 'کاری از صفحه فعال نیست' : 'No active page task',
      },
      {
        label: isFa ? 'حالت' : 'Mode',
        value: isFa ? 'در انتظار اکشن Popup' : 'Waiting for popup action',
      },
      { label: isFa ? 'فضای کار' : 'Workspace', value: isFa ? 'وظیفه‌محور' : 'Task-first' },
    ],
    createdAt: now,
    durationSec: 0,
    elapsedStartedAt: now,
    followUps: [
      { id: 'open-popup', title: isFa ? 'انتخاب اکشن' : 'Choose Action' },
      { id: 'run-workflow', title: localizeActionTitle('workflow.start', 'Run Workflow', locale) },
    ],
    historyLabel: isFa ? 'در انتظار کار' : 'Waiting for task',
    icon: 'PanelRight',
    id: 'task-waiting',
    messages: [
      {
        id: 'message-waiting',
        kind: 'thinking',
        label: isFa ? 'در انتظار' : 'Waiting',
        text: isFa
          ? 'برای شروع فضای کار متمرکز، از Popup یک اکشن انتخاب کن.'
          : 'Choose an action from the popup to start a focused workspace.',
        timestamp: now,
      },
    ],
    results: [
      {
        content: isFa
          ? ['در صفحه خانه یک اکشن انتخاب کن', 'نتایج و خروجی‌ها در این فضا ضمیمه می‌شوند']
          : ['Pick an action in Home', 'This workspace will attach results and artifacts here'],
        format: 'checklist',
        id: 'result-waiting',
        title: isFa ? 'آماده برای کار' : 'Ready for a task',
      },
    ],
    status: 'waiting',
    title: isFa ? 'در انتظار اکشن انتخابی' : 'Waiting For Selected Action',
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
