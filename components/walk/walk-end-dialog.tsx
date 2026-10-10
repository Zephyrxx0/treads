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
import { Square } from 'lucide-react';

export interface WalkEndDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmEnd: () => void;
  onContinue: () => void;
}

export function WalkEndDialog({
  open,
  onOpenChange,
  onConfirmEnd,
  onContinue,
}: WalkEndDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-border bg-card p-6 shadow-xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-full bg-destructive/10">
              <Square className="w-5 h-5 fill-current text-destructive" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground font-sans">
              End Walk Session?
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Ready to finalize your walk and review your specimen field notes?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 pt-4 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmEnd}
            className="w-full h-11 text-xs font-semibold rounded-xl cursor-pointer"
          >
            End & Save Walk
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onContinue}
            className="w-full h-11 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Continue Walking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
