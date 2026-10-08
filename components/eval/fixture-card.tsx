'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import type { FixtureResult, EvalFixture } from '@/app/api/eval/run/route';

interface FixtureCardProps {
  fixture: EvalFixture;
  result?: FixtureResult;
}

export function FixtureCard({ fixture, result }: FixtureCardProps) {
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'plant':
        return <Badge className="bg-emerald-600 text-white text-[10px]">Plant</Badge>;
      case 'bird':
        return <Badge className="bg-sky-600 text-white text-[10px]">Bird</Badge>;
      case 'insect':
        return <Badge className="bg-amber-600 text-white text-[10px]">Insect</Badge>;
      case 'non-organism':
        return <Badge variant="outline" className="border-border text-foreground text-[10px]">Non-organism</Badge>;
      case 'person':
        return <Badge variant="destructive" className="text-[10px]">Person</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{category}</Badge>;
    }
  };

  const getStatusBadge = () => {
    if (!result) {
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground text-[10px]">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    }

    if (result.passed) {
      return (
        <Badge className="gap-1 bg-emerald-600 text-white text-[10px]">
          <CheckCircle2 className="w-3 h-3" />
          Pass
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1 text-[10px]">
        <XCircle className="w-3 h-3" />
        Fail
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden border-border/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
      <div>
        {/* Thumbnail Preview Header */}
        <div className="relative w-full h-32 bg-muted/40 overflow-hidden flex items-center justify-center border-b border-border/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fixture.imagePath}
            alt={fixture.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 flex gap-1">
            {getCategoryBadge(fixture.category)}
          </div>
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Card Body */}
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-xs text-foreground truncate">
              {fixture.name}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {fixture.id}
            </span>
          </div>

          <p className="font-serif italic text-[11px] text-muted-foreground truncate mt-0.5">
            {fixture.expectedScientificName ?? (fixture.expectRefusal ? 'Honest Refusal Expected' : 'Taxon unassigned')}
          </p>

          <p className="text-[11px] text-foreground/80 line-clamp-2 mt-1.5 leading-snug">
            {fixture.description}
          </p>
        </CardContent>
      </div>

      {/* Result Footer if evaluated */}
      {result && (
        <div className="px-3 py-2 bg-muted/30 border-t border-border/50 text-[10px] flex items-center justify-between text-muted-foreground">
          <span>{result.latencyMs}ms</span>
          {result.expectRefusal ? (
            <span className="flex items-center gap-1 text-primary">
              <ShieldAlert className="w-3 h-3" /> Refusal Verified
            </span>
          ) : (
            <span className="truncate max-w-[130px]">
              {result.candidates[0]?.scientificName ?? 'No match'}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
