import type { PageContextSnapshot } from '@/features/context';

export type CommandId =
  | 'input.rewrite'
  | 'page.summarize'
  | 'runtime.openPalette'
  | 'runtime.openSidebar'
  | 'selection.explain'
  | 'selection.rewrite';

export type CommandOutputMode = 'inline' | 'replace-selection' | 'sidebar' | 'toast';

export interface CommandAvailability {
  readonly pageKinds?: readonly PageContextSnapshot['pageKind'][];
  readonly requiresEditableTarget?: boolean;
  readonly requiresSelection?: boolean;
}

export interface CommandDefinition {
  readonly availability: CommandAvailability;
  readonly description: string;
  readonly id: CommandId;
  readonly outputMode: CommandOutputMode;
  readonly title: string;
}

export interface CommandInvocation {
  readonly commandId: CommandId;
  readonly context: PageContextSnapshot;
  readonly input?: string;
}

export interface CommandResult {
  readonly commandId: CommandId;
  readonly completedAt: string;
  readonly output: string;
  readonly outputMode: CommandOutputMode;
}
