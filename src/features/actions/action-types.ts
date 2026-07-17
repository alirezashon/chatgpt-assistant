import type { PageContextSnapshot, PageKind } from '@/features/context';
import type { WorkspaceRuntimeState } from '@/app/workspace/workspace-types';
import type { FavoriteService } from '@/features/favorites';
import type { ConversationAssignment } from '@/features/assignments';
import type { Conversation } from '@/features/conversations';
import type { EntityId, Folder } from '@/shared/types';

/** Legacy workspace action icon names. */
export type ActionIcon =
  | 'copy'
  | 'external'
  | 'folder'
  | 'heart'
  | 'menu'
  | 'rename'
  | 'select'
  | 'sparkle'
  | 'trash';

/** Legacy workspace action kind. */
export type ActionKind = 'danger' | 'normal';

/** Legacy workspace action scope. */
export type ActionScope = 'bulk' | 'conversation' | 'global';

/** Upgrade prompt for gated legacy actions. */
export interface ActionUpgradePrompt {
  readonly body: string;
  readonly ctaLabel: string;
  readonly title: string;
}

/** Context passed to legacy workspace actions. */
export interface ActionContext {
  readonly favoriteService: FavoriteService;
  readonly targetIds: readonly EntityId[];
  readonly workspace: WorkspaceRuntimeState;
}

/** Result returned by legacy workspace actions. */
export type ActionExecutionOutcome =
  | {
      readonly message?: string;
      readonly type: 'completed';
    }
  | {
      readonly type: 'folderPickerRequested' | 'renameRequested' | 'selectionRequested';
    };

/** Legacy workspace menu action definition. */
export interface ActionDefinition {
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly execute: (
    context: ActionContext,
  ) => Promise<ActionExecutionOutcome> | ActionExecutionOutcome;
  readonly icon: ActionIcon;
  readonly id: string;
  readonly kind: ActionKind;
  readonly label: string;
  readonly premiumFeatureId?: string;
  readonly scope: ActionScope;
  readonly separatorBefore?: boolean;
  readonly shortcut?: string;
  readonly upgradePrompt?: ActionUpgradePrompt;
}

/** Legacy workspace action provider. */
export interface ActionProvider {
  readonly getActions: (context: ActionContext) => readonly ActionDefinition[];
  readonly id: string;
}

/** Recovery snapshot for reversible or destructive legacy actions. */
export interface ActionRecoverySnapshot {
  readonly actionId: string;
  readonly assignments: readonly ConversationAssignment[];
  readonly capturedAt: string;
  readonly conversations: readonly Conversation[];
  readonly folders: readonly Folder[];
  readonly targetIds: readonly EntityId[];
}

/** Legacy workspace action history entry. */
export interface ActionHistoryEntry {
  readonly actionId: string;
  readonly createdAt: string;
  readonly id: string;
  readonly recovery?: ActionRecoverySnapshot;
  readonly reversible: boolean;
  readonly targetIds: readonly EntityId[];
}

/** Legacy workspace action UI state. */
export interface ActionState {
  readonly error: Error | null;
  readonly folderPicker: {
    readonly open: boolean;
    readonly query: string;
    readonly targetIds: readonly EntityId[];
  };
  readonly history: readonly ActionHistoryEntry[];
  readonly menu: {
    readonly open: boolean;
    readonly targetIds: readonly EntityId[];
    readonly x: number;
    readonly y: number;
  };
  readonly rename: {
    readonly conversationId: EntityId | null;
    readonly open: boolean;
  };
  readonly selectedConversationIds: readonly EntityId[];
  readonly status: 'error' | 'idle' | 'running';
}

/** User-goal action category. */
export type ActionCategory =
  | 'browser'
  | 'coding'
  | 'email'
  | 'learning'
  | 'meetings'
  | 'productivity'
  | 'research'
  | 'writing';

/** Action artifact type. */
export type ActionArtifactType = 'Checklist' | 'Markdown' | 'Notes' | 'Table';

/** Supported context requirements for an action. */
export interface ActionSupportedContext {
  readonly hostIncludes?: readonly string[];
  readonly pageKinds?: readonly PageKind[];
  readonly requiresEditableTarget?: boolean;
  readonly requiresSelection?: boolean;
}

/** Execution plan step shown by task workspaces and future executors. */
export interface ActionExecutionStep {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

/** Durable artifact declared by an action. */
export interface ActionArtifactDefinition {
  readonly format: ActionArtifactType;
  readonly title: string;
}

/** Follow-up action reference. */
export interface ActionFollowUp {
  readonly actionId: string;
  readonly title: string;
}

/** User-goal action definition. */
export interface ProductAction {
  readonly aliases: readonly string[];
  readonly artifactsProduced: readonly ActionArtifactDefinition[];
  readonly category: ActionCategory;
  readonly description: string;
  readonly estimatedDurationSec: number;
  readonly executionPlan: readonly ActionExecutionStep[];
  readonly icon: string;
  readonly id: string;
  readonly popularity: number;
  readonly requiredAiTools: readonly string[];
  readonly requiredPermissions: readonly string[];
  readonly shortcut?: string;
  readonly suggestedFollowUps: readonly ActionFollowUp[];
  readonly supportedContexts: readonly ActionSupportedContext[];
  readonly tags: readonly string[];
  readonly title: string;
}

/** Action scored for a specific context. */
export interface ResolvedAction {
  readonly action: ProductAction;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Action resolver input. */
export interface ActionContextInput {
  readonly context: PageContextSnapshot | null;
}
