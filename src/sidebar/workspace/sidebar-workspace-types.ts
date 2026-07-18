import type {
  ActionArtifactDefinition,
  ActionExecutionStep,
  ActionFollowUp,
  ProductAction,
} from '@/features/actions';
import type { HomeAction, HomePageContext } from '@/popup/home/home-types';
import type { PageContextSnapshot } from '@/features/context';

/** Sidebar task status. */
export type SidebarTaskStatus = 'completed' | 'failed' | 'running' | 'waiting';

/** Sidebar task stage. */
export type SidebarTaskStage = 'calling-tool' | 'completed' | 'reading' | 'searching' | 'thinking';

/** Context item shown in the task workspace. */
export interface SidebarContextItem {
  readonly label: string;
  readonly value: string;
}

/** Compact task message. */
export interface SidebarTaskMessage {
  readonly id: string;
  readonly kind: SidebarTaskStage;
  readonly label: string;
  readonly text: string;
  readonly timestamp: string;
}

/** Generated result block. */
export interface SidebarResult {
  readonly id: string;
  readonly format: 'checklist' | 'markdown' | 'summary';
  readonly title: string;
  readonly content: readonly string[];
}

/** Durable artifact. */
export interface SidebarArtifact {
  readonly id: string;
  readonly format:
    'Audio' | 'Checklist' | 'Image' | 'Markdown' | 'Notes' | 'Table' | 'Transcript' | 'Video';
  readonly pinned: boolean;
  readonly title: string;
}

/** Media asset attached to a task workspace. */
export interface SidebarMediaAsset {
  readonly dataUrl?: string;
  readonly durationSec?: number;
  readonly height?: number;
  readonly id: string;
  readonly kind: 'image' | 'video';
  readonly mimeType: string;
  readonly name: string;
  readonly source: 'page' | 'upload' | 'generated';
  readonly sourceUrl?: string;
  readonly width?: number;
}

/** Follow-up action. */
export interface SidebarFollowUpAction {
  readonly id: string;
  readonly title: string;
}

/** Sidebar task. */
export interface SidebarTask {
  readonly id: string;
  readonly actionId: string;
  readonly context: readonly SidebarContextItem[];
  readonly createdAt: string;
  readonly durationSec: number;
  readonly elapsedStartedAt: string;
  readonly followUps: readonly SidebarFollowUpAction[];
  readonly historyLabel: string;
  readonly icon: string;
  readonly messages: readonly SidebarTaskMessage[];
  readonly results: readonly SidebarResult[];
  readonly artifacts: readonly SidebarArtifact[];
  readonly mediaAssets?: readonly SidebarMediaAsset[];
  readonly status: SidebarTaskStatus;
  readonly title: string;
  readonly updatedAt: string;
}

/** Persisted sidebar workspace. */
export interface SidebarWorkspaceState {
  readonly activeTaskId: string;
  readonly tasks: readonly SidebarTask[];
}

/** Generic task action input used by command and popup surfaces. */
export interface SidebarTaskActionInput {
  readonly description?: string;
  readonly artifactsProduced?: readonly ActionArtifactDefinition[];
  readonly estimatedDurationSec?: number;
  readonly executionPlan?: readonly ActionExecutionStep[];
  readonly followUps?: readonly ActionFollowUp[];
  readonly iconName?: string;
  readonly id: string;
  readonly requiredAiTools?: readonly string[];
  readonly title: string;
}

interface LooseSidebarTaskActionInput {
  readonly description?: string | undefined;
  readonly artifactsProduced?: readonly ActionArtifactDefinition[] | undefined;
  readonly estimatedDurationSec?: number | undefined;
  readonly executionPlan?: readonly ActionExecutionStep[] | undefined;
  readonly followUps?: readonly ActionFollowUp[] | undefined;
  readonly iconName?: string | undefined;
  readonly id: string;
  readonly requiredAiTools?: readonly string[] | undefined;
  readonly title: string;
}

/** Generic context input used by command and popup surfaces. */
export interface SidebarTaskContextInput {
  readonly confidence?: number;
  readonly hostname: string;
  readonly label: string;
  readonly pageKind: string;
  readonly selectedText?: string;
  readonly url?: string;
}

