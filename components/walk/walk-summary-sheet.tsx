'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatDistance, formatDuration } from '@/lib/geo';
import { Clock, MapPin, Gauge, Leaf, ArrowRight, Mic, Play, Pause, Network } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry, Note } from '@/lib/db';
import { Sparkles } from 'lucide-react';

export interface WalkSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walkId?: string;
  durationSeconds: number;
  distanceMeters: number;
  speciesCount?: number;
  specimens?: Entry[];
  notes?: Note[];
  onDone: () => void;
  onViewJournal?: () => void;
}

export function WalkSummarySheet({
  open,
  onOpenChange,
  walkId,
  durationSeconds,
  distanceMeters,
  speciesCount = 0,
  specimens = [],
  notes = [],
  onDone,
  onViewJournal,
}: WalkSummarySheetProps) {
  const liveWalk = useLiveQuery(() => (walkId ? db.walks.get(walkId) : undefined), [walkId]);
  const liveSpecimens = useLiveQuery(
    () => (walkId ? db.entries.where('walkId').equals(walkId).toArray() : []),
    [walkId],
  );
  const liveNotes = useLiveQuery(
    () => (walkId ? db.notes.where('walkId').equals(walkId).toArray() : []),
    [walkId],
  );

  const displaySpecimens = (liveSpecimens && liveSpecimens.length > 0) ? liveSpecimens : specimens;
  const displayNotes = (liveNotes && liveNotes.length > 0) ? liveNotes : notes;

  const [isSynthesizingDispatch, setIsSynthesizingDispatch] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [walkId]);

  // Auto-synthesize dispatch and ecological web if not yet generated
  useEffect(() => {
    const targetWalkId = walkId;
    if (!open || !targetWalkId || !liveWalk || liveWalk.dispatch || isSynthesizingDispatch || hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;
    setIsSynthesizingDispatch(true);

    async function triggerDispatch(resolvedId: string) {
      try {
        const currentEntries = await db.entries.where('walkId').equals(resolvedId).toArray();
        const currentNotes = await db.notes.where('walkId').equals(resolvedId).toArray();

        const confirmedNames = currentEntries
          .map((s) => s.confirmed?.commonName || s.confirmed?.scientificName)
          .filter(Boolean) as string[];
        const noteTexts = currentNotes.map((n) => n.transcript).filter(Boolean);

        const res = await fetch('/api/walk/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            species: confirmedNames,
            notes: noteTexts,
            duration: durationSeconds,
            distance: distanceMeters,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.dispatch) {
            await db.walks.update(resolvedId, {
              dispatch: data.dispatch,
              connections: data.connections || [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to auto-synthesize walk dispatch in summary sheet:', err);
      } finally {
        setIsSynthesizingDispatch(false);
      }
    }

    triggerDispatch(targetWalkId);
  }, [open, walkId, liveWalk, isSynthesizingDispatch, durationSeconds, distanceMeters]);

  // Compute average pace (minutes per km)
  let paceDisplay = '--:-- /km';
  if (distanceMeters >= 50 && durationSeconds > 0) {
    const km = distanceMeters / 1000;
    const paceSecondsPerKm = durationSeconds / km;
    const paceMin = Math.floor(paceSecondsPerKm / 60);
    const paceSec = Math.floor(paceSecondsPerKm % 60);
    paceDisplay = `${paceMin}:${paceSec.toString().padStart(2, '0')} /km`;
  }

  const confirmedCount = displaySpecimens.filter(
    (e) => e.status !== 'unidentified' && e.status !== 'scene',
  ).length;
  const effectiveSpeciesCount = confirmedCount || speciesCount;
  const speciesLabel =
    effectiveSpeciesCount === 1 ? '1 species recorded' : `${effectiveSpeciesCount} species recorded`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl border-t border-border/80 bg-card p-6 pb-8 shadow-2xl"
      >
        <SheetHeader className="text-left space-y-1 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <SheetTitle className="text-xl font-semibold tracking-tight text-foreground font-sans">
              Walk Complete
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            Summary of your outdoor trail session and field observations.
          </SheetDescription>
        </SheetHeader>

        {/* Big Total Distance Headline (Display 28px per UI-SPEC) */}
        <div className="py-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Total Distance
          </span>
          <div className="text-3xl font-bold tracking-tight text-primary font-sans">
            {formatDistance(distanceMeters)}
          </div>
        </div>

        {/* 4-Cell Stats Grid (lg 24px cell padding per UI-SPEC) */}
        <div className="grid grid-cols-2 gap-3 py-2">
          {/* Duration */}
          <div className="flex flex-col p-3 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Duration</span>
            </div>
            <span className="font-mono text-base font-semibold text-foreground">
              {formatDuration(durationSeconds)}
            </span>
          </div>

          {/* Average Pace */}
          <div className="flex flex-col p-3 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Gauge className="w-3.5 h-3.5 text-primary" />
              <span>Avg Pace</span>
            </div>
            <span className="font-mono text-base font-semibold text-foreground">{paceDisplay}</span>
          </div>

          {/* Species Count */}
          <div className="flex flex-col p-3 rounded-xl bg-muted/50 border border-border/60 col-span-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Field Identifications</span>
            </div>
            <span className="font-mono text-base font-semibold text-foreground">
              {speciesLabel}
            </span>
          </div>
        </div>

        {/* Visual Species Reel (per D-16) */}
        {displaySpecimens.length > 0 && (
          <div className="py-2 space-y-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Specimens Logged Today
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
              {displaySpecimens.map((specimen) => (
                <SpeciesReelItem key={specimen.id} specimen={specimen} />
              ))}
            </div>
          </div>
        )}

        {/* Voice Notes Reel (per D-03, ROUT-02, UI-SPEC) */}
        {displayNotes && displayNotes.length > 0 && (
          <div className="py-2 space-y-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center justify-between">
              <span>Voice Notes Logged</span>
              <span className="text-primary font-semibold">{displayNotes.length}</span>
            </span>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {displayNotes.map((note) => (
                <NoteSnippetItem key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

        {/* Naturalist Field Dispatch (Gemma) */}
        {liveWalk?.dispatch ? (
          <div className="py-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary font-mono">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Naturalist Field Dispatch</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs leading-relaxed text-foreground font-serif italic">
              &ldquo;{liveWalk.dispatch}&rdquo;
            </div>
          </div>
        ) : isSynthesizingDispatch ? (
          <div className="py-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary font-mono">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Naturalist Field Dispatch</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs leading-relaxed text-muted-foreground flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-primary animate-spin shrink-0" />
              <span>Synthesizing naturalist dispatch with Gemma...</span>
            </div>
          </div>
        ) : null}

        {/* Observed Ecological Web (Gemma) */}
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Observed Ecological Web
            </span>
            {liveWalk?.connections && liveWalk.connections.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {liveWalk.connections.length} {liveWalk.connections.length === 1 ? 'relation' : 'relations'}
              </span>
            )}
          </div>

          {liveWalk?.connections && liveWalk.connections.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
              {liveWalk.connections.map((conn, idx) => (
                <div
                  key={`conn-${idx}`}
                  className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
                      {conn.speciesA}
                    </span>
                    <span className="text-muted-foreground text-[10px]">↔</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
                      {conn.speciesB}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-normal">
                    {conn.relationship}
                  </p>
                </div>
              ))}
            </div>
          ) : isSynthesizingDispatch ? (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed flex items-center gap-2">
              <Network className="w-4 h-4 text-primary animate-pulse shrink-0" />
              <span>Analyzing trophic relationships with Gemma...</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
              <Network className="w-4 h-4 text-muted-foreground/70 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground/80">No ecological connections detected</p>
                <p className="text-[11px] mt-0.5">
                  Ecological web links activate when two or more interconnected wild species (pollinators, plants, canopy trees, fungi) are recorded on the trail.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (per D-16) */}
        <SheetFooter className="flex flex-col gap-2 pt-4 sm:flex-col sm:space-x-0">
          {/* Primary "Done" action resets /walk to ready state */}
          <Button
            type="button"
            onClick={onDone}
            className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md cursor-pointer"
          >
            Done
          </Button>

          {/* Secondary "View in Journal" link */}
          {onViewJournal ? (
            <Button
              type="button"
              variant="outline"
              onClick={onViewJournal}
              className="w-full h-11 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted cursor-pointer"
            >
              View in Journal
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Link
              href="/journal"
              onClick={onDone}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'w-full h-11 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted cursor-pointer',
              )}
            >
              View in Journal
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SpeciesReelItem({ specimen }: { specimen: Entry }) {
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const source = specimen.thumbnail || specimen.photo;
    if (!source) return;

    if (source instanceof Blob) {
      const url = URL.createObjectURL(source);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof source === 'string') {
      setThumbUrl(source);
    }
  }, [specimen.thumbnail, specimen.photo]);

  const name =
    specimen.confirmed?.commonName ||
    (specimen.status === 'scene' ? specimen.caption?.trim() || 'Photo' : 'Unidentified Specimen');

  return (
    <Link
      href={`/entry/${specimen.id}`}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/60 shrink-0 w-24 text-center transition-transform active:scale-95 group cursor-pointer"
    >
      <div className="w-14 h-14 rounded-full overflow-hidden bg-black/10 border-2 border-primary/40 group-hover:border-primary transition-colors shrink-0">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs">🌱</div>
        )}
      </div>
      <span className="text-[11px] font-medium text-foreground line-clamp-1 leading-tight group-hover:text-primary transition-colors">
        {name}
      </span>
    </Link>
  );
}

function NoteSnippetItem({ note }: { note: Note }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      if (!note.audio) return;
      const url = URL.createObjectURL(note.audio);
      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.warn);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        disabled={!note.audio}
        className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0 mt-0.5 cursor-pointer"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </Button>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-foreground truncate flex items-center gap-1">
            <Mic className="w-3 h-3 text-primary" />
            Voice Note
          </span>
          {note.duration && (
            <span className="text-[10px] text-muted-foreground font-mono">{note.duration}s</span>
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
          {note.transcript || 'Audio note recorded.'}
        </p>
      </div>
    </div>
  );
}
