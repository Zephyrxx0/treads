'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Footprints,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { TegakiText } from '@/components/motion/tegaki-text';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [scrolled, setScrolled] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState('');
  const [scrollY, setScrollY] = React.useState(0);

  // Dynamic live clock for location atmosphere (per reference)
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll listener for subtle header elevation and gentle parallax
  React.useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setScrolled(y > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 selection:bg-primary/20 selection:text-foreground relative overflow-x-hidden">
      {/* Noise Texture Overlay for tactical analog field-journal depth */}
      <div
        className="fixed inset-0 z-40 pointer-events-none opacity-4 dark:opacity-6 mix-blend-overlay"
        style={{
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      />

      {/* Floating Header Navigation (Translates and blurs cleanly on scroll) */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'py-3.5 bg-background/85 backdrop-blur-md border-b border-border shadow-xs'
            : 'py-6 bg-transparent'
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <Footprints className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-foreground leading-none">
                Treads.
              </span>
              <span className="font-handwriting text-[11px] text-primary leading-tight mt-0.5">
                The nature agent
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/collection"
              className="hidden sm:inline-block text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Life List
            </Link>
            <Link
              href="/journal"
              className="hidden sm:inline-block text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Journal
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Link>
            <ThemeToggle />
            <Link
              href="/walk"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'rounded-full px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs hover:scale-105 active:scale-95 transition-all duration-200'
              )}
            >
              Start Walk
            </Link>
          </div>
        </div>
      </nav>

      {/* Atmospheric Kinetic Hero Section */}
      <section className="relative min-h-[92dvh] flex items-center justify-center overflow-hidden pt-28 pb-16">
        {/* Background Radial Atmosphere */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-primary/10 dark:bg-primary/15 rounded-full blur-[120px] opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background z-10" />
        </div>

        {/* Floating Surrealist Elements (Adapted for Nature / Touch Grass theme) */}
        <div className="absolute -left-[8%] top-[-5%] md:left-[-2%] md:top-[-8%] w-[45vw] md:w-[32vw] max-w-[600px] z-10 pointer-events-none opacity-40 dark:opacity-50 animate-float-left">
          <img
            src="https://framerusercontent.com/images/KNhiA5A2ykNYqNkj04Hk6BVg5A.png?width=1540&height=1320"
            alt="Reaching hand"
            className="w-full h-auto object-contain filter drop-shadow-2xl"
          />
        </div>

        <div className="absolute -right-[8%] bottom-[-5%] md:right-[-2%] md:bottom-[-8%] w-[42vw] md:w-[30vw] max-w-[550px] z-10 pointer-events-none opacity-35 dark:opacity-45 animate-float-right">
          <img
            src="https://framerusercontent.com/images/X89VFCABCEjjZ4oLGa3PjbOmsA.png?width=1542&height=1002"
            alt="Receiving hand"
            className="w-full h-auto object-contain filter drop-shadow-2xl"
          />
        </div>

        {/* Hero Content (Centered, Minimal, High Typography Focus with scroll transform) */}
        <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center justify-center">
          <div
            className="max-w-3xl mx-auto transition-transform duration-100 ease-out"
            style={{
              transform: `translateY(${Math.min(scrollY * 0.18, 90)}px)`,
              opacity: Math.max(0, 1 - scrollY / 550),
            }}
          >
            {/* Subtle Eyebrow / State indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-xs text-xs text-muted-foreground font-mono mb-8 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>TOUCH GRASS &bull; GEMMA 4 VISION &bull; WIKIPEDIA GROUNDED</span>
            </div>

            {/* Display Typography */}
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-foreground leading-[1.05] mb-6">
              Treads. <br />
              <span className="italic font-light text-primary">
                The nature agent.
              </span>
            </h1>

            {/* Focused subtext */}
            <p className="font-sans text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 font-light tracking-wide leading-relaxed">
              Step outside and notice what lives. We turn fleeting trail observations into verified, permanent field journals.
            </p>

            {/* Bare Minimum Required CTA (Focused & Direct) */}
            <div className="flex flex-col items-center gap-5">
              <Link
                href="/walk"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'lg' }),
                  'group relative px-8 py-6 rounded-full text-base font-medium bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all duration-300'
                )}
              >
                <Compass className="h-5 w-5 mr-2 transition-transform group-hover:rotate-45" />
                <span>Begin Outdoor Walk</span>
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Minimalist Live Telemetry Atmosphere Bar */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono mt-4">
                <span>{currentTime || '11:11 AM'}</span>
                <span className="w-px h-3 bg-border" />
                <span>100% On-Device Journal</span>
                <span className="w-px h-3 bg-border" />
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Private Vault
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Essence Statement (Mission Section from reference) */}
      <section className="py-24 relative border-t border-border/60 bg-card/30">
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
            The phone is a lens, not a feed.
          </h2>
          <p className="font-sans text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-light">
            Elegance is refusal. Two taps to capture, immediate return to your stride, and zero feeds pulling you out of the moment.
          </p>

          <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              EXIF & GPS stripped on Canvas
            </span>
            <span>&bull;</span>
            <span>OpenFreeMap Tiles</span>
            <span>&bull;</span>
            <span>Obsidian Markdown Vault Export</span>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Footprints className="h-4 w-4 text-primary" />
            <span className="font-serif font-semibold text-foreground">Treads</span>
            <span className="text-xs text-muted-foreground">&copy; 2026 Field Walking & Specimen Journal</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Privacy Statement
            </Link>
            <Link href="/settings" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Settings & Vault
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
