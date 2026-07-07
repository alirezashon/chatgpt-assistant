import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
  readonly children: ReactNode;
  readonly title: string;
  readonly onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ children, onClose, title }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    previousActiveElementRef.current = document.activeElement;
    focusFirstElement(panelRef.current);

    return () => {
      if (previousActiveElementRef.current instanceof HTMLElement) {
        previousActiveElementRef.current.focus();
      }
    };
  }, []);

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="cgw-fade-in fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/20 px-5 backdrop-blur-[2px]"
      role="dialog"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
          return;
        }

        if (event.key === 'Tab') {
          trapFocus(event, panelRef.current);
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="cgw-scale-in w-full max-w-sm rounded-xl border border-white/60 bg-white/95 p-5 text-slate-950 shadow-2xl shadow-slate-950/20 backdrop-blur"
      >
        <h3 id={titleId} className="mb-5 text-base font-semibold tracking-normal">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function focusFirstElement(container: HTMLElement | null): void {
  const focusableElements = getFocusableElements(container);
  focusableElements[0]?.focus();
}

function getFocusableElements(container: HTMLElement | null): readonly HTMLElement[] {
  if (container === null) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hidden,
  );
}

function trapFocus(event: React.KeyboardEvent, container: HTMLElement | null): void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (firstElement === undefined || lastElement === undefined) {
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
