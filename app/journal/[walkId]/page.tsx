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
import { formatDistance, formatDuration } from '@/lib/geo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="w-full h-full bg-muted/40 animate-pulse flex items-center justify-center font-serif text-xs text-muted-foreground">
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

  // Tab state: 'stats' | 'specimens' | 'notes'
  const [activeTab, setActiveTab] = useState<'stats' | 'specimens' | 'notes'>('stats');

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Audio note playback state
  const [activePlayingNoteId, setActivePlayingNoteId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Safe delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial title setup
  useEffect(() => {
    if (walk) {
      const defaultTitle =
        walk.title ||
        `Expedition at ${new Date(walk.startedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      setTitleInput(defaultTitle);
    }
  }, [walk]);

  // Fit map bounds once walk is loaded
  useEffect(() => {
    if (walk && walk.trackPoints && walk.trackPoints.length > 0) {
      const timer = setTimeout(() => {
        mapRef.current?.fitTrailBounds({ top: 40, bottom: 40, left: 40, right: 40 });
      }, 500);
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

  const handlePlayNote = (note: Note) => {
    if (!note.audio) return;
    if (activePlayingNoteId === note.id) {
      audioPlayerRef.current?.pause();
      setActivePlayingNoteId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audioUrl = URL.createObjectURL(note.audio);
    const player = new Audio(audioUrl);
    audioPlayerRef.current = player;
    setActivePlayingNoteId(note.id);

    player.onended = () => {
      setActivePlayingNoteId(null);
      URL.revokeObjectURL(audioUrl);
    };

    player.play().catch((err) => {
      console.error('Audio playback error:', err);
      setActivePlayingNoteId(null);
    });
  };

  const handleDeletePreserveSpecies = async () => {
    setIsDeleting(true);
    try {
      // Delete unconfirmed entries and notes, but preserve confirmed entries
      await db.transaction('rw', db.walks, db.entries, db.notes, async () => {
        const unconfirmed = entries.filter((e) => e.status !== 'confirmed');
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
        <div className="font-serif text-sm text-muted-foreground animate-pulse">
          Loading expedition details...
        </div>
      </div>
    );
  }

  if (walk === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="font-serif text-xl font-bold">Expedition not found</h2>
        <p className="font-serif text-sm text-muted-foreground max-w-sm">
          This walk session may have been removed or does not exist.
        </p>
        <Link href="/journal">
          <Button className="rounded-xl bg-[#F35C2B] text-white">Return to Journal</Button>
        </Link>
      </div>
    );
  }

  const durationSeconds = walk.endedAt
    ? Math.round((walk.endedAt - walk.startedAt) / 1000)
    : 0;
  const confirmedEntries = entries.filter((e) => e.status === 'confirmed' && e.confirmed);
  const voiceNotes = notes.filter((n) => n.kind === 'voice');

  // Pace in min/km
  const distanceKm = (walk.distance || 0) / 1000;
  const paceMinutes =
    distanceKm > 0 && durationSeconds > 0
      ? (durationSeconds / 60 / distanceKm).toFixed(1)
      : '0.0';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
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
                  className="h-8 px-2 rounded-md border border-[#F35C2B] bg-background text-sm font-serif font-bold text-foreground focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 rounded-md bg-[#F35C2B] text-white hover:bg-[#F35C2B]/90"
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
                <h1 className="font-serif font-bold text-lg text-foreground truncate">
                  {walk.title ||
                    `Expedition at ${new Date(walk.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="text-muted-foreground hover:text-[#F35C2B] p-1 rounded transition-colors shrink-0"
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
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-9 px-2.5 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Delete Walk</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 pt-4 flex-1 flex flex-col space-y-4">
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

        {/* Tab Navigation Controls */}
        <div className="flex items-center border-b border-border gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`pb-2.5 px-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'stats'
                ? 'border-[#F35C2B] text-[#F35C2B]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Stats & Telemetry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specimens')}
            className={`pb-2.5 px-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'specimens'
                ? 'border-[#F35C2B] text-[#F35C2B]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Confirmed Specimens</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted font-mono">
              {confirmedEntries.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`pb-2.5 px-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-[#F35C2B] text-[#F35C2B]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Voice Notes</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted font-mono">
              {voiceNotes.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Stats */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <Card className="border border-border bg-card">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-[#F35C2B]" />
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
                  {formatDistance(walk.distance || 0)}
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

            <div className="col-span-2 sm:col-span-4 p-4 rounded-xl border border-border bg-muted/20 text-xs font-serif text-muted-foreground flex flex-wrap items-center justify-between gap-3">
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
        )}

        {/* Tab 2: Specimens */}
        {activeTab === 'specimens' && (
          <div className="space-y-4 pt-2">
            {confirmedEntries.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 text-muted-foreground font-serif text-sm">
                No confirmed specimens recorded on this walk.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {confirmedEntries.map((entry) => {
                  const commonName = entry.confirmed?.commonName || 'Unknown Specimen';
                  const scientificName = entry.confirmed?.scientificName || '';
                  const kind = entry.confirmed?.kind || 'plant';

                  let photoSrc = '';
                  const source = entry.thumbnail || entry.photo;
                  if (source instanceof Blob) {
                    photoSrc = URL.createObjectURL(source);
                  } else if (typeof source === 'string') {
                    photoSrc = source;
                  }

                  return (
                    <Card
                      key={entry.id}
                      className="border border-border bg-card overflow-hidden hover:border-[#F35C2B]/40 transition-colors"
                    >
                      <CardContent className="p-3.5 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-muted/60 overflow-hidden shrink-0">
                          {photoSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoSrc}
                              alt={commonName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">
                              🌿
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-foreground truncate">
                              {commonName}
                            </span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {kind}
                            </Badge>
                          </div>
                          <p className="font-serif italic text-xs text-muted-foreground truncate">
                            {scientificName}
                          </p>
                          <Link
                            href={`/entry/${entry.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#F35C2B] hover:underline pt-0.5"
                          >
                            <span>Inspect Specimen</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-3 pt-2">
            {voiceNotes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 text-muted-foreground font-serif text-sm">
                No voice notes recorded during this expedition.
              </div>
            ) : (
              voiceNotes.map((note) => {
                const isPlaying = activePlayingNoteId === note.id;
                return (
                  <Card key={note.id} className="border border-border bg-card">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handlePlayNote(note)}
                        className={`h-10 w-10 rounded-full shrink-0 ${
                          isPlaying
                            ? 'bg-[#F35C2B] text-white border-[#F35C2B]'
                            : 'text-[#F35C2B] hover:bg-[#F35C2B]/10'
                        }`}
                        aria-label={isPlaying ? 'Pause audio note' : 'Play audio note'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </Button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">
                            {new Date(note.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {note.duration && (
                            <span className="font-mono">
                              {formatDuration(Math.round(note.duration))}
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-sm text-foreground leading-relaxed">
                          {note.transcript || '(No transcript available)'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Safe Delete Confirmation Dialog (D-12, Copywriting Contract) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-lg text-foreground">
              Delete Walk Session
            </DialogTitle>
            <DialogDescription className="font-serif text-sm text-muted-foreground leading-relaxed pt-2">
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

