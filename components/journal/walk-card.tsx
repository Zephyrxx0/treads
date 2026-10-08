'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, Route, Mic, ArrowRight, Compass, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Walk, Entry, Note } from '@/lib/db';
import { formatDistance, formatDuration } from '@/lib/geo';

export interface WalkCardProps {
  walk: Walk;
  entries: Entry[];
  notes: Note[];
  className?: string;
}

export function WalkCard({ walk, entries, notes, className }: WalkCardProps) {
  const durationSeconds = walk.endedAt
    ? Math.round((walk.endedAt - walk.startedAt) / 1000)
    : 0;

  const confirmedEntries = entries.filter((e) => e.status === 'confirmed' && e.confirmed);
  const voiceNotes = notes.filter((n) => n.kind === 'voice');

  const startTimeStr = new Date(walk.startedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      href={`/journal/${walk.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <Card
        className={cn(
          'overflow-hidden border border-border bg-card hover:border-[#F35C2B]/40 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5',
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {/* Header Row: Start Time, Mode, and Action Link */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-base text-foreground group-hover:text-[#F35C2B] transition-colors">
                Expedition at {startTimeStr}
              </span>
              <Badge variant="outline" className="text-[11px] capitalize">
                {walk.mode === 'loop' ? 'Loop Route' : 'Free Walk'}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              <span>View Route</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          {/* Telemetry Stats Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#F35C2B]" />
              <span className="text-foreground font-semibold">
                {formatDuration(durationSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-foreground font-semibold">
                {formatDistance(walk.distance || 0)}
              </span>
            </div>

            {voiceNotes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#F35C2B]" />
                <span className="text-foreground font-semibold">
                  {voiceNotes.length} note{voiceNotes.length === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>

          {/* Specimen Thumbnails Preview */}
          {confirmedEntries.length > 0 ? (
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center -space-x-2 overflow-hidden">
                {confirmedEntries.slice(0, 4).map((entry) => {
                  const name = entry.confirmed?.commonName || 'Specimen';
                  return (
                    <div
                      key={entry.id}
                      title={name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-card bg-muted/60 overflow-hidden shrink-0"
                    >
                      {entry.thumbnail || entry.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            entry.thumbnail instanceof Blob
                              ? URL.createObjectURL(entry.thumbnail)
                              : typeof entry.thumbnail === 'string'
                              ? entry.thumbnail
                              : entry.photo instanceof Blob
                              ? URL.createObjectURL(entry.photo)
                              : typeof entry.photo === 'string'
                              ? entry.photo
                              : ''
                          }
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px]">
                          🌿
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <span className="text-xs font-serif text-muted-foreground truncate text-right">
                {confirmedEntries.length} confirmed find{confirmedEntries.length === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <div className="pt-2 border-t border-border/60 text-xs font-serif text-muted-foreground italic">
              No specimens recorded on this trail
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

