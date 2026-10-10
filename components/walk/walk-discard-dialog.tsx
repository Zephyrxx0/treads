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
import { AlertTriangle } from 'lucide-react';

export interface WalkDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDiscard: () => void;
  onSaveAnyway: () => void;
  /** Why the walk counts as short: under a minute, or barely any ground covered */
  reason?: 'time' | 'distance';
}

export function WalkDiscardDialog({
  open,
  onOpenChange,
  onConfirmDiscard,
  onSaveAnyway,
  reason = 'time',
}: WalkDiscardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-border bg-card p-6 shadow-xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground font-sans">
              Discard Walk
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {reason === 'time'
              ? 'This walk was under 1 minute. Discard this test session without saving?'
              : 'You covered less than 25 m, and nothing was logged. Discard this session without saving?'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 pt-4 sm:flex-col sm:space-x-0">
          {/* Primary destructive action */}
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmDiscard}
            className="w-full h-11 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Discard Walk
          </Button>

          {/* Secondary preserve action */}
          <Button
            type="button"
            variant="outline"
            onClick={onSaveAnyway}
            className="w-full h-11 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted cursor-pointer"
          >
            Save Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
