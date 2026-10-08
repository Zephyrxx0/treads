'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DailyHunt } from '@/lib/hunt';
import { playHuntChime } from '@/lib/audio/cuelume';
import { triggerHuntWinHaptic } from '@/lib/haptics';

export interface DailyHuntCelebrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hunt: DailyHunt;
}

export function DailyHuntCelebrationDialog({
  open,
  onOpenChange,
  hunt,
}: DailyHuntCelebrationDialogProps) {
  React.useEffect(() => {
    if (open) {
      playHuntChime();
      triggerHuntWinHaptic();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 overflow-hidden">
        <DialogHeader className="text-center sm:text-center items-center space-y-2">
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
            <Sparkles className="w-3 h-3 mr-1" />
            Field Challenge Complete
          </Badge>

          <DialogTitle className="text-2xl font-bold font-sans tracking-tight text-foreground">
            {hunt.title}
          </DialogTitle>

          <DialogDescription className="font-serif text-sm text-muted-foreground max-w-xs mx-auto">
            You successfully fulfilled today&apos;s field objectives on {hunt.date}.
          </DialogDescription>
        </DialogHeader>

        {/* Celebratory Field Stamp Animation */}
        <div className="py-6 flex flex-col items-center justify-center">
          <AnimatePresence>
            <motion.div
              initial={{ scale: 2.2, rotate: -25, opacity: 0 }}
              animate={{ scale: 1, rotate: -6, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                mass: 0.8,
              }}
              className="relative flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-dashed border-[#F35C2B] bg-[#F35C2B]/10 p-4 shadow-lg shadow-[#F35C2B]/15"
            >
              <Award className="w-10 h-10 text-[#F35C2B] mb-1" />
              <span className="text-[11px] font-sans font-bold tracking-widest uppercase text-[#F35C2B]">
                VERIFIED
              </span>
              <span className="text-[9px] font-mono font-medium text-muted-foreground mt-0.5">
                {hunt.date}
              </span>
              <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-[#F35C2B] text-white text-[10px] font-semibold tracking-wide shadow-sm">
                HONOR BADGE
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fulfilled Target Checklist */}
        <div className="space-y-2 bg-muted/30 rounded-xl p-3.5 border border-border">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Completed Objectives
          </p>
          <div className="space-y-1.5">
            {hunt.targets.map((target) => (
              <div
                key={target.id}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-card border border-border/60"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="font-medium text-foreground">
                    {target.count}x {target.label}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {target.kind}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4 sm:justify-center">
          <DialogClose asChild>
            <Button
              className="w-full bg-[#F35C2B] hover:bg-[#F35C2B]/90 text-white font-medium shadow-sm"
            >
              Claim Daily Hunt Badge
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

