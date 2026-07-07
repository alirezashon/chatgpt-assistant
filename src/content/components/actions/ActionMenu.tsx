import { useEffect, useRef } from 'react';

import { ActionIcon } from '@/content/components/actions/ActionIcon';
import type { ActionDefinition } from '@/features/actions';

interface ActionMenuProps {
  readonly actions: readonly ActionDefinition[];
  readonly open: boolean;
  readonly targetIds: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly onClose: () => void;
  readonly onExecute: (actionId: string, targetIds: readonly string[]) => void;
}

export function ActionMenu({
  actions,
  onClose,
  onExecute,
  open,
  targetIds,
  x,
  y,
}: ActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const focusEnabledItem = (direction: 1 | -1) => {
      const buttons = buttonRefs.current.filter((button): button is HTMLButtonElement =>
        Boolean(button && !button.disabled),
      );

      if (buttons.length === 0) {
        return;
      }

      const currentIndex = buttons.findIndex((button) => button === document.activeElement);
      const nextIndex =
        currentIndex < 0 ? 0 : (currentIndex + direction + buttons.length) % buttons.length;

      buttons[nextIndex]?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node) === true) {
        return;
      }

      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusEnabledItem(1);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusEnabledItem(-1);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => focusEnabledItem(1), 0);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      aria-label="Conversation actions"
      className="cgw-menu-in fixed z-[2147483647] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-2xl shadow-slate-950/15"
      role="menu"
      style={{
        left: x,
        top: y,
      }}
    >
      {actions.map((action, index) => (
        <ActionMenuItem
          key={action.id}
          refCallback={(button) => {
            buttonRefs.current[index] = button;
          }}
          action={action}
          targetIds={targetIds}
          onExecute={onExecute}
        />
      ))}
    </div>
  );
}

interface ActionMenuItemProps {
  readonly action: ActionDefinition;
  readonly refCallback: (button: HTMLButtonElement | null) => void;
  readonly targetIds: readonly string[];
  readonly onExecute: (actionId: string, targetIds: readonly string[]) => void;
}

function ActionMenuItem({ action, onExecute, refCallback, targetIds }: ActionMenuItemProps) {
  return (
    <>
      {action.separatorBefore === true ? <div className="my-1 border-t border-slate-100" /> : null}
      <button
        ref={refCallback}
        className={[
          'flex w-full items-center gap-2 px-3 py-2 text-left transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
          action.danger === true
            ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50'
            : 'text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50',
        ].join(' ')}
        disabled={action.disabled}
        role="menuitem"
        type="button"
        onClick={() => {
          onExecute(action.id, targetIds);
        }}
      >
        <ActionIcon icon={action.icon} />
        <span className="min-w-0 flex-1 truncate">{action.label}</span>
        {action.shortcut === undefined ? null : (
          <span className="text-[10px] font-medium text-slate-400">{action.shortcut}</span>
        )}
      </button>
    </>
  );
}
