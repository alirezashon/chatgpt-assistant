import {
  BookOpen,
  Braces,
  Bug,
  Code2,
  Database,
  FileText,
  GitPullRequest,
  Languages,
  ListChecks,
  Mail,
  NotebookPen,
  Pencil,
  PlayCircle,
  Search,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import {
  ActionContextResolver,
  FIRST_PARTY_ACTION_REGISTRY,
  type ProductAction,
} from '@/features/actions';
import { createMinimalPageContext, type PageContextSnapshot } from '@/features/context';

import type { HomeAction, HomePageContext } from './home-types';

const resolver = new ActionContextResolver();

export const SUMMARIZE_ACTION = actionById('page.summarize');
export const RESEARCH_ACTION = actionById('research.topic');
export const WORKFLOW_ACTION = actionById('workflow.start');
export const SAVE_MEMORY_ACTION = actionById('memory.saveContext');

export const PRIMARY_ACTIONS: readonly HomeAction[] = [
  SUMMARIZE_ACTION,
  RESEARCH_ACTION,
  actionById('data.extractStructured'),
  SAVE_MEMORY_ACTION,
];

export const FAVORITE_ACTIONS: readonly HomeAction[] = [
  actionById('github.reviewPr'),
  actionById('youtube.summarize'),
  actionById('email.reply'),
  actionById('data.extractStructured'),
];

export const CAPABILITY_ACTIONS: readonly HomeAction[] = [
  actionById('github.reviewPr'),
  actionById('youtube.summarize'),
  actionById('email.reply'),
  actionById('code.findBug'),
  actionById('content.generateDocumentation'),
  actionById('meeting.createNotes'),
];

/** Returns context-specific actions for the current website. */
export function contextActions(context: HomePageContext | null): readonly HomeAction[] {
  return resolver
    .resolve({
      actions: FIRST_PARTY_ACTION_REGISTRY.all(),
      context: homeContextToPageContext(context),
    })
    .filter((resolved) => resolved.reasons.length > 0)
    .map((resolved) => actionToHomeAction(resolved.action));
}

function actionById(actionId: string): HomeAction {
  const action = FIRST_PARTY_ACTION_REGISTRY.get(actionId);

  if (action === undefined) {
    throw new Error(`Unknown action ${actionId}`);
  }

  return actionToHomeAction(action);
}

function actionToHomeAction(action: ProductAction): HomeAction {
  return {
    artifactsProduced: action.artifactsProduced,
    description: action.description,
    estimatedDurationSec: action.estimatedDurationSec,
    executionPlan: action.executionPlan,
    icon: iconForAction(action.icon),
    id: action.id,
    requiredAiTools: action.requiredAiTools,
    suggestedFollowUps: action.suggestedFollowUps,
    title: action.title,
  };
}

function iconForAction(icon: string): LucideIcon {
  switch (icon) {
    case 'bug':
      return Bug;
    case 'code':
      return Code2;
    case 'database':
    case 'table':
      return Database;
    case 'document':
      return FileText;
    case 'git':
      return GitPullRequest;
    case 'list':
      return ListChecks;
    case 'mail':
      return Mail;
    case 'memory':
      return BookOpen;
    case 'notes':
      return NotebookPen;
    case 'search':
      return Search;
    case 'translate':
      return Languages;
    case 'video':
      return PlayCircle;
    case 'workflow':
      return Workflow;
    case 'write':
      return Pencil;
    default:
      return Braces;
  }
}

function homeContextToPageContext(context: HomePageContext | null): PageContextSnapshot | null {
  if (context === null) {
    return null;
  }

  return createMinimalPageContext({
    capturedAt: new Date().toISOString(),
    hostname: context.hostname,
    pageKind: context.pageKind,
    title: context.title,
    url: '',
  });
}
