import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Bookmark,
  Bug,
  Code2,
  Compass,
  FileText,
  GitPullRequest,
  Languages,
  ListChecks,
  Loader2,
  Mail,
  MemoryStick,
  Pencil,
  PlayCircle,
  Search,
  Settings,
  Sparkles,
  Star,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent } from 'react';

import type {
  CommandPaletteControllerPort,
  CommandPaletteState,
  PaletteCommand,
  PaletteCommandResult,
} from './command-palette-types';

/** Props for command palette view. */
export interface CommandPaletteViewProps {
  /** Headless controller port. */
  readonly controller: CommandPaletteControllerPort;
  /** Current state snapshot. */
  readonly state: CommandPaletteState;
}

/** Presentation-only command palette view. */
export function CommandPaletteView({ controller, state }: CommandPaletteViewProps) {
  const open = state.status !== 'Closed' && state.status !== 'Closing';
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sections = useMemo(() => buildSections(state), [state]);
  const activeCommandId = state.results[state.activeIndex]?.command.id;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="overlay"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="presentation"
          transition={{ duration: 0.1 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-expanded="true"
            aria-label="Command palette"
            aria-owns="command-palette-results"
            className="palette"
            exit={{ opacity: 0, scale: 0.985, y: -4 }}
            initial={{ opacity: 0, scale: 0.985, y: 4 }}
            role="combobox"
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={(event) => {
              handleKeyDown(event, controller);
            }}
          >
            <div className="searchRow">
              <Search aria-hidden="true" size={18} />
              <input
                ref={inputRef}
                autoFocus
                aria-autocomplete="list"
                aria-controls="command-palette-results"
                placeholder="Search actions, workflows, memory..."
                spellCheck={false}
                value={state.query}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  controller.setQuery(event.currentTarget.value);
                }}
              />
              {state.status === 'Loading' || state.status === 'Executing' ? (
                <Loader2 className="spin" size={16} />
              ) : null}
            </div>

            <div className="results" id="command-palette-results" role="listbox">
              {state.status === 'Error' ? (
                <div className="empty" role="status">
                  {state.error ?? 'Command failed.'}
                </div>
              ) : sections.length === 0 ? (
                <div className="empty">No commands found</div>
              ) : (
                sections.map((section) => (
                  <section className="section" key={section.title}>
                    <div className="sectionHeader">
                      <span>{section.title}</span>
                      {section.detail === undefined ? null : <span>{section.detail}</span>}
                    </div>
                    <div className="sectionRows">
                      {section.results.map((result) => (
                        <CommandRow
                          active={result.command.id === activeCommandId}
                          command={result.command}
                          favorite={state.favoriteCommandIds.includes(result.command.id)}
                          key={`${section.title}-${result.command.id}`}
                          recent={state.recentCommandIds.includes(result.command.id)}
                          score={result.score}
                          onExecute={() => {
                            controller.execute(result.command.id);
                          }}
                          onToggleFavorite={() => {
                            controller.toggleFavorite(result.command.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
            <div className="footerHints">
              <span>Arrows Navigate</span>
              <span>Enter Run</span>
              <span>Tab Next</span>
              <span>Esc Close</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CommandRow({
  active,
  command,
  favorite,
  recent,
  score,
  onExecute,
  onToggleFavorite,
}: {
  readonly active: boolean;
  readonly command: PaletteCommand;
  readonly favorite: boolean;
  readonly recent: boolean;
  readonly score: number;
  readonly onExecute: () => void;
  readonly onToggleFavorite: () => void;
}) {
  return (
    <div
      aria-selected={active}
      className={active ? 'row active' : 'row'}
      id={`command-${command.id}`}
      role="option"
      onClick={onExecute}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
    >
      <span className="icon">
        <CommandIcon category={command.category} icon={command.icon} />
      </span>
      <span className="copy">
        <span className="title">{command.title}</span>
        <span className="description">{command.description}</span>
      </span>
      <span className="meta">
        {recent ? <span className="badge">Recent</span> : null}
        {command.badge !== undefined ? <span className="badge">{command.badge}</span> : null}
        <span className="confidence">{Math.round(score * 100).toString()}</span>
        {command.shortcut !== undefined ? <kbd>{formatShortcut(command.shortcut)}</kbd> : null}
        <button
          aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
          className={favorite ? 'favorite activeFavorite' : 'favorite'}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          <Star aria-hidden="true" size={13} />
        </button>
      </span>
    </div>
  );
}

function handleKeyDown(event: KeyboardEvent, controller: CommandPaletteControllerPort): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    controller.close();
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    controller.moveActive(1);
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    controller.moveActive(-1);
    return;
  }

  if (event.key === 'Tab') {
    event.preventDefault();
    controller.moveActive(event.shiftKey ? -1 : 1);
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    controller.confirm();
  }
}

function CommandIcon({
  category,
  icon,
}: {
  readonly category: PaletteCommand['category'];
  readonly icon: string;
}) {
  switch (icon) {
    case 'bug':
      return <Bug aria-hidden="true" size={18} />;
    case 'code':
      return <Code2 aria-hidden="true" size={18} />;
    case 'document':
      return <FileText aria-hidden="true" size={18} />;
    case 'git':
      return <GitPullRequest aria-hidden="true" size={18} />;
    case 'list':
      return <ListChecks aria-hidden="true" size={18} />;
    case 'mail':
      return <Mail aria-hidden="true" size={18} />;
    case 'memory':
      return <MemoryStick aria-hidden="true" size={18} />;
    case 'search':
      return <Search aria-hidden="true" size={18} />;
    case 'settings':
      return <Settings aria-hidden="true" size={18} />;
    case 'translate':
      return <Languages aria-hidden="true" size={18} />;
    case 'video':
      return <PlayCircle aria-hidden="true" size={18} />;
    case 'workflow':
      return <Workflow aria-hidden="true" size={18} />;
    case 'browser':
      return <Compass aria-hidden="true" size={18} />;
    case 'ai':
      return <Bot aria-hidden="true" size={18} />;
    case 'write':
      return <Pencil aria-hidden="true" size={18} />;
    case 'bookmark':
      return <Bookmark aria-hidden="true" size={18} />;
    default:
      return category === 'workflow' ? (
        <Workflow aria-hidden="true" size={18} />
      ) : (
        <Sparkles aria-hidden="true" size={18} />
      );
  }
}

interface CommandSection {
  readonly detail?: string;
  readonly results: readonly PaletteCommandResult[];
  readonly title: string;
}

function buildSections(state: CommandPaletteState): readonly CommandSection[] {
  const topResults = state.results.slice(0, 16);

  if (state.query.trim().length > 0) {
    return [
      commandSection({
        detail: `${topResults.length.toString()} matches`,
        results: topResults,
        title: 'Suggested Actions',
      }),
      commandSection({
        detail: contextDetail(state),
        results: topResults.filter((result) => result.reasons.includes('context')).slice(0, 4),
        title: 'Detected Context',
      }),
      commandSection({
        results: topResults.filter((result) => result.command.shortcut !== undefined).slice(0, 4),
        title: 'Keyboard Shortcuts',
      }),
    ].filter((section) => section.results.length > 0);
  }

  const used = new Set<string>();
  const recent = takeUnique(
    topResults.filter((result) => state.recentCommandIds.includes(result.command.id)),
    used,
    4,
  );
  const context = takeUnique(
    topResults.filter((result) => result.reasons.includes('context')),
    used,
    5,
  );
  const shortcuts = takeUnique(
    topResults.filter((result) => result.command.shortcut !== undefined),
    used,
    4,
  );
  const suggested = takeUnique(topResults, used, 6);

  return [
    commandSection({
      detail: 'Best next actions',
      results: suggested,
        title: 'Suggested Actions',
    }),
    commandSection({
      detail: recent.length === 0 ? 'Used commands appear here' : undefined,
      results: recent,
      title: 'Recent Actions',
    }),
    commandSection({
      detail: contextDetail(state),
      results: context,
      title: 'Detected Context',
    }),
    commandSection({
      results: shortcuts,
      title: 'Keyboard Shortcuts',
    }),
  ].filter((section) => section.results.length > 0);
}

function commandSection(input: {
  readonly detail?: string | undefined;
  readonly results: readonly PaletteCommandResult[];
  readonly title: string;
}): CommandSection {
  return input.detail === undefined
    ? {
        results: input.results,
        title: input.title,
      }
    : {
        detail: input.detail,
        results: input.results,
        title: input.title,
      };
}

function takeUnique(
  results: readonly PaletteCommandResult[],
  used: Set<string>,
  limit: number,
): readonly PaletteCommandResult[] {
  const selected: PaletteCommandResult[] = [];

  for (const result of results) {
    if (used.has(result.command.id)) {
      continue;
    }

    selected.push(result);
    used.add(result.command.id);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function contextDetail(state: CommandPaletteState): string | undefined {
  if (state.context === null) {
    return undefined;
  }

  return `${state.context.pageKind} - ${state.context.hostname}`;
}

function formatShortcut(shortcut: string): string {
  const isMac = navigator.platform.toLowerCase().includes('mac');

  return shortcut.replaceAll('Mod', isMac ? 'Cmd' : 'Ctrl');
}
