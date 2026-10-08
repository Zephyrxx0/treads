'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, TreePine, Flower2, Sprout, Bird, Bug, Sparkles, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Entry } from '@/lib/db';
import { cn } from '@/lib/utils';

export interface UniqueSpecies {
  key: string;
  canonicalEntry: Entry;
  encounters: number;
  dates: number[];
  walkIds: string[];
}

export interface SpeciesCardProps {
  species: UniqueSpecies;
  className?: string;
}

function getKindIcon(kind: string) {
  switch (kind) {
    case 'tree':
      return TreePine;
    case 'flower':
      return Flower2;
    case 'plant':
      return Sprout;
    case 'bird':
      return Bird;
    case 'insect':
      return Bug;
    default:
      return Sparkles;
  }
}

export function SpeciesCard({ species, className }: SpeciesCardProps) {
  const { canonicalEntry, encounters } = species;
  const confirmed = canonicalEntry.confirmed;

  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let url: string | null = null;
    const photoSource = canonicalEntry.thumbnail || canonicalEntry.photo;

    if (photoSource instanceof Blob) {
      url = URL.createObjectURL(photoSource);
      setImageUrl(url);
    } else if (typeof photoSource === 'string') {
      setImageUrl(photoSource);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [canonicalEntry.photo, canonicalEntry.thumbnail]);

  const commonName = confirmed?.commonName || 'Unknown Organism';
  const scientificName = confirmed?.scientificName || 'Taxon unassigned';
  const kind = confirmed?.kind || 'other';
  const isVerified = canonicalEntry.verified || confirmed?.verified;
  const KindIcon = getKindIcon(kind);

  return (
    <Link href={`/entry/${canonicalEntry.id}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
      <Card
        className={cn(
          'overflow-hidden border border-border bg-card hover:border-[#F35C2B]/40 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5',
          className
        )}
      >
        {/* Photo Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={commonName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <KindIcon className="h-10 w-10 opacity-40" />
            </div>
          )}

          {/* Top Badges Floating Overlay */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
            <Badge
              variant="outline"
              className="bg-background/85 backdrop-blur-md border-border/80 text-[11px] font-sans font-medium capitalize gap-1 shadow-sm"
            >
              <KindIcon className="w-3 h-3 text-[#F35C2B]" />
              <span>{kind}</span>
            </Badge>

            {/* Encounter Counter Badge */}
            {encounters > 1 && (
              <Badge
                variant="default"
                className="bg-[#F35C2B] text-white font-mono text-[11px] font-semibold shadow-sm"
              >
                Seen {encounters}x
              </Badge>
            )}
          </div>
        </div>

        {/* Card Body */}
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans font-bold text-base text-foreground leading-snug line-clamp-2 group-hover:text-[#F35C2B] transition-colors">
                {commonName}
              </h3>
              <p className="font-serif italic text-xs text-muted-foreground truncate">
                {scientificName}
              </p>
            </div>

            {isVerified && (
              <Badge
                variant="success"
                className="shrink-0 text-[10px] px-1.5 py-0.5 gap-0.5"
                title="Verified biological taxon via Wikipedia"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span className="hidden sm:inline">Verified</span>
              </Badge>
            )}
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>First seen {new Date(species.dates[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="flex items-center gap-1 group-hover:text-foreground">
              <Eye className="w-3 h-3" />
              <span>Details</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

