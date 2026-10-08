'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, FileQuestion, HelpCircle } from 'lucide-react';

export interface IdentificationRefusalCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refusalReason?: string;
  onRetake: () => void;
  onSaveUnidentified: () => void;
}

export function IdentificationRefusalCard({
  open,
  onOpenChange,
  refusalReason,
  onRetake,
  onSaveUnidentified,
}: IdentificationRefusalCardProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-card border border-border shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Organism not recognized
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {refusalReason ||
              'We noticed an inanimate object or human. Treads is designed to track living organisms in nature. Try a closer shot of leaves, bark, or wildlife.'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 my-2 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground leading-snug">
          Tip: Fill the viewfinder with the organism&apos;s distinguishing features: leaf veins, petals, bark texture, or plumage.
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveUnidentified}
            className="w-full sm:w-auto flex-1 min-h-[44px] text-foreground font-medium rounded-xl cursor-pointer"
          >
            <FileQuestion className="w-4 h-4 mr-2 text-muted-foreground" />
            Keep as Unidentified Note
          </Button>

          <Button
            type="button"
            onClick={onRetake}
            className="w-full sm:w-auto flex-1 min-h-[44px] bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white font-semibold rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 mr-2" />
            Retake Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
