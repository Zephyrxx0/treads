import * as React from 'react';
import { cn } from '@/lib/utils';
import { PageAmbience } from '@/components/nature/page-ambience';

interface PageShellProps {
  /** Small mono label above the title */
  eyebrow: string;
  title: React.ReactNode;
  /** Quiet figure on the right of the title, e.g. a count */
  aside?: React.ReactNode;
  /** Page width: 'wide' fills large screens, 'narrow' suits reading */
  width?: 'wide' | 'narrow';
  children: React.ReactNode;
}

/**
 * The room every page sits in: paper, a mono eyebrow, a serif title, and room
 * for the floating nav (top on desktop, bottom on phones).
 */
export function PageShell({ eyebrow, title, aside, width = 'wide', children }: PageShellProps) {
  return (
    <div className="paper-grain relative min-h-dvh bg-background text-foreground">
      <PageAmbience pageWidth={width === 'wide' ? 1280 : 768} />
      <div
        className={cn(
          'relative z-10 mx-auto w-full px-5 pb-28 pt-12 sm:px-8 sm:pb-16 sm:pt-28',
          width === 'wide' ? 'max-w-7xl' : 'max-w-3xl'
        )}
      >
        <header className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl font-light leading-none tracking-tight sm:text-5xl">{title}</h1>
          </div>
          {aside && <div className="pb-1 text-right font-mono text-[11px] tracking-wide text-muted-foreground">{aside}</div>}
        </header>
        {children}
      </div>
    </div>
  );
}
