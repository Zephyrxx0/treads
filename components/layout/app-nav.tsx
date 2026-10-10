'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Footprints, Leaf, Settings } from 'lucide-react';
import { LeafMark } from '@/components/brand/leaf-mark';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/walk', label: 'Walk', icon: Footprints },
  { href: '/collection', label: 'Life list', icon: Leaf },
  { href: '/journal', label: 'Journal', icon: BookOpen },
] as const;

/** Routes that bring their own chrome: the landing page and the full-screen map. */
const HIDDEN = ['/', '/walk', '/spike', '/eval'];

/**
 * One small floating pill instead of a banner on every page: at the top on
 * desktop, at the thumb on phones. It is the only way between the main rooms.
 */
export function AppNav() {
  const pathname = usePathname();
  if (HIDDEN.includes(pathname)) return null;

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 sm:bottom-auto sm:top-5"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/90 p-2 shadow-lg backdrop-blur-md">
        <Link
          href="/"
          aria-label="Treads, home"
          className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <LeafMark className="h-6 w-6" />
        </Link>
        <span aria-hidden className="mx-2 h-5 w-px bg-border" />
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? 'page' : undefined}
            className={cn(
              'flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors max-sm:px-3.5',
              active(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 sm:hidden" strokeWidth={1.75} />
            <span className="max-sm:sr-only">{label}</span>
          </Link>
        ))}
        <span aria-hidden className="mx-2 h-5 w-px bg-border" />
        <Link
          href="/settings"
          aria-label="Settings"
          aria-current={active('/settings') ? 'page' : undefined}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
            active('/settings') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Link>
        <ThemeToggle className="!h-11 !w-11 !rounded-full !border-0 !bg-transparent !shadow-none hover:!bg-muted" />
      </div>
    </nav>
  );
}
