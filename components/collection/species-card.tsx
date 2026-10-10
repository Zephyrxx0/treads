'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, TreePine, Flower2, Sprout, Bird, Bug, PawPrint, Sparkles } from 'lucide-react';
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
    case 'animal':
      return PawPrint;
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

  const commonName = confirmed?.commonName || 'Unknown organism';
  const scientificName = confirmed?.scientificName || 'Taxon unassigned';
  const kind = confirmed?.kind || 'other';
  const isVerified = canonicalEntry.verified || confirmed?.verified;
  const KindIcon = getKindIcon(kind);

  return (
    <Link
      href={`/entry/${canonicalEntry.id}`}
      className={cn(
        'group flex flex-col rounded-[1.25rem] border border-border bg-card p-3 sm:p-3.5 shadow-none transition-all duration-300 hover:border-primary/50 hover:shadow-md group-hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {/* Square cutout for image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/50 bg-muted/30">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={commonName}
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <KindIcon className="h-10 w-10 opacity-30" strokeWidth={1.25} />
          </div>
        )}

        {/* Kind badge on top left */}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm border border-border/40 shadow-xs">
          <KindIcon className="h-3 w-3 text-primary" strokeWidth={1.75} />
          {kind}
        </span>

        {/* Encounters badge on bottom right */}
        {encounters > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground shadow-xs">
            &times;{encounters}
          </span>
        )}
      </div>

      {/* Under image: all other information */}
      <div className="pt-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="line-clamp-2 font-serif text-lg leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
              {commonName}
            </h3>
            {isVerified && (
              <span
                title="Verified identification"
                className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} aria-label="Verified" />
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs italic text-muted-foreground">{scientificName}</p>
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>First found</span>
          <span>
            {new Date(species.dates[0]).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
