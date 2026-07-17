import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/content/components/ui/Button';
import { STORAGE_KEYS } from '@/constants/storage';
import { ChromeStorageDriver } from '@/storage';

type WorkspaceTaskPriority = 'later' | 'next' | 'now';
type WorkspaceTaskStatus = 'done' | 'todo';

interface WorkspaceTask {
  readonly createdAt: string;
  readonly id: string;
  readonly priority: WorkspaceTaskPriority;
  readonly status: WorkspaceTaskStatus;
  readonly title: string;
  readonly updatedAt: string;
}

interface WorkspaceTasksPanelProps {
  readonly activeConversationTitle: string | null;
  readonly assignedCount: number;
  readonly folderCount: number;
  readonly onCreateFolder: () => void;
  readonly totalCount: number;
}

const PRESET_TASKS: readonly {
  readonly label: string;
  readonly priority: WorkspaceTaskPriority;
  readonly title: string;
}[] = [
  {
    label: 'Organize',
    priority: 'now',
    title: 'Move this conversation into the right folder',
  },
  {
    label: 'Summarize',
    priority: 'next',
    title: 'Create a short summary for this conversation',
  },
  {
    label: 'Export',
    priority: 'later',
    title: 'Export important conversations as Markdown',
  },
];

const PRIORITY_LABELS: Readonly<Record<WorkspaceTaskPriority, string>> = {
  later: 'Later',
  next: 'Next',
  now: 'Now',
};

export function WorkspaceTasksPanel({
  activeConversationTitle,
  assignedCount,
  folderCount,
  onCreateFolder,
  totalCount,
}: WorkspaceTasksPanelProps) {
  const storage = useMemo(() => createStorageDriver(), []);
  const [draftTitle, setDraftTitle] = useState('');
  const [priority, setPriority] = useState<WorkspaceTaskPriority>('now');
  const [statusMessage, setStatusMessage] = useState(
    storage === null ? 'Tasks are available after installing the extension.' : 'Loading tasks...',
  );
  const [tasks, setTasks] = useState<readonly WorkspaceTask[]>([]);

  useEffect(() => {
    if (storage === null) {
      return undefined;
    }

    const taskStorage = storage;
    let cancelled = false;

    async function loadTasks() {
      try {
        const storedTasks = await taskStorage.get<readonly WorkspaceTask[]>(STORAGE_KEYS.tasks);

        if (!cancelled) {
          setTasks(normalizeTasks(storedTasks));
          setStatusMessage('Tasks are saved locally in Chrome.');
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error instanceof Error ? error.message : 'Failed to load tasks.');
        }
      }
    }

    void loadTasks();

    const unsubscribe = taskStorage.subscribe((changes) => {
      const tasksChange = changes.find((change) => change.key === STORAGE_KEYS.tasks);

      if (tasksChange !== undefined) {
        setTasks(normalizeTasks(tasksChange.newValue));
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [storage]);

  const openTasks = tasks.filter((task) => task.status === 'todo');
  const doneTasks = tasks.filter((task) => task.status === 'done');
  const organizedPercent =
    totalCount === 0 ? 0 : Math.round(Math.min(100, (assignedCount / totalCount) * 100));

  async function saveTasks(nextTasks: readonly WorkspaceTask[]): Promise<void> {
    setTasks(nextTasks);

    if (storage === null) {
      return;
    }

    try {
      await storage.set(STORAGE_KEYS.tasks, nextTasks);
      setStatusMessage('Tasks saved.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save tasks.');
    }
  }

  function addTask(title: string, taskPriority: WorkspaceTaskPriority): void {
    const cleanTitle = title.trim();

    if (cleanTitle.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const nextTask: WorkspaceTask = {
      createdAt: now,
      id: createTaskId(),
      priority: taskPriority,
      status: 'todo',
      title: cleanTitle,
      updatedAt: now,
    };

    void saveTasks([nextTask, ...tasks]);
    setDraftTitle('');
  }

  function toggleTask(taskId: string): void {
    const now = new Date().toISOString();

    void saveTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'todo' ? 'done' : 'todo',
              updatedAt: now,
            }
          : task,
      ),
    );
  }

  function deleteTask(taskId: string): void {
    void saveTasks(tasks.filter((task) => task.id !== taskId));
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#f7faf9]">
      <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_62%,#fff7ed_100%)] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
              Step 3 - Task Board
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-950">Plan the next actions</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Turn useful chats into a clear local queue.
            </p>
          </div>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            {openTasks.length.toString()} open
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric label="Folders" value={folderCount} />
          <Metric label="Assigned" value={assignedCount} />
          <Metric label="Organized" value={organizedPercent} suffix="%" />
        </div>
      </div>

      <div className="grid gap-4 overflow-y-auto px-5 py-4">
        <form
          className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            addTask(draftTitle, priority);
          }}
        >
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            New task
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder={
                activeConversationTitle === null
                  ? 'Add a workspace task'
                  : `Follow up on ${activeConversationTitle}`
              }
              type="text"
              value={draftTitle}
              onChange={(event) => {
                setDraftTitle(event.currentTarget.value);
              }}
            />
          </label>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="inline-grid grid-cols-3 rounded-md border border-slate-200 bg-slate-50 p-0.5">
              {(['now', 'next', 'later'] as const).map((item) => (
                <button
                  key={item}
                  className={[
                    'h-8 rounded px-2 text-xs font-semibold transition',
                    priority === item
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-950',
                  ].join(' ')}
                  type="button"
                  onClick={() => {
                    setPriority(item);
                  }}
                >
                  {PRIORITY_LABELS[item]}
                </button>
              ))}
            </div>
            <Button className="h-9 px-3 text-xs" type="submit">
              Add Task
            </Button>
          </div>
        </form>

        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Quick actions
          </p>
          <div className="grid gap-2">
            {PRESET_TASKS.map((preset) => (
              <button
                key={preset.label}
                className="grid gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:outline-none"
                type="button"
                onClick={() => {
                  addTask(preset.title, preset.priority);
                }}
              >
                <span className="text-sm font-semibold text-slate-950">{preset.label}</span>
                <span className="text-xs leading-5 text-slate-600">{preset.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Open tasks
            </p>
            <button
              className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
              type="button"
              onClick={onCreateFolder}
            >
              New folder
            </button>
          </div>
          {openTasks.length === 0 ? (
            <EmptyTaskState />
          ) : (
            openTasks.map((task) => (
              <TaskRow key={task.id} task={task} onDelete={deleteTask} onToggle={toggleTask} />
            ))
          )}
        </div>

        {doneTasks.length > 0 ? (
          <div className="grid gap-2 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Completed
              </p>
              <button
                className="text-xs font-semibold text-slate-500 transition hover:text-red-700"
                type="button"
                onClick={() => {
                  void saveTasks(openTasks);
                }}
              >
                Clear completed
              </button>
            </div>
            {doneTasks.map((task) => (
              <TaskRow key={task.id} task={task} onDelete={deleteTask} onToggle={toggleTask} />
            ))}
          </div>
        ) : null}

        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
          {statusMessage}
        </p>
      </div>
    </section>
  );
}

interface MetricProps {
  readonly label: string;
  readonly suffix?: string;
  readonly value: number;
}

function Metric({ label, suffix = '', value }: MetricProps) {
  return (
    <div className="rounded-md border border-white/90 bg-white/85 px-2.5 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-950">
        {value.toString()}
        {suffix}
      </p>
    </div>
  );
}

interface TaskRowProps {
  readonly onDelete: (taskId: string) => void;
  readonly onToggle: (taskId: string) => void;
  readonly task: WorkspaceTask;
}

function TaskRow({ onDelete, onToggle, task }: TaskRowProps) {
  const done = task.status === 'done';

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50">
      <button
        aria-label={done ? 'Mark task as open' : 'Mark task as complete'}
        className={[
          'mt-0.5 flex size-5 items-center justify-center rounded border transition focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:outline-none',
          done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white',
        ].join(' ')}
        type="button"
        onClick={() => {
          onToggle(task.id);
        }}
      >
        <span className="text-[9px] font-bold text-white">{done ? 'OK' : ''}</span>
      </button>
      <div className="min-w-0">
        <p
          className={[
            'text-sm font-medium leading-5',
            done ? 'text-slate-500 line-through' : 'text-slate-950',
          ].join(' ')}
        >
          {task.title}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {PRIORITY_LABELS[task.priority]} priority - saved locally
        </p>
      </div>
      <button
        aria-label="Delete task"
        className="rounded px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-700 focus-visible:ring-4 focus-visible:ring-red-100 focus-visible:outline-none"
        type="button"
        onClick={() => {
          onDelete(task.id);
        }}
      >
        Delete
      </button>
    </div>
  );
}

function EmptyTaskState() {
  return (
    <div className="rounded-md border border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-5 text-center">
      <p className="text-sm font-semibold text-slate-950">No open tasks yet</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Add one manually or use a quick action above.
      </p>
    </div>
  );
}

function normalizeTasks(value: unknown): readonly WorkspaceTask[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isWorkspaceTask).sort(compareTasks);
}

function isWorkspaceTask(value: unknown): value is WorkspaceTask {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    isTaskPriority(candidate['priority']) &&
    isTaskStatus(candidate['status']) &&
    typeof candidate['title'] === 'string' &&
    typeof candidate['updatedAt'] === 'string'
  );
}

