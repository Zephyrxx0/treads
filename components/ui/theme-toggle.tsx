'use client';

import * as React from 'react';
import { Within } from '@theme-toggles/react';
import '@theme-toggles/react/styles/within.css';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  duration?: number;
}

export function ThemeToggle({ className, duration = 500, ...props }: ThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const checkDark = () => {
      const stored = localStorage.getItem('treads_theme');
      if (stored) {
        return stored === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    };
    setIsDark(checkDark());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'light' | 'dark' }>;
      if (customEvent.detail?.theme) {
        setIsDark(customEvent.detail.theme === 'dark');
      } else {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  const handleToggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('treads_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('treads_theme', 'light');
      } catch {}
    }

    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme: nextDark ? 'dark' : 'light' },
      })
    );
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        disabled
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-card text-card-foreground opacity-50 shadow-sm transition-colors',
          className
        )}
        {...props}
      >
        <span className="text-base">☀️</span>
      </button>
    );
  }

  return (
    <Within
      toggled={isDark}
      onToggle={handleToggle}
      duration={duration}
      aria-label="Toggle theme"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-lg cursor-pointer',
        className
      )}
      {...props}
    />
  );
}
