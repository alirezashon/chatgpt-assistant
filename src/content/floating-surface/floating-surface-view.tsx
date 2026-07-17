import { AnimatePresence, motion } from 'framer-motion';
import type { KeyboardEvent } from 'react';
import {
  Bug,
  Check,
  Code2,
  FileText,
  Languages,
  Loader2,
  Mail,
  Pencil,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/utils';

import type { FloatingSurfaceAccessibility } from './floating-surface-accessibility';
import { getActionElementId } from './floating-surface-accessibility';
import type { FloatingSurfaceAnimationManager } from './floating-surface-animation-manager';
import type {
  FloatingSurfaceAction,
  FloatingSurfaceControllerPort,
  FloatingSurfaceState,
} from './floating-surface-types';

const SURFACE_WIDTH = 420;

/** Props for the React floating surface view. */
export interface FloatingSurfaceViewProps {
  /** Accessibility helper. */
  readonly accessibility: FloatingSurfaceAccessibility;
  /** Controller port for user actions. */
  readonly controller: FloatingSurfaceControllerPort;
  /** Motion settings derived from preferences. */
  readonly motionState: ReturnType<FloatingSurfaceAnimationManager['getMotionState']>;
  /** Current state snapshot. */
  readonly state: FloatingSurfaceState;
}

/** Presentation-only React view for the floating surface. */
export function FloatingSurfaceView({
  accessibility,
  controller,
  motionState,
  state,
}: FloatingSurfaceViewProps) {
  if (
    state.position === null ||
    state.dismissed ||
    !['error', 'executing', 'streaming', 'success', 'visible'].includes(state.status) ||
    (state.actions.length === 0 && state.status !== 'error')
  ) {
    return <AnimatePresence />;
  }

  const position = state.position;

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-activedescendant={accessibility.getActiveDescendantId(state)}
        aria-label={accessibility.getLabel(state)}
        className="surface"
        exit={{ opacity: 0, scale: motionState.initialScale, y: -2 }}
        initial={{ opacity: 0, scale: motionState.initialScale, y: 2 }}
        role="menu"
        style={{
          transformOrigin: position.placement === 'top' ? 'bottom center' : 'top center',
          width: SURFACE_WIDTH,
          x: position.x,
          y: position.y,
        }}
        transition={{
          duration: motionState.enterDuration,
          ease: [0.16, 1, 0.3, 1],
        }}
        onKeyDown={(event) => {
          handleKeyDown(event, controller, state);
        }}
      >
        <div className="actionRow">
          {state.status === 'error' ? (
            <div className="errorText" role="status">
              {state.error ?? 'Action unavailable'}
            </div>
          ) : (
            state.actions.slice(0, 6).map((action, index) => (
              <ActionButton
                action={action}
                active={index === state.activeIndex}
                key={action.id}
                onExecute={() => {
                  controller.execute(action.id);
                }}
              />
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionButton({
  action,
  active,
  onExecute,
}: {
  readonly action: FloatingSurfaceAction;
  readonly active: boolean;
  readonly onExecute: () => void;
}) {
  return (
    <button
      aria-disabled={action.disabled === true}
      aria-label={getActionLabel(action)}
      className={cn('actionButton', active && 'active')}
      disabled={action.disabled === true || action.loading === true}
      id={getActionElementId(action.id)}
      role="menuitem"
      title={action.disabledReason ?? action.title}
      type="button"
      onClick={onExecute}
    >
      <span className="iconWrap">
        <ActionIcon action={action} />
      </span>
      <span className="label">{action.title}</span>
      {action.shortcut !== undefined ? <kbd>{action.shortcut}</kbd> : null}
    </button>
  );
}

function ActionIcon({ action }: { readonly action: FloatingSurfaceAction }) {
  if (action.loading === true) {
    return <Loader2 className="spin" size={15} />;
  }

  switch (action.icon) {
    case 'bug':
      return <Bug size={15} />;
    case 'check':
      return <Check size={15} />;
    case 'code':
      return <Code2 size={15} />;
    case 'document':
      return <FileText size={15} />;
    case 'email':
      return <Mail size={15} />;
    case 'translate':
      return <Languages size={15} />;
    case 'write':
      return <Pencil size={15} />;
    default:
      return <Sparkles size={15} />;
  }
}

function handleKeyDown(
  event: KeyboardEvent,
  controller: FloatingSurfaceControllerPort,
  state: FloatingSurfaceState,
): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    controller.dismiss();
    return;
  }

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    controller.moveActive(1);
    return;
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    controller.moveActive(-1);
    return;
  }

  if (event.key === 'Enter') {
    const action = state.actions[state.activeIndex];

    if (action !== undefined) {
      event.preventDefault();
      controller.execute(action.id);
    }
  }
}

function getActionLabel(action: FloatingSurfaceAction): string {
  const confidence = Math.round(action.confidence * 100);
  return `${action.title}, ${confidence.toString()} percent confidence`;
}