/** Creates a sidebar task from a popup action. */
export function createSidebarTask(input: {
  readonly action: HomeAction;
  readonly context: HomePageContext | null;
  readonly now?: string;
}): SidebarTask {
  const action = compactActionInput({
    artifactsProduced: input.action.artifactsProduced,
    description: input.action.description,
    estimatedDurationSec: input.action.estimatedDurationSec,
    executionPlan: input.action.executionPlan,
    followUps: input.action.suggestedFollowUps,
    iconName: input.action.icon.displayName ?? input.action.id,
    id: input.action.id,
    requiredAiTools: input.action.requiredAiTools,
    title: input.action.title,
  });
  const taskInput: {
    readonly action: SidebarTaskActionInput;
    readonly context: SidebarTaskContextInput | null;
    readonly now?: string;
  } = {
    action,
    context: homeContextToSidebarContext(input.context),
  };

  return createSidebarTaskFromAction(
    input.now === undefined
      ? taskInput
      : {
          ...taskInput,
          now: input.now,
        },
  );
}

/** Creates a sidebar task from a product action. */
export function createSidebarTaskFromProductAction(input: {
  readonly action: ProductAction;
  readonly context: PageContextSnapshot | null;
  readonly now?: string;
}): SidebarTask {
  const taskInput: {
    readonly action: SidebarTaskActionInput;
    readonly context: SidebarTaskContextInput | null;
    readonly now?: string;
  } = {
    action: {
      artifactsProduced: input.action.artifactsProduced,
      description: input.action.description,
      estimatedDurationSec: input.action.estimatedDurationSec,
      executionPlan: input.action.executionPlan,
      followUps: input.action.suggestedFollowUps,
      iconName: input.action.icon,
      id: input.action.id,
      requiredAiTools: input.action.requiredAiTools,
      title: input.action.title,
    },
    context: pageContextToSidebarContext(input.context),
  };

  return createSidebarTaskFromAction(
    input.now === undefined
      ? taskInput
      : {
          ...taskInput,
          now: input.now,
        },
  );
}

/** Creates a sidebar task from a generic command/action. */
export function createSidebarTaskFromAction(input: {
  readonly action: SidebarTaskActionInput;
  readonly context: SidebarTaskContextInput | null;
  readonly now?: string;
}): SidebarTask {
  const now = input.now ?? new Date().toISOString();
  const context = contextItems(input.context);
  const taskTitle = taskTitleForAction(input.action.title, input.context);

  return {
    actionId: input.action.id,
    artifacts: artifactsForAction(input.action),
    context,
    createdAt: now,
    durationSec: input.action.estimatedDurationSec ?? 18,
    elapsedStartedAt: now,
    followUps: followUpsForAction(input.action),
    historyLabel: input.action.title,
    icon: input.action.iconName ?? input.action.id,
    id: `sidebar-task-${crypto.randomUUID()}`,
    messages: messagesForAction(input.action, input.context, now),
    results: [
      {
        content: resultContentForAction(input.action),
        format: 'summary',
        id: `result-${crypto.randomUUID()}`,
        title: `${input.action.title} result`,
      },
    ],
    status: 'completed',
    title: taskTitle,
    updatedAt: now,
  };
}

/** Converts a page snapshot into sidebar task context. */
export function pageContextToSidebarContext(
  context: PageContextSnapshot | null,
): SidebarTaskContextInput | null {
  if (context === null) {
    return null;
  }

  return {
    hostname: context.hostname,
    label: context.title.length > 0 ? context.title : context.hostname,
    pageKind: context.pageKind,
    url: context.url,
    ...(context.selectedText === undefined ? {} : { selectedText: context.selectedText }),
  };
}

function homeContextToSidebarContext(
  context: HomePageContext | null,
): SidebarTaskContextInput | null {
  if (context === null) {
    return null;
  }

  return {
    confidence: context.confidence,
    hostname: context.hostname,
    label: context.label,
    pageKind: context.pageKind,
  };
}

function contextItems(context: SidebarTaskContextInput | null): readonly SidebarContextItem[] {
  if (context === null) {
    return [
      { label: 'Context', value: 'Current browser task' },
      { label: 'Source', value: 'Extension action' },
      { label: 'Mode', value: 'User initiated' },
    ];
  }

  return [
    { label: 'Website', value: context.label },
    { label: 'Page type', value: context.pageKind },
    { label: 'Source', value: context.hostname },
    ...(context.confidence === undefined
      ? []
      : [{ label: 'Confidence', value: `${context.confidence.toString()}%` }]),
    ...(context.selectedText === undefined
      ? []
      : [
          {
            label: 'Selection',
            value: `${context.selectedText.slice(0, 72)}${context.selectedText.length > 72 ? '...' : ''}`,
          },
        ]),
  ];
}

function taskTitleForAction(actionTitle: string, context: SidebarTaskContextInput | null): string {
  const target = context?.label ?? 'Current Page';

  if (actionTitle.includes('Summarize')) {
    return `Summarizing ${target}`;
  }

  if (actionTitle.includes('Research')) {
    return `Researching ${target}`;
  }

  if (actionTitle.includes('Review')) {
    return `Reviewing ${target}`;
  }

  return `${actionTitle} - ${target}`;
}

