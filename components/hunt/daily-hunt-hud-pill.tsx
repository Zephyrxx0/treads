'use client';

import * as React from 'react';
import { Sparkles, Check, ChevronDown, Compass } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { HuntProgress } from '@/lib/hunt';

export interface DailyHuntHudPillProps {
  progress?: HuntProgress | null;
  className?: string;
}

export function DailyHuntHudPill({ progress, className }: DailyHuntHudPillProps) {
  if (!progress) return null;

  const { hunt, completed, targetProgress } = progress;
  const totalRequired = targetProgress.reduce((sum, tp) => sum + tp.target.count, 0);
  const totalCompleted = targetProgress.reduce((sum, tp) => sum + Math.min(tp.current, tp.target.count), 0);

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md shadow-md transition-all cursor-pointer',
          completed
            ? 'bg-amber-500/15 border border-amber-500/50 text-amber-600 dark:text-amber-400'
            : 'bg-background/90 border border-primary/40 text-foreground hover:bg-background',
          className
        )}
      >
        <Sparkles className={cn('w-3.5 h-3.5', completed ? 'text-amber-500 fill-amber-500' : 'text-primary')} />
        <span>Hunt: {totalCompleted}/{totalRequired}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        sideOffset={8}
        className="w-72 p-3 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl space-y-2.5 z-50 pointer-events-auto"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold font-sans text-foreground">
                {hunt.title}
              </p>
              {hunt.season && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono capitalize">
                  {hunt.season}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {hunt.difficulty ? `${hunt.difficulty} Challenge` : 'Field Challenge'} &bull; {hunt.date}
            </p>
          </div>
          {completed ? (
            <Badge variant="default" className="text-[10px] h-5 bg-amber-500 text-white">
              Done
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-5">
              {totalCompleted}/{totalRequired}
            </Badge>
          )}
        </div>

        <p className="font-sans text-[11px] text-muted-foreground leading-normal">
          {hunt.description}
        </p>

        {hunt.fieldTip && (
          <div className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2 text-[10px] text-muted-foreground">
            <Compass className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="leading-snug">
              <span className="font-semibold text-foreground">Tip: </span>
              {hunt.fieldTip}
            </p>
          </div>
        )}

        <div className="space-y-1 pt-1">
          {targetProgress.map((tp) => (
            <div
              key={tp.target.id}
              className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-muted/30"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]',
                    tp.completed ? 'bg-emerald-500 text-white' : 'bg-muted border border-border text-muted-foreground'
                  )}
                >
                  {tp.completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : tp.current}
                </div>
                <span className="font-medium text-foreground">
                  {tp.target.count}x {tp.target.label}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">
                {tp.current}/{tp.target.count}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
