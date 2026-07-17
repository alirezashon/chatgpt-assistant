import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';

import { WorkspaceIcon } from '@/content/components/WorkspaceIcon';
import type { UiPosition } from '@/app/synchronization';

interface FloatingButtonProps {
  readonly position: UiPosition | null;
  isOpen: boolean;
  onClick: () => void;
  readonly onMove: (position: UiPosition) => void;
}

const DEFAULT_BUTTON_OFFSET = 24;
const FLOATING_BUTTON_SIZE = 64;
const DRAG_THRESHOLD = 5;

interface DragState {
  readonly originX: number;
  readonly originY: number;
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
}

export function FloatingButton({ isOpen, onClick, onMove, position }: FloatingButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const [livePosition, setLivePosition] = useState<UiPosition | null>(null);
  const currentPosition = livePosition ?? position;
  const buttonStyle: CSSProperties =
    currentPosition === null
      ? {
          bottom: DEFAULT_BUTTON_OFFSET,
          right: DEFAULT_BUTTON_OFFSET,
        }
      : {
          left: currentPosition.x,
          top: currentPosition.y,
        };

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (event.button !== 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const startPosition = currentPosition ?? {
      x: rect.left,
      y: rect.top,
    };

    dragStateRef.current = {
      originX: event.clientX,
      originY: event.clientY,
      pointerId: event.pointerId,
      startX: startPosition.x,
      startY: startPosition.y,
    };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>): void {
    const dragState = dragStateRef.current;

    if (dragState?.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.originX;
    const deltaY = event.clientY - dragState.originY;

    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      didDragRef.current = true;
    }

    if (!didDragRef.current) {
      return;
    }

    setLivePosition(
      clampFloatingPosition({
        x: dragState.startX + deltaX,
        y: dragState.startY + deltaY,
      }),
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>): void {
    const dragState = dragStateRef.current;

    if (dragState?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;

    if (buttonRef.current?.hasPointerCapture(event.pointerId) === true) {
      buttonRef.current.releasePointerCapture(event.pointerId);
    }

    if (didDragRef.current) {
      const deltaX = event.clientX - dragState.originX;
      const deltaY = event.clientY - dragState.originY;
      const nextPosition = clampFloatingPosition({
        x: dragState.startX + deltaX,
        y: dragState.startY + deltaY,
      });

      setLivePosition(nextPosition);
      onMove(nextPosition);
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    }
  }

  return (
    <button
      ref={buttonRef}
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Close ChatGPT Workspace' : 'Open ChatGPT Workspace'}
      className={[
        'group fixed z-[2147483647] flex h-16 w-16 touch-none select-none items-center justify-center rounded-full border border-white/70 bg-[linear-gradient(135deg,#111827_0%,#0f766e_52%,#f59e0b_100%)] text-white shadow-2xl shadow-slate-950/30 ring-1 ring-black/10 transition duration-[var(--cgw-animation-fast)] ease-out focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:outline-none',
        isOpen ? 'scale-95' : 'hover:-translate-y-1 hover:scale-105 active:scale-100',
      ].join(' ')}
      style={buttonStyle}
      type="button"
      title="Drag me anywhere. Click to open Workspace."
      onClick={() => {
        if (!didDragRef.current) {
          onClick();
        }
      }}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <span className="absolute inset-1 rounded-full border border-white/25" />
      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-300 shadow-sm" />
      <WorkspaceIcon />
      <span className="pointer-events-none absolute right-[4.75rem] bottom-2 hidden min-w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-800 shadow-lg group-hover:block">
        Drag or click
      </span>
    </button>
  );
}

function clampFloatingPosition(position: UiPosition): UiPosition {
  const maxX = Math.max(
    DEFAULT_BUTTON_OFFSET,
    window.innerWidth - FLOATING_BUTTON_SIZE - DEFAULT_BUTTON_OFFSET,
  );
  const maxY = Math.max(
    DEFAULT_BUTTON_OFFSET,
    window.innerHeight - FLOATING_BUTTON_SIZE - DEFAULT_BUTTON_OFFSET,
  );

  return {
    x: Math.min(maxX, Math.max(DEFAULT_BUTTON_OFFSET, Math.round(position.x))),
    y: Math.min(maxY, Math.max(DEFAULT_BUTTON_OFFSET, Math.round(position.y))),
  };
}
