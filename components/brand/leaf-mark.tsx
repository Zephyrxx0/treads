import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The Treads mark: one small leaf, filled with the primary green and veined in
 * the paper colour. The same drawing is app/icon.svg.
 */
export function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} fill="none" aria-hidden="true">
      <path
        d="M12 2C20 5.6 21 15 12 21.6 3 15 4 5.6 12 2Z"
        className="fill-primary"
      />
      <path
        d="M12 21.4V8.6M12 16.2 8.8 12.8M12 13.2l3.2-3.4M12 10 9.8 7.8"
        className="stroke-primary-foreground"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 21.4 12 23.4" className="stroke-primary" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
