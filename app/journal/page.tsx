'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ActivityHeatmap } from '@/components/journal/activity-heatmap';
import { WalkCard } from '@/components/journal/walk-card';
import { Button } from '@/components/ui/button';
import { Compass, BookOpen, Settings, Footprints, AlertCircle } from 'lucide-react';

function formatDateHeader(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDateKey(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-CA');
}

export default function JournalPage() {
  const walks = useLiveQuery(() => db.walks.orderBy('startedAt').reverse().toArray());
  const entries = useLiveQuery(() => db.entries.toArray());
  const notes = useLiveQuery(() => db.notes.toArray());

  // Group walks by date key
  const groupedWalks = React.useMemo(() => {
    if (!walks) return [];

    const map = new Map<string, { label: string; walks: typeof walks }>();

    for (const walk of walks) {
      const key = getDateKey(walk.startedAt);
      if (!map.has(key)) {
        map.set(key, {
          label: formatDateHeader(walk.startedAt),
          walks: [],
        });
      }
      map.get(key)!.walks.push(walk);
    }

    return Array.from(map.entries()).map(([key, group]) => ({
      key,
      label: group.label,
      walks: group.walks,
    }));
  }, [walks]);

  // Loading state
  const isLoading = walks === undefined || entries === undefined || notes === undefined;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <Compass className="w-5 h-5 text-[#F35C2B]" />
            </Link>
            <h1 className="font-serif font-bold text-xl tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#F35C2B]" />
              <span>Field Journal</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/collection">
              <Button variant="ghost" size="sm" className="text-xs h-9 font-medium">
                Life List
              </Button>
            </Link>
            <Link href="/settings" aria-label="Settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-2xl bg-muted/40 border border-border" />
            <div className="space-y-3">
              <div className="h-6 w-32 bg-muted/50 rounded-md" />
              <div className="h-28 rounded-2xl bg-muted/40 border border-border" />
              <div className="h-28 rounded-2xl bg-muted/40 border border-border" />
            </div>
          </div>
        ) : walks.length === 0 ? (
          <div className="space-y-8">
            {/* Heatmap rendered even when empty */}
            <ActivityHeatmap walks={[]} entries={entries || []} />

            {/* Empty State */}
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F35C2B]/10 text-[#F35C2B] flex items-center justify-center mx-auto">
                <Footprints className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="font-serif font-bold text-xl text-foreground">
                  No expeditions recorded yet
                </h2>
                <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                  Every journey begins with a single step. Start a walk to record GPS tracks, species finds, and audio notes.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/walk">
                  <Button className="h-11 px-6 rounded-xl bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white font-medium shadow-md transition-transform active:scale-95">
                    Start Walk
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Heatmap Card */}
            <ActivityHeatmap walks={walks} entries={entries || []} />

            {/* Grouped Walks Timeline */}
            <div className="space-y-8">
              {groupedWalks.map((group) => (
                <section key={group.key} className="space-y-3">
                  <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-xs py-1">
                    <h2 className="font-serif font-semibold text-sm tracking-wide text-muted-foreground uppercase">
                      {group.label}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {group.walks.map((walk) => {
                      const walkEntries = (entries || []).filter((e) => e.walkId === walk.id);
                      const walkNotes = (notes || []).filter((n) => n.walkId === walk.id);

                      return (
                        <WalkCard
                          key={walk.id}
                          walk={walk}
                          entries={walkEntries}
                          notes={walkNotes}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
