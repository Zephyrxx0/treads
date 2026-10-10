import * as React from 'react';
import { cn } from '@/lib/utils';
import { PageAmbience } from '@/components/nature/page-ambience';
import { SignatureFooter } from '@/components/landing/signature-footer';

interface PageShellProps {
  /** Small mono label above the title */
  eyebrow: string;
  title: React.ReactNode;
  /** Quiet figure on the right of the title, e.g. a count */
  aside?: React.ReactNode;
  /** Page width: 'wide' fills large screens, 'narrow' suits reading */
  width?: 'wide' | 'narrow';
  /** End the page with the full-width "Zephyrxx0" signature footer */
  signature?: boolean;
  children: React.ReactNode;
}

/**
 * The room every page sits in: paper, a mono eyebrow, a serif title, and room
 * for the floating nav (top on desktop, bottom on phones).
 */
export function PageShell({ eyebrow, title, aside, width = 'wide', signature = false, children }: PageShellProps) {
  return (
    <div className="paper-grain relative flex min-h-dvh flex-col bg-background text-foreground">
      <PageAmbience pageWidth={width === 'wide' ? 1280 : 768} />
      <div
        className={cn(
          'relative z-10 mx-auto w-full flex-1 px-5 pt-12 sm:px-8 sm:pt-28',
          signature ? 'pb-14 sm:pb-20' : 'pb-28 sm:pb-16',
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
      {/* Paints over the fixed side vines, which is where they end. The extra bottom room
          on phones keeps the floating nav off the lettering. */}
      {signature && <SignatureFooter className="max-sm:pb-24" />}
    </div>
  );
}
