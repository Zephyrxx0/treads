'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, ScanSearch, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { useBlobUrl } from '@/hooks/use-blob-url';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FactCard } from '@/components/entry/fact-card';

export interface EntryDetailPaneProps {
  /** Entry to show; `null` slides the pane away */
  entryId: string | null;
  onClose: () => void;
  /** Run an unidentified find through the identifier */
  onIdentify?: (entryId: string) => void;
}

/**
 * Slides over the chat pane to show one find (photo, names, Wikipedia facts)
 * without leaving the walk. The full /entry/[id] page still exists separately.
 */
export function EntryDetailPane({ entryId, onClose, onIdentify }: EntryDetailPaneProps) {
  // Keep the last entry rendered while the pane slides out.
  const [shownId, setShownId] = useState<string | null>(entryId);
  useEffect(() => {
    if (entryId) setShownId(entryId);
  }, [entryId]);

  const open = entryId !== null;
  // The result carries the id it was fetched for, so "still loading this find" is never
  // mistaken for "this find is gone".
  const found = useLiveQuery(
    async () =>
      shownId ? { id: shownId, entry: (await db.entries.get(shownId)) ?? null } : null,
    [shownId],
  );
  const entry = found && found.id === shownId ? found.entry : undefined;
  const photoUrl = useBlobUrl(entry?.photo);
  const backRef = useRef<HTMLButtonElement | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isFetchingFacts, setIsFetchingFacts] = useState(false);

  // A different find (or a closed pane) never inherits a half-made delete.
  useEffect(() => {
    setConfirmingDelete(false);
  }, [entryId]);

  const wikipediaTitle = entry?.confirmed?.wikipediaTitle || entry?.confirmed?.scientificName;

  // On-demand fetch of verified Wikipedia facts if confirmed but not yet saved in Dexie
  useEffect(() => {
    if (!open || !entry?.confirmed || entry.facts || isFetchingFacts || !wikipediaTitle) return;
    let active = true;
    setIsFetchingFacts(true);

    async function fetchFacts() {
      try {
        const res = await fetch('/api/facts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wikipediaTitle }),
        });
        if (res.ok) {
          const data = await res.json();
          const factsData = {
            summary: data.summary,
            facts: data.facts,
            sourceUrl: data.sourceUrl,
            ...(data.lookClosely ? { lookClosely: data.lookClosely } : {}),
            ...(data.sentences ? { sentences: data.sentences } : {}),
          };
          if (active && entry?.id) {
            await db.entries.update(entry.id, { facts: factsData });
          }
        }
      } catch (err) {
        console.error('Failed to auto-fetch facts in entry detail pane:', err);
      } finally {
        if (active) setIsFetchingFacts(false);
      }
    }

    fetchFacts();

    return () => {
      active = false;
    };
  }, [open, entry?.id, entry?.confirmed, entry?.facts, isFetchingFacts, wikipediaTitle]);

  // The find was deleted while it was open: go back to the chat.
  const gone = open && !!found && found.id === entryId && found.entry === null;
  useEffect(() => {
    if (gone) onClose();
  }, [gone, onClose]);

  useEffect(() => {
    if (!open) return;
    // preventScroll: focusing inside an overflow-hidden parent mid-slide would jolt it.
    backRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const isScene = entry?.status === 'scene';
  const commonName =
    entry?.confirmed?.commonName ??
    (isScene ? entry?.caption?.trim() || 'Photo' : 'Unidentified find');
  const scientificName = entry?.confirmed?.scientificName;
  const date = entry
    ? new Date(entry.createdAt || entry.timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      role="region"
      aria-label="Find details"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        'absolute inset-0 z-10 flex flex-col bg-card will-change-transform transition-transform duration-[350ms] ease-in-out motion-reduce:transition-none',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <button
          ref={backRef}
          type="button"
          onClick={onClose}
          aria-label="Back to walk activity"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {commonName}
        </span>
      </header>

      {entry && (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/40">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={commonName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No photo available
              </div>
            )}
            {entry.confirmed?.kind && (
              <Badge
                variant="secondary"
                className="absolute left-3 top-3 border-border/80 bg-background/80 text-xs capitalize backdrop-blur-md"
              >
                {entry.confirmed.kind}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{commonName}</h2>
            {scientificName && (
              <p className="text-sm italic text-muted-foreground">{scientificName}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {date}
              </span>
              {entry.confirmed?.verified && (
                <Badge
                  variant="secondary"
                  className="gap-1 border border-primary/20 bg-primary/10 text-[11px] text-primary"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Verified taxon
                </Badge>
              )}
            </div>
          </div>

          {entry.confirmed ? (
            <FactCard
              factsData={entry.facts}
              speciesName={commonName}
              isLoading={isFetchingFacts || (!entry.facts && !!wikipediaTitle)}
            />
          ) : (
            <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
              <p className="text-center text-xs text-muted-foreground">
                {isScene
                  ? 'Saved as a photo for your log. If something living is in the frame, you can still identify it.'
                  : 'This find isn\u2019t identified yet. Facts appear once a species is confirmed.'}
              </p>
              {confirmingDelete ? (
                <div className="space-y-2">
                  <p className="text-center text-xs font-medium text-foreground">
                    Delete this find and its message?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmingDelete(false)}
                      className="h-10 cursor-pointer rounded-xl"
                    >
                      Keep
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => entry && void db.entries.delete(entry.id)}
                      className="h-10 cursor-pointer gap-2 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => entry && onIdentify?.(entry.id)}
                    disabled={!onIdentify}
                    className="h-10 cursor-pointer gap-2 rounded-xl font-semibold"
                  >
                    <ScanSearch className="h-4 w-4" />
                    Identify
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmingDelete(true)}
                    className="h-10 cursor-pointer gap-2 rounded-xl text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
