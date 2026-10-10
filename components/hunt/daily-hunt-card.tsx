'use client';

import * as React from 'react';
import {
  Check,
  Sparkles,
  Sprout,
  Bird,
  Bug,
  TreePine,
  Flower2,
  Compass,
  Leaf,
  Sun,
  Wind,
  Snowflake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HuntProgress, Season } from '@/lib/hunt';
import { DailyHuntCelebrationDialog } from './daily-hunt-celebration-dialog';

export interface DailyHuntCardProps {
  progress: HuntProgress;
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
    case 'fungus':
      return Leaf;
    default:
      return Sparkles;
  }
}

function getSeasonIcon(season?: Season) {
  switch (season) {
    case 'spring':
      return Leaf;
    case 'summer':
      return Sun;
    case 'autumn':
      return Wind;
    case 'winter':
      return Snowflake;
    default:
      return Sparkles;
  }
}

export function DailyHuntCard({ progress, className }: DailyHuntCardProps) {
  const [showCelebration, setShowCelebration] = React.useState(false);
  const prevCompletedRef = React.useRef(progress.completed);

  // Trigger celebration dialog when completion transitions from false to true
  React.useEffect(() => {
    if (!prevCompletedRef.current && progress.completed) {
      setShowCelebration(true);
    }
    prevCompletedRef.current = progress.completed;
  }, [progress.completed]);

  const { hunt, completed, targetProgress } = progress;
  const SeasonIcon = getSeasonIcon(hunt.season);

  return (
    <>
      <section
        className={cn(
          'rounded-[1.5rem] border bg-card p-5 shadow-sm transition-colors',
          completed ? 'border-primary/60' : 'border-border',
          className
        )}
        aria-label="Daily species hunt"
      >
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Today&rsquo;s hunt</span>
            {hunt.season && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium tracking-wider text-primary capitalize">
                <SeasonIcon className="h-2.5 w-2.5" />
                {hunt.season}
              </span>
            )}
            {hunt.difficulty && (
              <span className="hidden sm:inline-block text-[9px] tracking-wider text-muted-foreground/75">
                &bull; {hunt.difficulty}
              </span>
            )}
          </div>
          {completed ? (
            <button
              type="button"
              onClick={() => setShowCelebration(true)}
              className="flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              <Check className="h-3 w-3" strokeWidth={2.5} /> Found
            </button>
          ) : (
            <span>{hunt.date}</span>
          )}
        </div>

        <h2 className="mt-4 font-serif text-2xl font-normal leading-tight tracking-tight">{hunt.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hunt.description}</p>

        {hunt.fieldTip && (
          <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Compass className="h-4 w-4 shrink-0 text-primary mt-0.5" strokeWidth={1.75} />
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">Field Lore: </span>
              {hunt.fieldTip}
            </p>
          </div>
        )}

        <ul className="mt-5 divide-y divide-border border-t border-border">
          {targetProgress.map((tp) => {
            const TargetIcon = getKindIcon(tp.target.kind);
            return (
              <li key={tp.target.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <TargetIcon
                    className={cn('h-4 w-4 shrink-0', tp.completed ? 'text-primary' : 'text-muted-foreground')}
                    strokeWidth={1.5}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tp.target.label}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{tp.target.kind}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: tp.target.count }).map((_, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-colors',
                        idx < tp.current
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {idx < tp.current ? <Check className="h-3 w-3" strokeWidth={3} /> : idx + 1}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <DailyHuntCelebrationDialog open={showCelebration} onOpenChange={setShowCelebration} hunt={hunt} />
    </>
  );
}
