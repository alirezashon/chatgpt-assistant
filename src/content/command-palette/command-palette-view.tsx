import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Code2,
  Compass,
  FileText,
  Loader2,
  Search,
  Settings,
  Sparkles,
  Workflow,
} from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';

import type {
  CommandPaletteControllerPort,
  CommandPaletteState,
  PaletteCommand,
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
                autoFocus
                aria-autocomplete="list"
                aria-controls="command-palette-results"
                placeholder="Search commands..."
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
              ) : state.results.length === 0 ? (
                <div className="empty">No commands found</div>
              ) : (
                state.results
                  .slice(0, 12)
                  .map((result, index) => (
                    <CommandRow
                      active={index === state.activeIndex}
                      command={result.command}
                      key={result.command.id}
                      score={result.score}
                    />
                  ))
              )}
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
  score,
}: {
  readonly active: boolean;
  readonly command: PaletteCommand;
  readonly score: number;
}) {
  return (
    <div
      aria-selected={active}
      className={active ? 'row active' : 'row'}
      id={`command-${command.id}`}
      role="option"
    >
      <span className="icon">
        <CommandIcon category={command.category} icon={command.icon} />
      </span>
      <span className="copy">
        <span className="title">{command.title}</span>
        <span className="description">{command.description}</span>
      </span>
      <span className="meta">
        {command.badge !== undefined ? <span className="badge">{command.badge}</span> : null}
        <span className="confidence">{Math.round(score * 100).toString()}</span>
        {command.shortcut !== undefined ? <kbd>{command.shortcut}</kbd> : null}
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
    case 'code':
      return <Code2 aria-hidden="true" size={18} />;
    case 'document':
      return <FileText aria-hidden="true" size={18} />;
    case 'settings':
      return <Settings aria-hidden="true" size={18} />;
    case 'workflow':
      return <Workflow aria-hidden="true" size={18} />;
    case 'browser':
      return <Compass aria-hidden="true" size={18} />;
    case 'ai':
      return <Bot aria-hidden="true" size={18} />;
    default:
      return category === 'workflow' ? (
        <Workflow aria-hidden="true" size={18} />
      ) : (
        <Sparkles aria-hidden="true" size={18} />
      );
  }
}
