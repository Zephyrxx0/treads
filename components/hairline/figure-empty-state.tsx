import * as React from 'react';
import { HairlineFigure, type HairlineFigureProps } from '@/components/hairline/hairline-figure';
import { cn } from '@/lib/utils';

interface FigureEmptyStateProps {
  figure?: Pick<HairlineFigureProps, 'name' | 'label'>;
  /** Any other drawing, used instead of a Hairline figure */
  visual?: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  /** Figure beside the words on wide screens, instead of above them */
  split?: boolean;
  className?: string;
}

/**
 * An empty state drawn as an absence: a Hairline object holding nothing, with
 * a heading, a sentence and one action beside or beneath it.
 */
export function FigureEmptyState({ figure, visual, title, description, children, split = false, className }: FigureEmptyStateProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-7',
        split ? 'grid items-center gap-2 md:grid-cols-[1.1fr_1fr] md:gap-6' : 'flex flex-col items-center text-center',
        className
      )}
    >
      {visual ? (
        <div className={cn('w-full', split ? 'md:order-first' : 'max-w-[22rem]')}>{visual}</div>
      ) : (
        figure && (
          <HairlineFigure
            name={figure.name}
            label={figure.label}
            className={cn('-my-3 w-full', split ? 'md:order-first' : 'max-w-[22rem]')}
          />
        )
      )}
      <div className={cn(split ? 'text-center md:text-left' : 'text-center')}>
        <h2 className="font-serif text-3xl font-light leading-tight tracking-tight">{title}</h2>
        <p className={cn('mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground', !split && 'mx-auto')}>{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