function artifactsForAction(action: SidebarTaskActionInput): readonly SidebarArtifact[] {
  if (action.artifactsProduced !== undefined && action.artifactsProduced.length > 0) {
    return action.artifactsProduced.map((artifact, index) => ({
      format: artifact.format,
      id: `artifact-${crypto.randomUUID()}`,
      pinned: index === 0,
      title: artifact.title,
    }));
  }

  return [
    {
      format: action.title.includes('Extract') ? 'Table' : 'Markdown',
      id: `artifact-${crypto.randomUUID()}`,
      pinned: false,
      title: `${action.title} output`,
    },
    {
      format: 'Checklist',
      id: `artifact-${crypto.randomUUID()}`,
      pinned: true,
      title: 'Next actions',
    },
  ];
}

function followUpsForAction(action: SidebarTaskActionInput): readonly SidebarFollowUpAction[] {
  if (action.followUps !== undefined && action.followUps.length > 0) {
    return action.followUps.map((followUp) => ({
      id: followUp.actionId,
      title: followUp.title,
    }));
  }

  return [
    { id: 'improve', title: 'Improve' },
    { id: 'export', title: 'Export' },
    { id: 'save-memory', title: 'Save To Memory' },
    {
      id: action.title.includes('Workflow') ? 'run-again' : 'create-workflow',
      title: action.title.includes('Workflow') ? 'Run Again' : 'Create Workflow',
    },
  ];
}

function resultContentForAction(action: SidebarTaskActionInput): readonly string[] {
  if (action.executionPlan !== undefined && action.executionPlan.length > 0) {
    return action.executionPlan.map((step) => `${step.label}: ${step.description}`);
  }

  if (action.title.includes('Research')) {
    return ['Scope the topic', 'Compare trusted sources', 'Return concise findings with citations'];
  }

  if (action.title.includes('Rewrite')) {
    return ['Preserve meaning', 'Improve clarity', 'Keep tone consistent with the page context'];
  }

  if (action.title.includes('Review')) {
    return ['Identify risk areas', 'Check missing tests', 'Summarize review-ready changes'];
  }

  return [
    'Capture the important context',
    'Produce a structured result',
    'Attach reusable artifacts',
  ];
}

function messagesForAction(
  action: SidebarTaskActionInput,
  context: SidebarTaskContextInput | null,
  timestamp: string,
): readonly SidebarTaskMessage[] {
  const plan = action.executionPlan;

  if (plan !== undefined && plan.length > 0) {
    return plan.slice(0, 4).map((step, index) => ({
      id: `message-${crypto.randomUUID()}`,
      kind: stageForIndex(index),
      label: step.label,
      text: step.description,
      timestamp,
    }));
  }

  return [
    {
      id: `message-${crypto.randomUUID()}`,
      kind: 'thinking',
      label: 'Planning action',
      text: `Preparing ${action.title.toLowerCase()} with the current context.`,
      timestamp,
    },
    {
      id: `message-${crypto.randomUUID()}`,
      kind: 'reading',
      label: 'Reading context',
      text:
        context === null
          ? 'No page context was available.'
          : `Using ${context.label} as task context.`,
      timestamp,
    },
    {
      id: `message-${crypto.randomUUID()}`,
      kind: 'calling-tool',
      label: 'Producing artifacts',
      text: 'Workspace artifacts will be attached below instead of buried in chat.',
      timestamp,
    },
  ];
}

function stageForIndex(index: number): SidebarTaskStage {
  switch (index) {
    case 0:
      return 'reading';
    case 1:
      return 'thinking';
    case 2:
      return 'calling-tool';
    default:
      return 'completed';
  }
}

function compactActionInput(action: LooseSidebarTaskActionInput): SidebarTaskActionInput {
  return {
    id: action.id,
    title: action.title,
    ...(action.description === undefined ? {} : { description: action.description }),
    ...(action.artifactsProduced === undefined
      ? {}
      : { artifactsProduced: action.artifactsProduced }),
    ...(action.estimatedDurationSec === undefined
      ? {}
      : { estimatedDurationSec: action.estimatedDurationSec }),
    ...(action.executionPlan === undefined ? {} : { executionPlan: action.executionPlan }),
    ...(action.followUps === undefined ? {} : { followUps: action.followUps }),
    ...(action.iconName === undefined ? {} : { iconName: action.iconName }),
    ...(action.requiredAiTools === undefined ? {} : { requiredAiTools: action.requiredAiTools }),
  };
}
