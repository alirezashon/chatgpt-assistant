import type { ReactNode } from 'react';

interface ScrollableAreaProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function ScrollableArea({ children, className = '' }: ScrollableAreaProps) {
  return (
    <div className={['min-h-0 overflow-y-auto overscroll-contain', className].join(' ')}>
      {children}
    </div>
  );
}
