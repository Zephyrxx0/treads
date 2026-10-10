'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AmbientWalk } from '@/components/landing/ambient-walk';
import { Meadow } from '@/components/landing/meadow';
import { SignatureFooter } from '@/components/landing/signature-footer';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    // The page is its own scroller: the hero fills the first screen exactly as before,
    // and the signature footer waits just below the meadow.
    <main className="paper-grain fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-background text-center text-foreground">
      <section className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden px-6 select-none">
        <AmbientWalk />
        <Meadow />

        {/* Hero content and celestial icon: grouped together so the celestial body is perfectly
            centered behind the headline and CTA at all aspect ratios and screen sizes. */}
        <div className="relative flex flex-col items-center justify-center">
          {/* The sun/moon is drawn in lines in the sky behind the headline.
              Anchored to the center of the hero so the size ratio and framing with the text
              remain identical on mobile portrait, vertical tablets, and desktop. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-[52%] [--sun:clamp(1000px,68vw,1200px)]">
            <ThemeToggle
              variant="bare"
              className="relative h-[calc(var(--sun)*0.5375)] w-[calc(var(--sun)*0.695)]"
            />
          </div>

          <div className="pointer-events-none relative z-10 flex flex-col items-center">
            <p
              className="reveal font-mono text-[11px] uppercase tracking-[0.34em] text-muted-foreground"
              style={{ ['--i' as string]: 0 }}
            >
              Treads
            </p>

            <h1
              className="reveal mt-8 font-serif text-[clamp(2.75rem,8vw,7.5rem)] font-light leading-[0.98] tracking-tight"
              style={{ ['--i' as string]: 1 }}
            >
              Step outside.
              <br />
              <em className="font-normal text-primary">Notice what lives.</em>
            </h1>

            <Link
              href="/walk"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'reveal group pointer-events-auto mt-12 h-12 rounded-full px-8 text-base shadow-md',
              )}
              style={{ ['--i' as string]: 3 }}
            >
              Begin a walk
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <nav
          aria-label="Secondary"
          className="reveal absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          style={{ ['--i' as string]: 5 }}
        >
          <Link href="/collection" className="transition-colors hover:text-foreground">
            Life list
          </Link>
          <Link href="/journal" className="transition-colors hover:text-foreground">
            Journal
          </Link>
          <Link href="/settings" className="transition-colors hover:text-foreground">
            Settings
          </Link>
        </nav>
      </section>

      <SignatureFooter />
    </main>
  );
}
