'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2, FileQuestion, RotateCcw, Sparkles } from 'lucide-react';
import type { Candidate } from '@/lib/db';
import { playCaptureChime } from '@/lib/audio/cuelume';
import { triggerConfirmHaptic } from '@/lib/haptics';

export interface CandidatePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Candidate[];
  onConfirmCandidate: (candidate: Candidate) => void;
  onSaveUnidentified: () => void;
  onRetake: () => void;
}

export function CandidatePickerSheet({
  open,
  onOpenChange,
  candidates,
  onConfirmCandidate,
  onSaveUnidentified,
  onRetake,
}: CandidatePickerSheetProps) {
  const handleConfirm = (candidate: Candidate) => {
    playCaptureChime();
    triggerConfirmHaptic();
    onConfirmCandidate(candidate);
  };

  // Check if all candidates have low confidence ('Unsure')
  const allUnsure = candidates.length > 0 && candidates.every((c) => c.confidence === 'Unsure');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] flex flex-col gap-4 rounded-t-2xl border-t border-border bg-card p-6 shadow-2xl overflow-y-auto"
      >
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#F35C2B]/10 text-[#F35C2B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
              Candidate Species
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Tap the species that best matches your observation to confirm and generate Wikipedia facts.
          </SheetDescription>
        </SheetHeader>

        {/* Low Confidence Warning Notice if applicable */}
        {allUnsure && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 leading-snug">
            Lighting or angle makes this tricky. If none of these match, you can save as an unidentified specimen or retake the photo.
          </div>
        )}

        {/* Candidates List */}
        <div className="flex flex-col gap-3 py-1">
          {candidates.map((candidate, idx) => (
            <Card
              key={`${candidate.scientificName}-${idx}`}
              onClick={() => handleConfirm(candidate)}
              className="cursor-pointer border-border/80 hover:border-[#F35C2B]/60 hover:shadow-md transition-all active:scale-[0.99] group bg-card/60 backdrop-blur-xs"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold tracking-tight text-foreground group-hover:text-[#F35C2B] transition-colors">
                      {candidate.commonName}
                    </CardTitle>
                    <CardDescription className="text-xs font-serif italic text-muted-foreground">
                      {candidate.scientificName}
                    </CardDescription>
                  </div>

                  {/* Confidence Badge */}
                  <Badge
                    variant={
                      candidate.confidence === 'Likely'
                        ? 'secondary'
                        : candidate.confidence === 'Possible'
                        ? 'outline'
                        : 'outline'
                    }
                    className={`text-xs px-2 py-0.5 capitalize ${
                      candidate.confidence === 'Likely'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        : candidate.confidence === 'Possible'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {candidate.confidence}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] capitalize border-border/60">
                    {candidate.kind}
                  </Badge>
                  {candidate.verified && (
                    <Badge
                      variant="secondary"
                      className="text-[11px] flex items-center gap-1 bg-[#F35C2B]/10 text-[#F35C2B] border border-[#F35C2B]/20"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Taxon
                    </Badge>
                  )}
                </div>

                <span className="flex items-center gap-1 text-[11px] text-[#F35C2B] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Confirm <Check className="w-3 h-3" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fallback Action Buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={onRetake}
            className="flex-1 min-h-[44px] gap-2 text-foreground font-medium rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            Retake Photo
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onSaveUnidentified}
            className="flex-1 min-h-[44px] gap-2 text-foreground font-medium rounded-xl cursor-pointer"
          >
            <FileQuestion className="w-4 h-4 text-muted-foreground" />
            Save Unidentified
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

