'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Compass, MapPin, Mic, Play, Pause, RefreshCw, Sparkles } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry, Note, Candidate } from '@/lib/db';
import { FactCard, FactData } from '@/components/entry/fact-card';
import { VoiceRecorderSheet } from '@/components/voice/voice-recorder-sheet';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TegakiText } from '@/components/motion/tegaki-text';
import { cn } from '@/lib/utils';
import { blobToBase64 } from '@/lib/camera';
import { PageAmbience } from '@/components/nature/page-ambience';

export default function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetchingFacts, setIsFetchingFacts] = useState<boolean>(false);
  const [isReidentifying, setIsReidentifying] = useState<boolean>(false);
  const [reidentifyError, setReidentifyError] = useState<string | null>(null);
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState<boolean>(false);
  const [activePlayingNoteId, setActivePlayingNoteId] = useState<string | null>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  const entryNotes = useLiveQuery(
    async () => db.notes.where('entryId').equals(id).toArray(),
    [id]
  ) || [];

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

    let url: string;
    if (note.audio instanceof Blob) {
      url = URL.createObjectURL(note.audio);
    } else {
      url = note.audio;
    }

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    audio.onended = () => setActivePlayingNoteId(null);
    audio.play().catch(console.warn);
    setActivePlayingNoteId(note.id);
  };

  // Load entry from Dexie
  useEffect(() => {
    let active = true;

    async function loadEntry() {
      try {
        const found = await db.entries.get(id);
        if (active) {
          setEntry(found || null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load entry:', err);
        if (active) setLoading(false);
      }
    }

    loadEntry();

    return () => {
      active = false;
    };
  }, [id]);

  // Object URL lifecycle management for photo
  useEffect(() => {
    if (!entry?.photo) {
      setPhotoUrl(null);
      return;
    }

    if (entry.photo instanceof Blob) {
      const url = URL.createObjectURL(entry.photo);
      setPhotoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (typeof entry.photo === 'string') {
      setPhotoUrl(entry.photo);
    }
  }, [entry?.photo]);

  // On-demand fetch of facts if species confirmed and not yet populated
  useEffect(() => {
    if (!entry || entry.facts || isFetchingFacts || !entry.confirmed) return;

    const title =
      entry.confirmed.wikipediaTitle ||
      entry.confirmed.scientificName;

    if (!title) return;

    let active = true;
    setIsFetchingFacts(true);

    async function fetchFacts() {
      try {
        const res = await fetch('/api/facts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wikipediaTitle: title }),
        });

        if (res.ok) {
          const data = await res.json();
          const factsData: FactData = {
            summary: data.summary,
            facts: data.facts,
            sourceUrl: data.sourceUrl,
            lookClosely: data.lookClosely,
            sentences: data.sentences,
          };

          if (active) {
            // Update Dexie database
            await db.entries.update(id, { facts: factsData });
            setEntry((prev) => (prev ? { ...prev, facts: factsData } : prev));
          }
        }
      } catch (err) {
        console.error('Failed to auto-fetch facts for entry:', err);
      } finally {
        if (active) setIsFetchingFacts(false);
      }
    }

    fetchFacts();

    return () => {
      active = false;
    };
  }, [entry, id, isFetchingFacts]);

  const handleConfirmCandidate = async (candidate: Candidate) => {
    if (!entry) return;
    try {
      await db.entries.update(id, {
        confirmed: candidate,
        status: 'confirmed',
        verified: candidate.verified ?? false,
      });
      setEntry((prev) =>
        prev
          ? {
              ...prev,
              confirmed: candidate,
              status: 'confirmed',
              verified: candidate.verified ?? false,
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to confirm candidate in Dexie:', err);
    }
  };

  const handleReidentify = async () => {
    if (!entry?.photo || isReidentifying) return;
    setIsReidentifying(true);
    setReidentifyError(null);
    try {
      let base64 = '';
      if (entry.photo instanceof Blob) {
        base64 = await blobToBase64(entry.photo);
      } else if (typeof entry.photo === 'string') {
        base64 = entry.photo.startsWith('data:') ? entry.photo.split(',')[1] : entry.photo;
      }

      if (!base64) throw new Error('Could not read observation photo data');

      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          month: new Date(entry.createdAt || entry.timestamp).getMonth() + 1,
          lat: entry.lat || undefined,
          lng: entry.lng || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Identify API returned HTTP ${res.status}`);
      const data = await res.json();

      if (!data.isLivingOrganism) {
        setReidentifyError(data.refusalReason || 'The AI detected an inanimate object or human person.');
        return;
      }

      const returnedCandidates: Candidate[] = (data.candidates || []).map((c: any) => ({
        scientificName: c.scientificName,
        commonName: c.commonName,
        kind: c.kind,
        confidence: c.confidence,
        wikipediaTitle: c.wikipediaTitle,
        verified: Boolean(c.verified),
      }));

      await db.entries.update(id, {
        candidates: returnedCandidates,
      });
      setEntry((prev) => (prev ? { ...prev, candidates: returnedCandidates } : prev));
    } catch (err: any) {
      console.error('Re-identify error:', err);
      setReidentifyError(err.message || 'Failed to re-identify photo');
    } finally {
      setIsReidentifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-muted-foreground font-mono text-sm">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading specimen note...</span>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center space-y-4">
        <h1 className="text-xl font-bold text-foreground">Specimen Not Found</h1>
        <p className="text-xs text-muted-foreground max-w-xs">
          This observation entry could not be found in your local device records.
        </p>
        <Link
          href="/walk"
          className={buttonVariants({ variant: 'default' })}
        >
          Return to Walk
        </Link>
      </div>
    );
  }

  const isScene = entry.status === 'scene' && !entry.confirmed;
  const commonName =
    entry.confirmed?.commonName ||
    (isScene ? entry.caption?.trim() || 'Photo' : 'Unidentified Organism');
  const scientificName = entry.confirmed?.scientificName || 'Species incognita';
  const kind = entry.confirmed?.kind || 'organism';
  const formattedDate = new Date(entry.createdAt || entry.timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="paper-grain relative min-h-dvh bg-background pb-28 sm:pb-12 overflow-x-clip">
      <PageAmbience pageWidth={672} />
      {/* Top Navigation Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-10 sm:pt-24">
        <Link
          href="/walk"
          aria-label="Back to Walk"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'w-9 h-9 rounded-full'
          )}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>

        <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
          {commonName}
        </span>

        <span aria-hidden className="w-9" />
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* Hero Photo Container */}
        <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-muted/40 border border-border/80 shadow-md">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={commonName}
              className="w-full h-full object-cover select-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              No photo available
            </div>
          )}

          {/* Taxon Status Badge on Photo */}
          {!isScene && (
            <div className="absolute top-3 left-3">
              <Badge
                variant="secondary"
                className="capitalize text-xs backdrop-blur-md bg-background/80 border-border/80 shadow-sm"
              >
                {kind}
              </Badge>
            </div>
          )}
        </div>

        {/* Taxonomic Heading */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <TegakiText
              text={commonName}
              as="h1"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
            />
            {entry.verified && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/25 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Taxon
              </Badge>
            )}
          </div>
          {!isScene && (
            <p className="text-sm font-sans italic text-muted-foreground">
              {scientificName}
            </p>
          )}
        </div>

        {/* Observation Metadata Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{formattedDate}</span>
          </div>

          {entry.lat !== 0 && entry.lng !== 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>
                {entry.lat.toFixed(4)}°, {entry.lng.toFixed(4)}°
              </span>
            </div>
          )}

          {entry.accuracy > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60">
              <Compass className="w-3.5 h-3.5" />
              <span>±{Math.round(entry.accuracy)}m</span>
            </div>
          )}
        </div>

        {/* Grounded Natural History FactCard */}
        {!isScene && (
          <FactCard
            factsData={entry.facts}
            speciesName={commonName}
            isUnidentified={!entry.confirmed}
            isLoading={isFetchingFacts}
          />
        )}

        {/* Candidate Species Selection Card if unconfirmed */}
        {!entry.confirmed && !isScene && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground font-sans flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Candidate Species</span>
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReidentify}
                disabled={isReidentifying}
                className="gap-1.5 text-xs border-border hover:bg-muted"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isReidentifying && "animate-spin")} />
                <span>{isReidentifying ? "Analyzing..." : "Re-identify with AI"}</span>
              </Button>
            </div>

            {reidentifyError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {reidentifyError}
              </div>
            )}

            {entry.candidates && entry.candidates.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Tap a candidate below to confirm this organism:
                </p>
                <div className="flex flex-col gap-2">
                  {entry.candidates.map((cand, idx) => (
                    <Card
                      key={`${cand.scientificName}-${idx}`}
                      onClick={() => handleConfirmCandidate(cand)}
                      className="cursor-pointer border-border/80 hover:border-primary/60 hover:shadow-md transition-all active:scale-[0.99] group bg-card/60"
                    >
                      <CardHeader className="p-3.5 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <CardTitle className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                              {cand.commonName}
                            </CardTitle>
                            <CardDescription className="text-xs font-sans italic text-muted-foreground">
                              {cand.scientificName}
                            </CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 capitalize",
                              cand.confidence === 'Likely'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : cand.confidence === 'Possible'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {cand.confidence}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3.5 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] capitalize border-border/60">
                            {cand.kind}
                          </Badge>
                          {cand.verified && (
                            <span className="flex items-center gap-1 text-[10px] text-primary">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified Taxon
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-primary group-hover:underline">
                          Confirm &rarr;
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-border/80 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No candidate species recorded yet.
                </p>
                <Button
                  size="sm"
                  onClick={handleReidentify}
                  disabled={isReidentifying}
                  className="gap-1.5 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Identification</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Field Voice Notes Section (Phase 4, per VOIC-01, D-01) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground font-sans">
              Field Observations
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsVoiceSheetOpen(true)}
              className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
            >
              <Mic className="w-3.5 h-3.5" />
              Add Voice Note
            </Button>
          </div>

          {entryNotes.length > 0 ? (
            <div className="space-y-2.5">
              {entryNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(note.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {note.duration ? (
                      <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
                        {note.duration}s
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-foreground leading-relaxed">
                    {note.transcript}
                  </p>

                  {note.audio && (
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePlayNote(note)}
                        className="h-8 gap-1.5 text-xs text-primary bg-primary/5 hover:bg-primary/10 px-2.5 rounded-lg"
                      >
                        {activePlayingNoteId === note.id ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            Pause Audio
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            Play Audio
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-border/80 text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                No voice notes recorded for this find yet.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Voice Recorder Bottom Sheet */}
      <VoiceRecorderSheet
        open={isVoiceSheetOpen}
        onOpenChange={setIsVoiceSheetOpen}
        walkId={entry.walkId}
        entryId={id}
      />
    </div>
  );
}

