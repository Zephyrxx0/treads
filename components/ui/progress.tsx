'use client';

import * as React from 'react';
import { Progress as BaseProgress } from '@base-ui-components/react';
import { cn } from '@/lib/utils';

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof BaseProgress.Root> {
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    return (
      <BaseProgress.Root
        ref={ref}
        value={value ?? 0}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-muted',
          className
        )}
        {...props}
      >
        <BaseProgress.Track className="h-full w-full">
          <BaseProgress.Indicator
            className={cn(
              'h-full bg-primary transition-all duration-300 ease-out',
              indicatorClassName
            )}
            style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
          />
        </BaseProgress.Track>
      </BaseProgress.Root>
    );
  }
);
Progress.displayName = 'Progress';
