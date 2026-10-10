'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry } from '@/lib/db';
import { getDailyHunt, evaluateHuntProgress, OrganismKind } from '@/lib/hunt';
import { DailyHuntCard } from '@/components/hunt/daily-hunt-card';
import { SpeciesCard, UniqueSpecies } from '@/components/collection/species-card';
import { CollectionFilterBar, SortOption, CategoryCount } from '@/components/collection/collection-filter-bar';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyFieldGuide } from '@/components/collection/empty-field-guide';
import { FigureEmptyState } from '@/components/hairline/figure-empty-state';

const ALL_KINDS: Array<{ kind: OrganismKind; label: string }> = [
  { kind: 'tree', label: 'Trees' },
  { kind: 'flower', label: 'Flowers' },
  { kind: 'plant', label: 'Plants' },
  { kind: 'bird', label: 'Birds' },
  { kind: 'animal', label: 'Animals' },
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
    () => db.entries.where('status').anyOf(['confirmed', 'identified']).toArray()
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
      animal: 0,
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
    <PageShell
      eyebrow="Field collection"
      title="Life list"
      aside={`${uniqueSpeciesList.length} ${uniqueSpeciesList.length === 1 ? 'species' : 'species'}`}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <CollectionFilterBar
            selectedKind={selectedKind}
            onSelectKind={setSelectedKind}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categoryCounts={categoryCounts}
          />

          {filteredSpecies.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
              {filteredSpecies.map((species) => (
                <SpeciesCard key={species.key} species={species} />
              ))}
            </div>
          ) : uniqueSpeciesList.length === 0 ? (
            <FigureEmptyState
              split
              visual={<EmptyFieldGuide />}
              title="Your field guide is blank, for now"
              description="Record your first confirmed find on a walk and it will be kept here, once, with every time you meet it again."
            >
              <Link href="/walk" className={cn(buttonVariants({ size: 'lg' }), 'rounded-full px-6')}>
                Start a walk
              </Link>
            </FigureEmptyState>
          ) : (
            <div className="rounded-[1.75rem] border border-border bg-card p-10 text-center">
              <h2 className="font-serif text-2xl font-light">Nothing matches</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                Try another name, or clear the filters to see everything you have met.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 rounded-full"
                onClick={() => {
                  setSelectedKind('all');
                  setSearchQuery('');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>

        <aside className="order-first lg:sticky lg:top-24 lg:order-none">
          <DailyHuntCard progress={huntProgress} />
        </aside>
      </div>
    </PageShell>
  );
}
