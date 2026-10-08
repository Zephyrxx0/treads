'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Footprints, ArrowLeft, BookOpen, Compass, Sparkles } from 'lucide-react';
import { db, Entry } from '@/lib/db';
import { getDailyHunt, evaluateHuntProgress, OrganismKind } from '@/lib/hunt';
import { DailyHuntCard } from '@/components/hunt/daily-hunt-card';
import { SpeciesCard, UniqueSpecies } from '@/components/collection/species-card';
import { CollectionFilterBar, SortOption, CategoryCount } from '@/components/collection/collection-filter-bar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { MotionView } from '@/components/motion/motion-view';

const ALL_KINDS: Array<{ kind: OrganismKind; label: string }> = [
  { kind: 'tree', label: 'Trees' },
  { kind: 'flower', label: 'Flowers' },
  { kind: 'plant', label: 'Plants' },
  { kind: 'bird', label: 'Birds' },
  { kind: 'insect', label: 'Insects' },
  { kind: 'fungus', label: 'Fungi' },
  { kind: 'other', label: 'Other' },
];

export default function CollectionPage() {
  const [selectedKind, setSelectedKind] = React.useState<OrganismKind | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [sortBy, setSortBy] = React.useState<SortOption>('recent');

  // Query all confirmed entries reactively from Dexie
  const confirmedEntries = useLiveQuery(
    () => db.entries.where('status').equals('confirmed').toArray()
  ) || [];

  // Evaluate deterministic daily challenge against confirmed finds
  const dailyHunt = React.useMemo(() => getDailyHunt(), []);
  const huntProgress = React.useMemo(
    () => evaluateHuntProgress(dailyHunt, confirmedEntries),
    [dailyHunt, confirmedEntries]
  );

  // Group and de-duplicate entries into unique species (per D-06)
  const uniqueSpeciesList: UniqueSpecies[] = React.useMemo(() => {
    const map = new Map<string, UniqueSpecies>();

    for (const entry of confirmedEntries) {
      if (!entry.confirmed) continue;
      const key = entry.confirmed.wikipediaTitle || entry.confirmed.scientificName || entry.id;

      if (!map.has(key)) {
        map.set(key, {
          key,
          canonicalEntry: entry,
          encounters: 1,
          dates: [entry.createdAt || entry.timestamp],
          walkIds: [entry.walkId],
        });
      } else {
        const item = map.get(key)!;
        item.encounters += 1;
        item.dates.push(entry.createdAt || entry.timestamp);
        if (!item.walkIds.includes(entry.walkId)) {
          item.walkIds.push(entry.walkId);
        }
      }
    }

    return Array.from(map.values());
  }, [confirmedEntries]);

  // Compute category counts for filter pills
  const categoryCounts: CategoryCount[] = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: uniqueSpeciesList.length,
      tree: 0,
      flower: 0,
      plant: 0,
      bird: 0,
      insect: 0,
      fungus: 0,
      other: 0,
    };

    for (const sp of uniqueSpeciesList) {
      const k = sp.canonicalEntry.confirmed?.kind || 'other';
      if (counts[k] !== undefined) {
        counts[k] += 1;
      } else {
        counts.other += 1;
      }
    }

    return [
      { kind: 'all', label: 'All', count: counts.all },
      ...ALL_KINDS.map((k) => ({
        kind: k.kind,
        label: k.label,
        count: counts[k.kind] || 0,
      })),
    ];
  }, [uniqueSpeciesList]);

  // Filter and sort species list
  const filteredSpecies = React.useMemo(() => {
    let result = uniqueSpeciesList;

    // Filter by category
    if (selectedKind !== 'all') {
      result = result.filter(
        (sp) => sp.canonicalEntry.confirmed?.kind === selectedKind
      );
    }

    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((sp) => {
        const common = sp.canonicalEntry.confirmed?.commonName?.toLowerCase() || '';
        const scientific = sp.canonicalEntry.confirmed?.scientificName?.toLowerCase() || '';
        return common.includes(q) || scientific.includes(q);
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'recent') {
        const dateA = Math.max(...a.dates);
        const dateB = Math.max(...b.dates);
        return dateB - dateA;
      }
      if (sortBy === 'seen') {
        return b.encounters - a.encounters;
      }
      if (sortBy === 'alpha') {
        const nameA = a.canonicalEntry.confirmed?.commonName || '';
        const nameB = b.canonicalEntry.confirmed?.commonName || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [uniqueSpeciesList, selectedKind, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to overview"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#F35C2B]" />
                Life List
              </h1>
              <p className="font-serif text-xs text-muted-foreground hidden sm:block">
                Permanent Field Collection &bull; {uniqueSpeciesList.length} unique species
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/walk"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm'
              )}
            >
              <Footprints className="h-3.5 w-3.5 mr-1.5" />
              Start Walk
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
        {/* Daily Species Hunt Hero Widget (per D-04, HUNT-01, HUNT-02) */}
        <MotionView
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <DailyHuntCard progress={huntProgress} />
        </MotionView>

        {/* Search, Sort, and Category Filters (per D-05, D-07) */}
        <CollectionFilterBar
          selectedKind={selectedKind}
          onSelectKind={setSelectedKind}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categoryCounts={categoryCounts}
        />

        {/* Specimen Grid or Empty State */}
        {filteredSpecies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpecies.map((species) => (
              <SpeciesCard key={species.key} species={species} />
            ))}
          </div>
        ) : uniqueSpeciesList.length === 0 ? (
          /* Evocative Field Notebook Empty State (per D-08) */
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F35C2B]/10 text-[#F35C2B] mx-auto shadow-sm">
              <Compass className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-sans text-xl font-bold tracking-tight text-foreground">
                Your field ledger awaits its first discovery
              </h3>
              <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                Explore outdoors and record your first confirmed organism find to start your permanent life list.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/walk"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'bg-[#F35C2B] text-white hover:bg-[#F35C2B]/90 font-medium shadow-sm'
                )}
              >
                <Footprints className="h-4 w-4 mr-1.5" />
                Start a Walk
              </Link>
            </div>
          </div>
        ) : (
          /* Search / Filter Zero Results State */
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-2 max-w-md mx-auto my-8">
            <h3 className="font-sans text-base font-bold text-foreground">
              No matching species found
            </h3>
            <p className="font-serif text-xs text-muted-foreground">
              Try a different search term or select another category filter to find your specimens.
            </p>
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedKind('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

