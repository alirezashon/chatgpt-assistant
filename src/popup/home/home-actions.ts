import {
  BookOpen,
  Braces,
  Bug,
  Code2,
  Database,
  FileText,
  GitPullRequest,
  Image,
  Languages,
  ListChecks,
  Mail,
  MessageSquareText,
  Mic2,
  NotebookPen,
  Pencil,
  PlayCircle,
  Scissors,
  Search,
  Volume2,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import {
  ActionContextResolver,
  FIRST_PARTY_ACTION_REGISTRY,
  type ProductAction,
} from '@/features/actions';
import { createMinimalPageContext, type PageContextSnapshot } from '@/features/context';
import { DEFAULT_APP_LOCALE, localizeProductAction, type AppLocale } from '@/i18n';

import type { HomeAction, HomePageContext } from './home-types';

const resolver = new ActionContextResolver();

export const SUMMARIZE_ACTION = actionById('page.summarize');
export const RESEARCH_ACTION = actionById('research.topic');
export const WORKFLOW_ACTION = actionById('workflow.start');
export const SAVE_MEMORY_ACTION = actionById('memory.saveContext');
export const SUMMARIZE_CHAT_ACTION = actionById('chat.summarizeThread');
export const EXTRACT_CHAT_TASKS_ACTION = actionById('chat.extractTasks');
export const IMPROVE_PROMPT_ACTION = actionById('prompt.improve');

export const PRIMARY_ACTIONS: readonly HomeAction[] = [
  SUMMARIZE_ACTION,
  RESEARCH_ACTION,
  actionById('image.edit'),
  actionById('data.extractStructured'),
];

export const FAVORITE_ACTIONS: readonly HomeAction[] = [
  actionById('language.normalizePersian'),
  actionById('language.speechToText'),
  actionById('image.edit'),
  actionById('video.cut'),
];

export const CAPABILITY_ACTIONS: readonly HomeAction[] = [
  actionById('github.reviewPr'),
  actionById('youtube.summarize'),
  actionById('email.reply'),
  actionById('image.edit'),
  actionById('video.cut'),
  actionById('language.textToSpeech'),
  actionById('language.speechToText'),
  actionById('code.findBug'),
  actionById('content.generateDocumentation'),
  actionById('meeting.createNotes'),
];

export function primaryActions(locale: AppLocale): readonly HomeAction[] {
  return PRIMARY_ACTIONS.map((action) => localizeHomeActionForLocale(action, locale));
}

export function primaryActionsForContext(
  context: HomePageContext | null,
  locale: AppLocale,
): readonly HomeAction[] {
  if (context?.pageKind === 'chat-empty') {
    return [IMPROVE_PROMPT_ACTION, WORKFLOW_ACTION, RESEARCH_ACTION, SAVE_MEMORY_ACTION].map(
      (action) => localizeHomeActionForLocale(action, locale),
    );
  }

  if (context?.pageKind === 'chat-thread') {
    return [
      SUMMARIZE_CHAT_ACTION,
      EXTRACT_CHAT_TASKS_ACTION,
      SAVE_MEMORY_ACTION,
      WORKFLOW_ACTION,
    ].map((action) => localizeHomeActionForLocale(action, locale));
  }

  return primaryActions(locale);
}

export function favoriteActions(locale: AppLocale): readonly HomeAction[] {
  return FAVORITE_ACTIONS.map((action) => localizeHomeActionForLocale(action, locale));
}

export function capabilityActions(locale: AppLocale): readonly HomeAction[] {
  return CAPABILITY_ACTIONS.map((action) => localizeHomeActionForLocale(action, locale));
}

export function summarizeAction(locale: AppLocale): HomeAction {
  return localizeHomeActionForLocale(SUMMARIZE_ACTION, locale);
}

export function researchAction(locale: AppLocale): HomeAction {
  return localizeHomeActionForLocale(RESEARCH_ACTION, locale);
}

export function workflowAction(locale: AppLocale): HomeAction {
  return localizeHomeActionForLocale(WORKFLOW_ACTION, locale);
}

/** Returns context-specific actions for the current website. */
export function contextActions(
  context: HomePageContext | null,
  locale: AppLocale = DEFAULT_APP_LOCALE,
): readonly HomeAction[] {
  return resolver
    .resolve({
      actions: FIRST_PARTY_ACTION_REGISTRY.all(),
      context: homeContextToPageContext(context),
    })
    .filter((resolved) => resolved.reasons.length > 0)
    .map((resolved) => actionToHomeAction(localizeProductAction(resolved.action, locale)));
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
    outcome: actionOutcome(action),
    requiredAiTools: action.requiredAiTools,
    suggestedFollowUps: action.suggestedFollowUps,
    title: action.title,
  };
}

function localizeHomeActionForLocale(action: HomeAction, locale: AppLocale): HomeAction {
  const localized = actionToHomeAction(
    localizeProductAction(
      FIRST_PARTY_ACTION_REGISTRY.get(action.id) ?? homeActionToProductAction(action),
      locale,
    ),
  );

  return {
    ...localized,
    outcome: homeOutcomeForLocale(localized, locale),
  };
}

function homeActionToProductAction(action: HomeAction): ProductAction {
  return {
    aliases: [],
    artifactsProduced: action.artifactsProduced ?? [],
    category: 'productivity',
    description: action.description,
    estimatedDurationSec: action.estimatedDurationSec ?? 18,
    executionPlan: action.executionPlan ?? [],
    icon: action.id,
    id: action.id,
    popularity: 0,
    requiredAiTools: action.requiredAiTools ?? [],
    requiredPermissions: [],
    suggestedFollowUps: action.suggestedFollowUps ?? [],
    supportedContexts: [],
    tags: [],
    title: action.title,
  };
}

function actionOutcome(action: ProductAction): string {
  const primaryArtifact = action.artifactsProduced[0];

  if (action.id === 'image.edit') {
    return 'Opens image studio';
  }

  if (action.id === 'video.cut') {
    return 'Opens video clipper';
  }

  if (action.id.startsWith('language.')) {
    return 'Opens language studio';
  }

  if (action.id.startsWith('chat.')) {
    return 'Creates chat workspace';
  }

  if (primaryArtifact !== undefined) {
    return `Creates ${primaryArtifact.title}`;
  }

  return 'Opens task workspace';
}

function homeOutcomeForLocale(action: HomeAction, locale: AppLocale): string {
  if (locale === 'en') {
    return action.outcome ?? 'Opens task workspace';
  }

  if (action.id === 'image.edit') {
    return 'استودیو تصویر را باز می‌کند';
  }

  if (action.id === 'video.cut') {
    return 'برش ویدیو را باز می‌کند';
  }

  if (action.id.startsWith('language.')) {
    return 'استودیو زبان را باز می‌کند';
  }

  if (action.id.startsWith('chat.')) {
    return 'فضای کار چت می‌سازد';
  }

  const artifact = action.artifactsProduced?.[0];

  if (artifact !== undefined) {
    return `${artifact.title} می‌سازد`;
  }

  return 'فضای کار وظیفه را باز می‌کند';
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
    case 'image':
      return Image;
    case 'list':
      return ListChecks;
    case 'mail':
      return Mail;
    case 'chat':
      return MessageSquareText;
    case 'memory':
      return BookOpen;
    case 'mic':
      return Mic2;
    case 'notes':
      return NotebookPen;
    case 'search':
      return Search;
    case 'translate':
    case 'languages':
      return Languages;
    case 'video':
      return PlayCircle;
    case 'volume':
      return Volume2;
    case 'scissors':
      return Scissors;
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