function isTaskPriority(value: unknown): value is WorkspaceTaskPriority {
  return value === 'later' || value === 'next' || value === 'now';
}

function isTaskStatus(value: unknown): value is WorkspaceTaskStatus {
  return value === 'done' || value === 'todo';
}

function compareTasks(first: WorkspaceTask, second: WorkspaceTask): number {
  if (first.status !== second.status) {
    return first.status === 'todo' ? -1 : 1;
  }

  const priorityDifference = getPriorityWeight(second.priority) - getPriorityWeight(first.priority);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return second.createdAt.localeCompare(first.createdAt);
}

function getPriorityWeight(priority: WorkspaceTaskPriority): number {
  switch (priority) {
    case 'now':
      return 3;
    case 'next':
      return 2;
    case 'later':
      return 1;
  }
}

function createTaskId(): string {
  const cryptoGlobal = globalThis as {
    readonly crypto?: {
      readonly randomUUID?: () => string;
    };
  };

  if (typeof cryptoGlobal.crypto?.randomUUID === 'function') {
    return cryptoGlobal.crypto.randomUUID();
  }

  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createStorageDriver(): ChromeStorageDriver | null {
  const chromeGlobal = globalThis as {
    readonly chrome?: unknown;
  };

  if (typeof chromeGlobal.chrome !== 'object' || chromeGlobal.chrome === null) {
    return null;
  }

  const candidate = chromeGlobal.chrome as {
    readonly storage?: {
      readonly local?: chrome.storage.StorageArea;
    };
  };

  if (candidate.storage?.local === undefined) {
    return null;
  }

  return new ChromeStorageDriver(candidate.storage.local);
}
