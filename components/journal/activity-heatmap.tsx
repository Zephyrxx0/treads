'use client';

import * as React from 'react';
import { Flame, Route, Calendar, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Walk, Entry } from '@/lib/db';

export interface ActivityHeatmapProps {
  walks: Walk[];
  entries: Entry[];
  className?: string;
}

interface DayCell {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (Sun-Sat)
  walkCount: number;
  distanceMeters: number;
  speciesCount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ActivityHeatmap({ walks, entries, className }: ActivityHeatmapProps) {
  // Aggregate walks and species by local YYYY-MM-DD date
  const dayStatsMap = React.useMemo(() => {
    const map = new Map<string, { walkCount: number; distanceMeters: number; speciesSet: Set<string> }>();

    for (const walk of walks) {
      if (!walk.startedAt) continue;
      const dateKey = new Date(walk.startedAt).toLocaleDateString('en-CA');
      if (!map.has(dateKey)) {
        map.set(dateKey, { walkCount: 0, distanceMeters: 0, speciesSet: new Set() });
      }
      const stat = map.get(dateKey)!;
      stat.walkCount += 1;
      stat.distanceMeters += walk.distance || 0;
    }

    for (const entry of entries) {
      if (entry.status !== 'confirmed' || !entry.confirmed) continue;
      const dateKey = new Date(entry.createdAt || entry.timestamp).toLocaleDateString('en-CA');
      if (!map.has(dateKey)) {
        map.set(dateKey, { walkCount: 0, distanceMeters: 0, speciesSet: new Set() });
      }
      const stat = map.get(dateKey)!;
      const key = entry.confirmed.wikipediaTitle || entry.confirmed.scientificName || entry.id;
      stat.speciesSet.add(key);
    }

    return map;
  }, [walks, entries]);

  // Build 12-week grid ending today (84 days)
  const { weeks, activeDaysCount, currentStreak, totalDistanceKm } = React.useMemo(() => {
    const today = new Date();
    const cells: DayCell[] = [];

    // 12 weeks = 84 days
    const totalDays = 84;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayOfWeek = d.getDay();

      const stat = dayStatsMap.get(dateStr);
      const walkCount = stat ? stat.walkCount : 0;
      const distanceMeters = stat ? stat.distanceMeters : 0;
      const speciesCount = stat ? stat.speciesSet.size : 0;

      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (walkCount > 0 || speciesCount > 0) {
        if (distanceMeters > 5000 || speciesCount > 5) {
          intensity = 4;
        } else if (distanceMeters > 2500 || speciesCount >= 4) {
          intensity = 3;
        } else if (distanceMeters > 1000 || speciesCount >= 2) {
          intensity = 2;
        } else {
          intensity = 1;
        }
      }

      cells.push({
        dateStr,
        dayOfWeek,
        walkCount,
        distanceMeters,
        speciesCount,
        intensity,
      });
    }

    // Group into 7-day columns (weeks)
    const weeksList: DayCell[][] = [];
    let currentWeek: DayCell[] = [];

    // Align first week
    for (let i = 0; i < cells.length; i++) {
      currentWeek.push(cells[i]);
      if (currentWeek.length === 7 || i === cells.length - 1) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }
    }

    // Stats calculations
    let activeDays = 0;
    let totalMeters = 0;
    dayStatsMap.forEach((stat) => {
      if (stat.walkCount > 0 || stat.speciesSet.size > 0) activeDays += 1;
      totalMeters += stat.distanceMeters;
    });

    // Calculate current streak
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
      const k = checkDate.toLocaleDateString('en-CA');
      const s = dayStatsMap.get(k);
      if (s && (s.walkCount > 0 || s.speciesSet.size > 0)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Allow today to still be inactive without breaking streak if yesterday had activity
        if (streak === 0 && checkDate.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA')) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yk = checkDate.toLocaleDateString('en-CA');
          const ys = dayStatsMap.get(yk);
          if (ys && (ys.walkCount > 0 || ys.speciesSet.size > 0)) {
            streak += 1;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return {
      weeks: weeksList,
      activeDaysCount: activeDays,
      currentStreak: streak,
      totalDistanceKm: (totalMeters / 1000).toFixed(1),
    };
  }, [dayStatsMap]);

  return (
    <Card className={cn('overflow-hidden border border-border bg-card shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-sans font-bold text-foreground">
              Expedition Activity
            </CardTitle>
            <CardDescription className="text-xs font-serif text-muted-foreground">
              Past 12 weeks of outdoor walks and specimen sightings
            </CardDescription>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Flame className="w-3.5 h-3.5 text-[#F35C2B]" />
              <span className="font-mono font-semibold">{currentStreak}</span>
              <span className="text-muted-foreground font-sans">day streak</span>
            </Badge>

            <Badge variant="outline" className="gap-1 text-xs">
              <Route className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-mono font-semibold">{totalDistanceKm}</span>
              <span className="text-muted-foreground font-sans">km total</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Heatmap Grid Container with horizontal touch scroll */}
        <div className="overflow-x-auto pb-2 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="inline-flex flex-col gap-1.5 min-w-max">
            {/* Weekday rows (0=Sun to 6=Sat) */}
            {[1, 3, 5].map((rowDay) => (
              <div key={rowDay} className="flex items-center gap-1.5">
                <span className="w-6 text-[10px] font-mono text-muted-foreground text-right">
                  {DAY_LABELS[rowDay]}
                </span>
                <div className="flex items-center gap-1.5">
                  {weeks.map((week, weekIdx) => {
                    const cell = week.find((c) => c.dayOfWeek === rowDay);
                    if (!cell) {
                      return <div key={weekIdx} className="w-3.5 h-3.5 rounded-sm bg-transparent" />;
                    }

                    return (
                      <div
                        key={cell.dateStr}
                        title={`${cell.dateStr}: ${cell.walkCount} walk(s), ${(cell.distanceMeters / 1000).toFixed(1)}km, ${cell.speciesCount} species`}
                        className={cn(
                          'w-3.5 h-3.5 rounded-sm transition-colors cursor-pointer',
                          cell.intensity === 0 && 'bg-muted/40 hover:bg-muted/70',
                          cell.intensity === 1 && 'bg-[#F35C2B]/25 hover:bg-[#F35C2B]/35',
                          cell.intensity === 2 && 'bg-[#F35C2B]/50 hover:bg-[#F35C2B]/65',
                          cell.intensity === 3 && 'bg-[#F35C2B]/75 hover:bg-[#F35C2B]/85',
                          cell.intensity === 4 && 'bg-[#F35C2B] hover:bg-[#F35C2B]/90 shadow-xs'
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span className="font-serif">
            {activeDaysCount} active field day{activeDaysCount === 1 ? '' : 's'} recorded
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Less</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-muted/40" />
            <div className="w-2.5 h-2.5 rounded-xs bg-[#F35C2B]/25" />
            <div className="w-2.5 h-2.5 rounded-xs bg-[#F35C2B]/50" />
            <div className="w-2.5 h-2.5 rounded-xs bg-[#F35C2B]/75" />
            <div className="w-2.5 h-2.5 rounded-xs bg-[#F35C2B]" />
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

