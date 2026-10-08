'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Compass, MapPin } from 'lucide-react';
import { db, Entry } from '@/lib/db';
import { FactCard, FactData } from '@/components/entry/fact-card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

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

  // On-demand fetch of facts if not yet populated
  useEffect(() => {
    if (!entry || entry.facts || isFetchingFacts) return;

    const title =
      entry.confirmed?.wikipediaTitle ||
      entry.confirmed?.scientificName ||
      entry.candidates?.[0]?.wikipediaTitle;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-muted-foreground font-mono text-sm">
          <span className="w-5 h-5 border-2 border-[#F35C2B] border-t-transparent rounded-full animate-spin" />
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

  const commonName = entry.confirmed?.commonName || 'Unidentified Organism';
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
    <div className="min-h-screen bg-background pb-12">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/60">
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

        <ThemeToggle />
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-5">
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
          <div className="absolute top-3 left-3">
            <Badge
              variant="secondary"
              className="capitalize text-xs backdrop-blur-md bg-background/80 border-border/80 shadow-sm"
            >
              {kind}
            </Badge>
          </div>
        </div>

        {/* Taxonomic Heading */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {commonName}
            </h1>
            {entry.verified && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs bg-[#F35C2B]/10 text-[#F35C2B] border border-[#F35C2B]/25 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Taxon
              </Badge>
            )}
          </div>
          <p className="text-sm font-serif italic text-muted-foreground">
            {scientificName}
          </p>
        </div>

        {/* Observation Metadata Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{formattedDate}</span>
          </div>

          {entry.lat !== 0 && entry.lng !== 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60">
              <MapPin className="w-3.5 h-3.5 text-[#F35C2B]" />
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
        <FactCard
          factsData={entry.facts}
          speciesName={commonName}
        />
      </main>
    </div>
  );
}

