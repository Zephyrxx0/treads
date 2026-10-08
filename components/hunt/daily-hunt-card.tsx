'use client';

import * as React from 'react';
import { Calendar, Check, Sparkles, Award, Compass, Sprout, Bird, Bug, TreePine, Flower2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HuntProgress } from '@/lib/hunt';
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

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden border transition-all duration-300',
          completed
            ? 'border-amber-500/50 bg-gradient-to-br from-card via-card to-amber-500/5 shadow-md shadow-amber-500/5'
            : 'border-border bg-card shadow-sm',
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 text-xs font-medium',
                  completed
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-[#F35C2B]/40 bg-[#F35C2B]/10 text-[#F35C2B]'
                )}
              >
                <Calendar className="w-3 h-3" />
                <span>{hunt.date}</span>
              </Badge>

              <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground">
                Daily Species Hunt
              </Badge>
            </div>

            {completed ? (
              <Badge
                variant="default"
                className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-xs cursor-pointer shadow-sm"
                onClick={() => setShowCelebration(true)}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Completed</span>
              </Badge>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                In Progress
              </span>
            )}
          </div>

          <CardTitle className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-foreground pt-1">
            {hunt.title}
          </CardTitle>

          <CardDescription className="font-serif text-sm text-muted-foreground leading-relaxed">
            {hunt.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Target Pips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {targetProgress.map((tp) => {
              const TargetIcon = getKindIcon(tp.target.kind);
              const isTargetComplete = tp.completed;

              return (
                <div
                  key={tp.target.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border transition-colors',
                    isTargetComplete
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-border bg-muted/20'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg shadow-sm',
                        isTargetComplete
                          ? 'bg-emerald-500 text-white'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <TargetIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-sans font-semibold text-foreground">
                        {tp.target.label}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {tp.target.kind} category
                      </p>
                    </div>
                  </div>

                  {/* Progress Pip Display */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: tp.target.count }).map((_, idx) => {
                      const isPipFilled = idx < tp.current;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all',
                            isPipFilled
                              ? 'bg-[#F35C2B] text-white border-[#F35C2B] shadow-sm'
                              : 'bg-muted/40 border-border text-muted-foreground'
                          )}
                        >
                          {isPipFilled ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {completed && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs font-serif text-muted-foreground italic">
                All daily field criteria satisfied. Your nature journal celebrates this sighting.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCelebration(true)}
                className="text-xs gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <Award className="w-3.5 h-3.5" />
                View Badge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DailyHuntCelebrationDialog
        open={showCelebration}
        onOpenChange={setShowCelebration}
        hunt={hunt}
      />
    </>
  );
}

