import type { LucideIcon } from 'lucide-react';

import type {
  ActionArtifactDefinition,
  ActionExecutionStep,
  ActionFollowUp,
} from '@/features/actions';
import type { CommandId } from '@/features/commands';
import type { PageKind } from '@/features/context';

/** Product status shown in Home header. */
export type HomeStatus = 'offline' | 'ready' | 'working';

/** Popup action model. */
export interface HomeAction {
  readonly artifactsProduced?: readonly ActionArtifactDefinition[];
  readonly badge?: string;
  readonly commandId?: CommandId;
  readonly description: string;
  readonly estimatedDurationSec?: number;
  readonly executionPlan?: readonly ActionExecutionStep[];
  readonly suggestedFollowUps?: readonly ActionFollowUp[];
  readonly icon: LucideIcon;
  readonly id: string;
  readonly requiredAiTools?: readonly string[];
  readonly title: string;
}

/** Detected page context model for Home. */
export interface HomePageContext {
  readonly confidence: number;
  readonly hostname: string;
  readonly label: string;
  readonly pageKind: PageKind;
  readonly title: string;
}

/** Recent activity item shown in Home. */
export interface HomeActivity {
  readonly action: HomeAction;
  readonly completedAt: string;
  readonly id: string;
  readonly label: string;
}

/** Home data loaded from local extension history sources. */
export interface HomeActivityState {
  readonly recent: readonly HomeActivity[];
  readonly smartSuggestions: readonly HomeActivity[];
}
