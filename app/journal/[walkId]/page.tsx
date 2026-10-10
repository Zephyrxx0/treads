'use client';

import * as React from 'react';
import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Route,
  Activity,
  MapPin,
  Mic,
  Play,
  Pause,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { db, Walk, Entry, Note } from '@/lib/db';
import { formatDistance, formatDuration, calculateHaversineDistance } from '@/lib/geo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ActivityLog } from '@/components/walk/activity-log';
import { PageAmbience } from '@/components/nature/page-ambience';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { WalkMapRef } from '@/components/map/walk-map';

const WalkMap = dynamic(() => import('@/components/map/walk-map').then((m) => m.WalkMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/40 animate-pulse flex items-center justify-center font-sans text-xs text-muted-foreground">
      Loading terrain map...
    </div>
  ),
});

export default function WalkDetailPage({
  params,
}: {
  params: Promise<{ walkId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { walkId } = resolvedParams;

  const walk = useLiveQuery(() => db.walks.get(walkId), [walkId]);
  const entries = useLiveQuery(
    () => db.entries.where('walkId').equals(walkId).toArray(),
    [walkId]
  ) || [];
  const notes = useLiveQuery(
    () => db.notes.where('walkId').equals(walkId).toArray(),
    [walkId]
  ) || [];

  const mapRef = useRef<WalkMapRef | null>(null);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Safe delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute geodesic distance if walk.distance is 0 but track points exist
  const computedDistanceMeters = React.useMemo(() => {
    if (!walk) return 0;
    let d = walk.distance || 0;
    if (d === 0 && walk.trackPoints && walk.trackPoints.length > 1) {
      for (let i = 1; i < walk.trackPoints.length; i++) {
        d += calculateHaversineDistance(
          walk.trackPoints[i - 1].lat,
          walk.trackPoints[i - 1].lng,
          walk.trackPoints[i].lat,
          walk.trackPoints[i].lng
        );
      }
      d = Math.round(d);
    }
    return d;
  }, [walk]);

  // Initial title setup
  useEffect(() => {
    if (walk) {
      const defaultTitle =
        walk.title ||
        `Walk at ${new Date(walk.startedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      setTitleInput(defaultTitle);
    }
  }, [walk]);

  // Fit map bounds once walk is loaded
  useEffect(() => {
    if (walk) {
      const timer = setTimeout(() => {
        mapRef.current?.fitTrailBounds({ top: 40, bottom: 40, left: 40, right: 40 });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [walk]);

  const handleSaveTitle = async () => {
    if (!walk || !titleInput.trim()) return;
    try {
      await db.walks.update(walkId, { title: titleInput.trim() });
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Failed to update walk title:', err);
    }
  };

  const handleDeletePreserveSpecies = async () => {
    setIsDeleting(true);
    try {
      // Delete unconfirmed entries and notes, but preserve confirmed entries
      await db.transaction('rw', db.walks, db.entries, db.notes, async () => {
        const unconfirmed = entries.filter((e) => e.status !== 'confirmed' && e.status !== 'identified');
        for (const e of unconfirmed) {
          await db.entries.delete(e.id);
        }
        for (const n of notes) {
          await db.notes.delete(n.id);
        }
        await db.walks.delete(walkId);
      });
      setDeleteDialogOpen(false);
      router.push('/journal');
    } catch (err) {
      console.error('Failed to delete walk:', err);
      setIsDeleting(false);
    }
  };

  const handleDeletePurgeAll = async () => {
    setIsDeleting(true);
    try {
      await db.transaction('rw', db.walks, db.entries, db.notes, async () => {
        for (const e of entries) {
          await db.entries.delete(e.id);
        }
        for (const n of notes) {
          await db.notes.delete(n.id);
        }
        await db.walks.delete(walkId);
      });
      setDeleteDialogOpen(false);
      router.push('/journal');
    } catch (err) {
      console.error('Failed to purge walk and entries:', err);
      setIsDeleting(false);
    }
  };

  if (walk === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-sans text-sm text-muted-foreground animate-pulse">
          Loading expedition details...
        </div>
      </div>
    );
  }

  if (walk === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="font-serif text-xl font-bold">Expedition not found</h2>
        <p className="font-sans text-sm text-muted-foreground max-w-sm">
          This walk session may have been removed or does not exist.
        </p>
        <Link href="/journal">
          <Button className="rounded-xl bg-primary text-primary-foreground">Return to Journal</Button>
        </Link>
      </div>
    );
  }

  const durationSeconds = walk.endedAt
    ? Math.round((walk.endedAt - walk.startedAt) / 1000)
    : 0;
  const confirmedEntries = entries.filter((e) => (e.status === 'confirmed' || e.status === 'identified') && e.confirmed);
  const voiceNotes = notes.filter((n) => n.kind === 'voice');

  // Pace in min/km
  const distanceKm = computedDistanceMeters / 1000;
  const paceMinutes =
    distanceKm > 0 && durationSeconds > 0
      ? (durationSeconds / 60 / distanceKm).toFixed(1)
      : '0.0';

  return (
    <div className="paper-grain relative min-h-dvh bg-background text-foreground flex flex-col pb-28 sm:pb-16 overflow-x-clip">
      <PageAmbience pageWidth={896} />
      {/* Sticky Header */}
      <header className="relative z-10 mx-auto w-full max-w-4xl px-5 pt-10 sm:px-8 sm:pt-24">
        <div className="flex h-12 items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/journal"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
              aria-label="Back to journal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="h-8 px-2 rounded-md border border-primary bg-background text-sm font-sans font-bold text-foreground focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  aria-label="Save title"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                  aria-label="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-serif text-2xl font-normal tracking-tight text-foreground truncate">
                  {walk.title ||
                    `Walk at ${new Date(walk.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="text-muted-foreground hover:text-primary p-1 rounded transition-colors shrink-0"
                  aria-label="Edit walk title"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-2.5 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Delete Walk</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-5 sm:px-8 pt-3 flex-1 flex flex-col space-y-4">
        {/* MapLibre Route Replay Map Container */}
        <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-border shadow-sm">
          <WalkMap
            ref={mapRef}
            userPosition={null}
            trackPoints={walk.trackPoints || []}
            specimenEntries={confirmedEntries}
            audioNotes={notes}
            suggestedRouteLine={walk.routeLine || null}
            isWalkActive={false}
          />
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Card className="border border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Duration</span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {formatDuration(durationSeconds)}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Route className="w-3.5 h-3.5 text-emerald-500" />
                <span>Distance</span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {formatDistance(computedDistanceMeters)}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Avg Pace</span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {paceMinutes} <span className="text-xs font-normal text-muted-foreground">min/km</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                <span>GPS Points</span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {walk.trackPoints?.length || 0}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 sm:col-span-4 p-4 rounded-xl border border-border bg-muted/20 text-xs font-sans text-muted-foreground flex flex-wrap items-center justify-between gap-3">
            <div>
              Started: <span className="font-mono text-foreground">{new Date(walk.startedAt).toLocaleString()}</span>
            </div>
            {walk.endedAt && (
              <div>
                Concluded: <span className="font-mono text-foreground">{new Date(walk.endedAt).toLocaleString()}</span>
              </div>
            )}
            <Badge variant="outline" className="capitalize">
              {walk.mode === 'loop' ? 'Loop Route' : 'Free Walk'}
            </Badge>
          </div>
        </div>

        {/* Chat-Style Walk Activity Log */}
        <section className="pt-3">
          <ActivityLog
            specimens={entries}
            notes={notes}
            startedAt={walk.startedAt}
            onOpenEntry={(entryId) => router.push(`/entry/${entryId}`)}
            className="overflow-visible px-0 py-1"
          />
        </section>
      </main>

      {/* Safe Delete Confirmation Dialog (D-12, Copywriting Contract) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-lg text-foreground">
              Delete Walk Session
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground leading-relaxed pt-2">
              Remove this walk from your journal? You can choose to preserve confirmed specimens in your Life List or purge all associated entries.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={handleDeletePreserveSpecies}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Preserve Confirmed Species
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeletePurgeAll}
              className="w-full sm:w-auto text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              Purge Walk and Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

