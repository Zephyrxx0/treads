'use client';

import * as React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Walk, type Entry, type Note } from '@/lib/db';
import { FlowerGarden } from '@/components/journal/flower-garden';
import { WalkCard } from '@/components/journal/walk-card';
import { PageShell } from '@/components/layout/page-shell';
import { FigureEmptyState } from '@/components/hairline/figure-empty-state';

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
  const liveWalks = useLiveQuery(() => db.walks.orderBy('startedAt').reverse().toArray());
  const liveEntries = useLiveQuery(() => db.entries.toArray());
  const liveNotes = useLiveQuery(() => db.notes.toArray());

  // Direct fetch fallback for environments where useLiveQuery might stall or delay initial emission
  const [directData, setDirectData] = React.useState<{
    walks: Walk[] | null;
    entries: Entry[] | null;
    notes: Note[] | null;
  }>({ walks: null, entries: null, notes: null });

  React.useEffect(() => {
    let active = true;
    Promise.all([
      db.walks.orderBy('startedAt').reverse().toArray().catch(() => []),
      db.entries.toArray().catch(() => []),
      db.notes.toArray().catch(() => []),
    ]).then(([w, e, n]) => {
      if (active) {
        setDirectData({ walks: w, entries: e, notes: n });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Safe resolved data, preferring liveQuery updates
  const walks = liveWalks ?? directData.walks ?? [];
  const entries = liveEntries ?? directData.entries ?? [];
  const notes = liveNotes ?? directData.notes ?? [];

  // Timed out loading safeguard: after 1.5 seconds, unblock rendering under any circumstance
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const isLoading =
    !timedOut &&
    liveWalks === undefined &&
    liveEntries === undefined &&
    liveNotes === undefined &&
    directData.walks === null;

  // Group walks by date key
  const groupedWalks = React.useMemo(() => {
    if (!walks || walks.length === 0) return [];

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

  return (
    <PageShell
      eyebrow="Field journal"
      title="Journal"
      aside={walks ? `${walks.length} ${walks.length === 1 ? 'walk' : 'walks'}` : undefined}
    >
      {isLoading ? (
        <div className="animate-pulse space-y-8">
          <div className="h-96 rounded-[1.75rem] border border-border bg-muted/40" />
          <div className="space-y-3">
            <div className="h-24 rounded-[1.25rem] border border-border bg-muted/40" />
            <div className="h-24 rounded-[1.25rem] border border-border bg-muted/40" />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <FlowerGarden walks={walks} entries={entries || []} />

          {walks.length === 0 ? (
            <FigureEmptyState
              figure={{
                name: 'pebbles',
                label: 'Ten river pebbles on wet sand. Move over one and it lifts while the others slide away.',
              }}
              title="No walks recorded yet"
              description="Every collection starts with one pebble. Go for a walk and its route, finds and spoken notes will be kept here."
            />
          ) : (
            <div className="min-w-0 space-y-8">
              {groupedWalks.map((group) => (
                <section key={group.key} className="space-y-3">
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{group.label}</h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,220px))] gap-3 sm:gap-4">
                    {group.walks.map((walk) => (
                      <WalkCard
                        key={walk.id}
                        walk={walk}
                        entries={(entries || []).filter((e) => e.walkId === walk.id)}
                        notes={(notes || []).filter((n) => n.walkId === walk.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
