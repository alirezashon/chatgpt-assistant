import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { SurfaceRoot } from '@/design-system';
import { copyForLocale, localeDirection, useAppLocale } from '@/i18n';
import { activateTab, getActiveTab } from '@/lib/chrome/chrome-api';

import { ArtifactPanel } from './ArtifactPanel';
import { ConversationProgressPanel } from './ConversationProgressPanel';
import { CurrentContextPanel } from './CurrentContextPanel';
import { FollowUpPanel } from './FollowUpPanel';
import { GeneratedResultsPanel } from './GeneratedResultsPanel';
import { LanguageStudioPanel } from './LanguageStudioPanel';
import { loadSidebarWorkspace, saveSidebarWorkspace } from './sidebar-workspace-storage';
import { MediaStudioPanel } from './MediaStudioPanel';
import type {
  SidebarArtifact,
  SidebarTask,
  SidebarWorkspaceState,
} from './sidebar-workspace-types';
import { createSidebarTaskFromAction } from './sidebar-workspace-types';
import { StatusBar } from './StatusBar';
import { TaskHeader } from './TaskHeader';
import { TaskHistoryPanel } from './TaskHistoryPanel';

export function SidebarWorkspace() {
  const [locale] = useAppLocale();
  const copy = copyForLocale(locale);
  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft;
  const [workspace, setWorkspace] = useState<SidebarWorkspaceState | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadSidebarWorkspace(locale).then((loaded) => {
      if (!cancelled) {
        setWorkspace(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const activeTask = useMemo(() => {
    if (workspace === null) {
      return null;
    }

    return (
      workspace.tasks.find((task) => task.id === workspace.activeTaskId) ??
      workspace.tasks[0] ??
      null
    );
  }, [workspace]);

  if (workspace === null || activeTask === null) {
    return <LoadingWorkspace loadingLabel={copy.sidebar.loading} locale={locale} />;
  }

  const persistWorkspace = (nextWorkspace: SidebarWorkspaceState): void => {
    setWorkspace(nextWorkspace);
    void saveSidebarWorkspace(nextWorkspace);
  };

  const updateActiveTask = (updater: (task: SidebarTask) => SidebarTask): void => {
    const nextTask = updater(activeTask);
    persistWorkspace({
      activeTaskId: nextTask.id,
      tasks: workspace.tasks.map((task) => (task.id === activeTask.id ? nextTask : task)),
    });
  };

  const addWorkspaceTask = (task: SidebarTask): void => {
    persistWorkspace({
      activeTaskId: task.id,
      tasks: [task, ...workspace.tasks.filter((candidate) => candidate.id !== task.id)].slice(0, 8),
    });
  };

  const handleCancelTask = (): void => {
    updateActiveTask((task) => ({
      ...appendTaskMessage(task, 'Cancelled', 'The running task was stopped by the user.'),
      status: 'failed',
      updatedAt: new Date().toISOString(),
    }));
    toast.success('Task cancelled');
  };

  const handleBackToPage = async (): Promise<void> => {
    const tab = await getActiveTab();

    if (tab?.id !== undefined) {
      await activateTab(tab.id);
    }

    window.close();
  };

  const handleFollowUp = (action: { readonly id: string; readonly title: string }): void => {
    addWorkspaceTask(
      createSidebarTaskFromAction({
        action: {
          estimatedDurationSec: activeTask.durationSec,
          id: action.id,
          title: action.title,
        },
        context: null,
      }),
    );
    toast.success(`Started ${action.title}`);
  };

  const handleRepeatTask = (): void => {
    const now = new Date().toISOString();
    addWorkspaceTask({
      ...activeTask,
      createdAt: now,
      elapsedStartedAt: now,
      historyLabel: `Repeat ${activeTask.historyLabel}`,
      id: `sidebar-task-${crypto.randomUUID()}`,
      status: 'completed',
      title: `Repeat ${activeTask.title}`,
      updatedAt: now,
    });
    toast.success('Task repeated');
  };

  const handleCopyArtifact = async (artifact: SidebarArtifact): Promise<void> => {
    await navigator.clipboard.writeText(artifactText(activeTask, artifact));
    toast.success('Artifact copied');
  };

  const handleExportArtifact = (artifact: SidebarArtifact): void => {
    downloadTextFile(`${safeFileName(artifact.title)}.md`, artifactText(activeTask, artifact));
    toast.success('Artifact exported');
  };

  const handleReopenArtifact = (artifact: SidebarArtifact | null): void => {
    const selected = artifact ?? activeTask.artifacts[0];

    if (selected === undefined) {
      toast.error('No artifact to open');
      return;
    }

    openTextInNewTab(artifactText(activeTask, selected));
    toast.success('Artifact opened');
  };

  const handleSaveArtifact = (artifact: SidebarArtifact): void => {
    updateActiveTask((task) =>
      appendTaskMessage(task, 'Saved artifact', `${artifact.title} was saved in this workspace.`),
    );
    toast.success('Artifact saved');
  };

  const handlePinArtifact = (artifact: SidebarArtifact): void => {
    updateActiveTask((task) => ({
      ...task,
      artifacts: task.artifacts.map((candidate) =>
        candidate.id === artifact.id ? { ...candidate, pinned: !candidate.pinned } : candidate,
      ),
      updatedAt: new Date().toISOString(),
    }));
    toast.success(artifact.pinned ? 'Artifact unpinned' : 'Artifact pinned');
  };

  return (
    <SurfaceRoot dir={localeDirection(locale)} lang={locale} size="sidebar">
      <div className="flex min-h-screen flex-col">
        <TaskHeader
          backIcon={BackIcon}
          copy={copy.sidebar}
          task={activeTask}
          onBackToPage={() => {
            void handleBackToPage();
          }}
          onCancelTask={handleCancelTask}
        />
        <div className="grid flex-1 gap-[var(--ds-space-3)] p-[var(--ds-space-4)]">
          <CurrentContextPanel copy={copy.sidebar} task={activeTask} />
          <div className="grid gap-[var(--ds-space-3)] xl:grid-cols-[1.05fr_0.95fr]">
            <ConversationProgressPanel copy={copy.sidebar} locale={locale} task={activeTask} />
            <GeneratedResultsPanel copy={copy.sidebar} task={activeTask} />
          </div>
          <ArtifactPanel
            copy={copy.sidebar}
            task={activeTask}
            onCopyArtifact={(artifact) => {
              void handleCopyArtifact(artifact);
            }}
            onExportArtifact={handleExportArtifact}
            onPinArtifact={handlePinArtifact}
            onReopenArtifact={handleReopenArtifact}
            onSaveArtifact={handleSaveArtifact}
          />
          <MediaStudioPanel copy={copy.sidebar} task={activeTask} onUpdateTask={updateActiveTask} />
          <LanguageStudioPanel copy={copy.sidebar} locale={locale} task={activeTask} />
          <FollowUpPanel copy={copy.sidebar} task={activeTask} onRunFollowUp={handleFollowUp} />
          <TaskHistoryPanel
            activeTaskId={activeTask.id}
            copy={copy.sidebar}
            locale={locale}
            tasks={workspace.tasks}
            onSelectTask={(taskId) => {
              setWorkspace({
                ...workspace,
                activeTaskId: taskId,
              });
            }}
            onRepeatTask={handleRepeatTask}
          />
        </div>
        <StatusBar copy={copy.sidebar} task={activeTask} />
      </div>
    </SurfaceRoot>
  );
}

function appendTaskMessage(task: SidebarTask, label: string, text: string): SidebarTask {
  return {
    ...task,
    messages: [
      ...task.messages,
      {
        id: `message-${crypto.randomUUID()}`,
        kind: 'completed',
        label,
        text,
        timestamp: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function artifactText(task: SidebarTask, artifact: SidebarArtifact): string {
  const context = task.context.map((item) => `- ${item.label}: ${item.value}`).join('\n');
  const results = task.results
    .map((result) =>
      [`## ${result.title}`, ...result.content.map((item) => `- ${item}`)].join('\n'),
    )
    .join('\n\n');

  return [
    `# ${artifact.title}`,
    '',
    `Format: ${artifact.format}`,
    '',
    '## Context',
    context,
    '',
    results,
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

function downloadTextFile(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function openTextInNewTab(text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9-]+/giu, '-').replace(/^-|-$/gu, '') || 'artifact';
}

function LoadingWorkspace({
  loadingLabel,
  locale,
}: {
  readonly loadingLabel: string;
  readonly locale: 'en' | 'fa';
}) {
  return (
    <SurfaceRoot dir={localeDirection(locale)} lang={locale} size="sidebar">
      <div className="grid min-h-screen place-items-center p-[var(--ds-space-4)]">
        <div className="rounded-[var(--ds-radius-lg)] border border-[color:var(--ds-color-border)] bg-[var(--ds-color-panel)] px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text-muted)]">
          {loadingLabel}
        </div>
      </div>
    </SurfaceRoot>
  );
}
