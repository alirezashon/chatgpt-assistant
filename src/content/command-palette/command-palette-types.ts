import type { PageContextSnapshot } from '@/features/context';
import type { Disposable } from '@/runtime';

/** Command palette explicit state names. */
export type CommandPaletteStatus =
  | 'ArgumentsRequired'
  | 'Closed'
  | 'Closing'
  | 'CommandSelected'
  | 'Error'
  | 'Executing'
  | 'Loading'
  | 'Opening'
  | 'ResultsReady'
  | 'Searching'
  | 'Streaming'
  | 'Success';

/** Command category used for grouping and search. */
export type PaletteCommandCategory =
  | 'automation'
  | 'browser'
  | 'code'
  | 'communication'
  | 'research'
  | 'settings'
  | 'workflow'
  | 'writing';

/** Command permission state. */
export type PalettePermissionState = 'allowed' | 'denied' | 'prompt' | 'unknown';

/** Supported command argument types. */
export type PaletteArgumentType =
  'choice' | 'confirmation' | 'file' | 'multi-choice' | 'number' | 'selection' | 'text' | 'url';

/** Command argument schema. */
export interface PaletteCommandArgument {
  /** Stable argument id. */
  readonly id: string;
  /** User-facing label. */
  readonly label: string;
  /** Argument type. */
  readonly type: PaletteArgumentType;
  /** Whether argument is required. */
  readonly required: boolean;
  /** Choice options for choice-like arguments. */
  readonly options?: readonly string[];
}

/** Presentation-neutral command record. */
export interface PaletteCommand {
  /** Stable command id. */
  readonly id: string;
  /** Namespace such as core, github, plugin.vendor. */
  readonly namespace: string;
  /** User-facing title. */
  readonly title: string;
  /** Description. */
  readonly description: string;
  /** Semantic icon hint. */
  readonly icon: string;
  /** Category. */
  readonly category: PaletteCommandCategory;
  /** Aliases and abbreviations. */
  readonly aliases: readonly string[];
  /** Search keywords. */
  readonly keywords: readonly string[];
  /** Optional keyboard shortcut. */
  readonly shortcut?: string;
  /** Provider name such as Core, Plugin, AI. */
  readonly provider: string;
  /** Confidence from action intelligence or provider source. */
  readonly confidence: number;
  /** Badge text. */
  readonly badge?: string;
  /** Permission state. */
  readonly permission: PalettePermissionState;
  /** Optional warning. */
  readonly warning?: string;
  /** Expected latency in milliseconds. */
  readonly latencyMs: number;
  /** Optional argument schema. */
  readonly arguments?: readonly PaletteCommandArgument[];
  /** True for experimental commands. */
  readonly experimental?: boolean;
}

/** Command source provides dynamic commands to the palette. */
export interface CommandPaletteCommandSource {
  /** Returns available commands for a context snapshot. */
  getCommands(
    context: PageContextSnapshot | null,
  ): Promise<readonly PaletteCommand[]> | readonly PaletteCommand[];
}

/** Command execution bridge. */
export interface CommandPaletteExecutionBridge {
  /** Executes the selected command with resolved arguments. */
  execute(input: {
    readonly command: PaletteCommand;
    readonly arguments: Readonly<Record<string, unknown>>;
    readonly context: PageContextSnapshot | null;
  }): Promise<void> | void;
}

/** Search result with deterministic score explanation. */
export interface PaletteCommandResult {
  /** Command. */
  readonly command: PaletteCommand;
  /** Final score. */
  readonly score: number;
  /** Score explanation. */
  readonly reasons: readonly string[];
}

/** User history entry. */
export interface PaletteCommandHistoryEntry {
  /** Command id. */
  readonly commandId: string;
  /** Last execution timestamp. */
  readonly lastUsedAt: number;
  /** Execution count. */
  readonly count: number;
  /** Successful execution count. */
  readonly successes: number;
}

/** Palette state owned by controller/state machine. */
export interface CommandPaletteState {
  /** Explicit state. */
  readonly status: CommandPaletteStatus;
  /** Current search query. */
  readonly query: string;
  /** Loaded commands. */
  readonly commands: readonly PaletteCommand[];
  /** Ranked search results. */
  readonly results: readonly PaletteCommandResult[];
  /** Active result index. */
  readonly activeIndex: number;
  /** Selected command. */
  readonly selectedCommand: PaletteCommand | null;
  /** Resolved argument values. */
  readonly argumentValues: Readonly<Record<string, unknown>>;
  /** Context snapshot. */
  readonly context: PageContextSnapshot | null;
  /** Safe error message. */
  readonly error: string | null;
}

/** State listener. */
export type CommandPaletteStateListener = (state: CommandPaletteState) => void;

/** Renderer contract. */
export interface CommandPaletteRenderer extends Disposable {
  /** Mounts the renderer. */
  mount(controller: CommandPaletteControllerPort): void;
  /** Renders state. */
  render(state: CommandPaletteState): void;
}

/** Controller functions exposed to the renderer. */
export interface CommandPaletteControllerPort {
  /** Updates search query. */
  setQuery(query: string): void;
  /** Moves active result. */
  moveActive(delta: number): void;
  /** Selects active command or executes if ready. */
  confirm(): void;
  /** Closes palette. */
  close(): void;
  /** Sets an argument value. */
  setArgument(id: string, value: unknown): void;
}
