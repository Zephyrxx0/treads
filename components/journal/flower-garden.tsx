'use client';

import * as React from 'react';
import { Flame, Route, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Walk, Entry } from '@/lib/db';
import { Bee } from '@/components/nature/insects';
import { Bloom } from '@/components/journal/garden-blooms';
import { HedgeLayer, type HedgeSlot } from '@/components/journal/garden-hedge';

export interface FlowerGardenProps {
  walks: Walk[];
  entries: Entry[];
  className?: string;
}

export type Stage = 0 | 1 | 2 | 3 | 4;
export type FlowerSpecies = 'orange' | 'purple' | 'pink';

export interface FlowerPaletteDef {
  id: FlowerSpecies;
  name: string;
  commonName: string;
  description: string;
  dotColor: string;
  stageColors: Record<1 | 2 | 3 | 4, string>;
  centerColor: string;
}

export const FLOWER_PALETTES: Record<FlowerSpecies, FlowerPaletteDef> = {
  orange: {
    id: 'orange',
    name: 'Field Marigold',
    commonName: 'Marigold',
    description: 'Glowing amber & deep saffron',
    dotColor: 'var(--heat-3, oklch(0.74 0.17 52))',
    stageColors: {
      1: 'var(--heat-1, oklch(0.9 0.07 80))',
      2: 'var(--heat-2, oklch(0.83 0.13 68))',
      3: 'var(--heat-3, oklch(0.74 0.17 52))',
      4: 'var(--heat-4, oklch(0.66 0.2 38))',
    },
    centerColor: 'var(--heat-center, oklch(0.96 0.06 95))',
  },
  purple: {
    id: 'purple',
    name: 'Wild Bellflower',
    commonName: 'Bellflower',
    description: 'Soft lavender & royal violet',
    dotColor: 'var(--purple-3, oklch(0.70 0.18 288))',
    stageColors: {
      1: 'var(--purple-1, oklch(0.88 0.07 296))',
      2: 'var(--purple-2, oklch(0.79 0.13 292))',
      3: 'var(--purple-3, oklch(0.70 0.18 288))',
      4: 'var(--purple-4, oklch(0.60 0.22 284))',
    },
    centerColor: 'var(--purple-center, oklch(0.93 0.12 88))',
  },
  pink: {
    id: 'pink',
    name: 'Prairie Rose',
    commonName: 'Wild Rose',
    description: 'Blush pink & crimson rose',
    dotColor: 'var(--pink-3, oklch(0.72 0.19 3))',
    stageColors: {
      1: 'var(--pink-1, oklch(0.90 0.07 355))',
      2: 'var(--pink-2, oklch(0.82 0.14 358))',
      3: 'var(--pink-3, oklch(0.72 0.19 3))',
      4: 'var(--pink-4, oklch(0.64 0.22 8))',
    },
    centerColor: 'var(--pink-center, oklch(0.94 0.10 92))',
  },
};

interface Day {
  dateStr: string;
  date: Date;
  walkCount: number;
  distanceMeters: number;
  speciesCount: number;
  stage: Stage;
  defaultSpecies: FlowerSpecies;
}

const WEEKS = 13;
const STAGE_NAMES = ['no walk', 'a few steps', 'a short walk', 'a good walk', 'a long walk'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL = 28;
const GAP = 4;
const MONTH_ROW = 20;

const SPECIES_CHOICES: Array<{
  id: 'all' | FlowerSpecies;
  title: string;
  color: string;
}> = [
  { id: 'all', title: 'Meadow (mixed species)', color: '' },
  ...(['orange', 'purple', 'pink'] as FlowerSpecies[]).map((id) => ({
    id,
    title: `${FLOWER_PALETTES[id].name} (${FLOWER_PALETTES[id].commonName})`,
    color: FLOWER_PALETTES[id].dotColor,
  })),
];

const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

export function getSpeciesForDay(dateStr: string, seed: number = 0): FlowerSpecies {
  const parts = dateStr.split('-').map(Number);
  const day = parts[2] || 1;
  const month = parts[1] || 1;
  const hash = Math.abs((month * 11 + day * 7 + seed) % 3);
  const speciesList: FlowerSpecies[] = ['orange', 'purple', 'pink'];
  return speciesList[hash];
}

interface BeeWaypoint {
  x: number;
  y: number;
}

interface GardenBeeProps {
  from: BeeWaypoint;
  to: BeeWaypoint;
  durationSec?: number;
  delaySec?: number;
}

/** A garden bee that hovers over a patch of blooms, collecting pollen and buzzing between flowers */
function GardenBee({ from, to, durationSec = 7.5, delaySec = 0 }: GardenBeeProps) {
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 13;

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={
        {
          left: 0,
          top: 0,
          '--x1': `${from.x}px`,
          '--y1': `${from.y}px`,
          '--x2': `${to.x}px`,
          '--y2': `${to.y}px`,
          '--mid-x': `${midX}px`,
          '--mid-y': `${midY}px`,
          '--dur': `${durationSec}s`,
          '--delay': `${delaySec}s`,
        } as React.CSSProperties
      }
    >
      <div className="animate-bee-pollinate">
        <div className="relative -ml-3 -mt-2.5">
          {/* Subtle ground shadow under the hovering bee */}
          <div className="absolute -bottom-1 left-2 h-1 w-2.5 rounded-full bg-black/25 blur-[1px]" />
          {/* Honeybee with vibrating wings */}
          <Bee className="h-3.5 w-5 drop-shadow-sm filter" />
          {/* Golden pollen dust sparkle as the bee harvests */}
          <span className="pointer-events-none absolute -bottom-0.5 right-1 h-1 w-1 rounded-full bg-amber-400 opacity-80 shadow-[0_0_4px_#f59e0b]" />
        </div>
      </div>
    </div>
  );
}

export function FlowerGarden({ walks, entries, className }: FlowerGardenProps) {
  // Debug stage overrides (clicking days to preview flowers)
  const [debugStages, setDebugStages] = React.useState<Record<string, Stage>>({});
  // Debug species overrides (shift/alt click)
  const [debugSpecies, setDebugSpecies] = React.useState<Record<string, FlowerSpecies>>({});
  // Global species filter for testing ('all' = mixed meadow)
  const [selectedSpecies, setSelectedSpecies] = React.useState<'all' | FlowerSpecies>('all');

  const stats = React.useMemo(() => {
    const map = new Map<string, { walkCount: number; distanceMeters: number; species: Set<string> }>();
    const slot = (key: string) => {
      if (!map.has(key)) map.set(key, { walkCount: 0, distanceMeters: 0, species: new Set() });
      return map.get(key)!;
    };
    for (const walk of walks) {
      if (!walk.startedAt) continue;
      const s = slot(new Date(walk.startedAt).toLocaleDateString('en-CA'));
      s.walkCount += 1;
      s.distanceMeters += walk.distance || 0;
    }
    for (const entry of entries) {
      if ((entry.status !== 'confirmed' && entry.status !== 'identified') || !entry.confirmed) continue;
      slot(new Date(entry.createdAt || entry.timestamp).toLocaleDateString('en-CA')).species.add(
        entry.confirmed.wikipediaTitle || entry.confirmed.scientificName || entry.id
      );
    }

    // Weeks run Sunday to Saturday, ending today like a contribution graph
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);
    const days: Day[] = [];
    for (const date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
      const d = new Date(date);
      const dateStr = d.toLocaleDateString('en-CA');
      const s = map.get(dateStr);
      const walkCount = s?.walkCount ?? 0;
      const distanceMeters = s?.distanceMeters ?? 0;
      const speciesCount = s?.species.size ?? 0;
      let stage: Stage = 0;
      if (walkCount > 0 || speciesCount > 0) {
        stage =
          distanceMeters > 5000 || speciesCount > 5
            ? 4
            : distanceMeters > 2500 || speciesCount >= 4
              ? 3
              : distanceMeters > 1000 || speciesCount >= 2
                ? 2
                : 1;
      }
      const defaultSpecies = getSpeciesForDay(dateStr);
      days.push({
        dateStr,
        date: d,
        walkCount,
        distanceMeters,
        speciesCount,
        stage,
        defaultSpecies,
      });
    }

    // Streak and active check that respects both real walks and previewed active days
    const isDayActive = (d: Day) => {
      const stage = debugStages[d.dateStr] ?? d.stage;
      return stage > 0 || d.walkCount > 0 || d.speciesCount > 0;
    };

    let streak = 0;
    let i = days.length - 1;
    if (!isDayActive(days[i])) i -= 1;
    while (i >= 0 && isDayActive(days[i])) {
      streak += 1;
      i -= 1;
    }

    // One block per month, starting on its own weekday
    const months: Array<{
      key: string;
      label: string;
      offset: number;
      cols: number;
      days: Array<{ day: Day; idx: number }>;
    }> = [];

    days.forEach((day) => {
      const key = `${day.date.getFullYear()}-${day.date.getMonth()}`;
      let m = months[months.length - 1];
      if (!m || m.key !== key) {
        m = {
          key,
          label: day.date.toLocaleDateString(undefined, { month: 'short' }),
          offset: day.date.getDay(),
          cols: 1,
          days: [],
        };
        months.push(m);
      }
      m.days.push({ day, idx: m.days.length });
    });

    months.forEach((m) => {
      m.cols = Math.ceil((m.offset + m.days.length) / 7);
    });

    return {
      days,
      months,
      streak,
      activeDays: days.filter(isDayActive).length,
      km: (days.reduce((n, d) => n + d.distanceMeters, 0) / 1000).toFixed(1),
    };
  }, [walks, entries, debugStages]);

  const [focus, setFocus] = React.useState<Day | null>(null);

  // Click day to cycle stage: 0 -> 1 -> 2 -> 3 -> 4 -> 0
  const cycleDebugStage = (d: Day, shiftKey = false) => {
    if (shiftKey) {
      // Shift-click cycles flower species
      setDebugSpecies((prev) => {
        const cur = prev[d.dateStr] ?? d.defaultSpecies;
        const next: FlowerSpecies = cur === 'orange' ? 'purple' : cur === 'purple' ? 'pink' : 'orange';
        return { ...prev, [d.dateStr]: next };
      });
      return;
    }
    setDebugStages((prev) => ({
      ...prev,
      [d.dateStr]: (((prev[d.dateStr] ?? d.stage) + 1) % 5) as Stage,
    }));
  };

  const getShownDay = (d: Day): Day => (d.dateStr in debugStages ? { ...d, stage: debugStages[d.dateStr] } : d);

  const getDayPalette = (d: Day): FlowerSpecies => {
    if (selectedSpecies !== 'all') return selectedSpecies;
    return debugSpecies[d.dateStr] ?? d.defaultSpecies;
  };

  const focused = focus ? getShownDay(focus) : null;
  const focusedPalette = focused ? getDayPalette(focused) : 'orange';
  const focusedSpeciesName = FLOWER_PALETTES[focusedPalette]?.name || 'Bloom';

  const caption = focused
    ? `${fmtDate(focused.date)} \u2014 ${
        focused.stage === 0
          ? 'no walk'
          : `${focusedSpeciesName} (${STAGE_NAMES[focused.stage]}): ${
              focus && focus.dateStr in debugStages && focused.walkCount === 0
                ? 'Preview'
                : `${focused.walkCount} walk${focused.walkCount === 1 ? '' : 's'}, ${(focused.distanceMeters / 1000).toFixed(1)} km, ${focused.speciesCount} species`
            }`
      }`
    : `${stats.activeDays} active day${stats.activeDays === 1 ? '' : 's'} in the past ${WEEKS} weeks`;

  return (
    <section
      className={cn('rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-7', className)}
      aria-label="Walking garden"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light leading-tight tracking-tight">Walking garden</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each day is a plot of ground. The longer the walk, the fuller the bloom with cozy leaves and pollinating
            bees.
          </p>
        </div>

        {/* Badges: Streaks and km total */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
            <Flame className="h-3.5 w-3.5 text-[var(--heat-4)]" />
            <span className="font-mono font-semibold tabular-nums">{stats.streak}</span>
            <span className="text-muted-foreground">day streak</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
            <Route className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono font-semibold tabular-nums">{stats.km}</span>
            <span className="text-muted-foreground">km total</span>
          </span>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto xl:overflow-x-visible pb-2 pt-1 px-1">
        <div className="mx-auto flex w-max gap-3" onMouseLeave={() => setFocus(null)}>
          <div
            aria-hidden="true"
            className="flex flex-col pr-1 text-[10px] leading-none text-muted-foreground"
            style={{ gap: GAP, paddingTop: MONTH_ROW }}
          >
            {WEEKDAYS.map((name) => (
              <span key={name} className="flex items-center" style={{ height: CELL }}>
                {name}
              </span>
            ))}
          </div>

          {/* Month blocks sit one grid gap apart, so the heatmap reads as one continuous garden */}
          <div className="flex" style={{ gap: GAP }}>
            {stats.months.map((m) => {
              // Find active flowers in this month to position pollinating bees
              const activeFlowerCoords: Array<{
                x: number;
                y: number;
                stage: Stage;
              }> = [];
              m.days.forEach(({ day: raw, idx }) => {
                const d = getShownDay(raw);
                if (d.stage > 0) {
                  const pos = m.offset + idx;
                  const col = Math.floor(pos / 7);
                  const row = pos % 7;
                  activeFlowerCoords.push({
                    x: col * (CELL + GAP) + CELL / 2,
                    y: row * (CELL + GAP) + CELL / 2,
                    stage: d.stage,
                  });
                }
              });

              // Bees patrol over active flower clusters
              const hasBlooms = activeFlowerCoords.length > 0;
              const bee1From = activeFlowerCoords[0] ?? {
                x: CELL / 2,
                y: CELL / 2,
              };
              const bee1To = activeFlowerCoords[1] ?? (hasBlooms ? { x: bee1From.x + 4, y: bee1From.y - 3 } : bee1From);

              const hasMultiBlooms = activeFlowerCoords.length >= 3;
              const bee2From = activeFlowerCoords[Math.min(2, activeFlowerCoords.length - 1)] ?? bee1From;
              const bee2To = activeFlowerCoords[Math.min(3, activeFlowerCoords.length - 1)] ?? bee1To;

              // Empty buffer slots in the month grid where dates don't fall (filled with cozy hedges)
              const hedgeSlots: HedgeSlot[] = [];
              for (let p = 0; p < m.cols * 7; p++) {
                if (p < m.offset || p >= m.offset + m.days.length) {
                  hedgeSlots.push({ col: Math.floor(p / 7), row: p % 7 });
                }
              }

              return (
                <div key={m.key} className="relative">
                  <p
                    aria-hidden="true"
                    className="text-[10px] leading-none text-muted-foreground"
                    style={{ height: MONTH_ROW }}
                  >
                    {m.label}
                  </p>

                  {/* Grid of days */}
                  <div
                    className="grid relative"
                    style={{
                      gap: GAP,
                      gridTemplateColumns: `repeat(${m.cols}, ${CELL}px)`,
                      gridTemplateRows: `repeat(7, ${CELL}px)`,
                    }}
                  >
                    {/* One continuous hedge across the empty plots, seen from above */}
                    <HedgeLayer
                      slots={hedgeSlots}
                      cols={m.cols}
                      rows={7}
                      cell={CELL}
                      gap={GAP}
                      className="pointer-events-none absolute left-0 top-0 z-0"
                    />

                    {/* Bees hovering and collecting pollen over the blooms */}
                    {hasBlooms && <GardenBee from={bee1From} to={bee1To} durationSec={7.2} delaySec={0} />}
                    {hasMultiBlooms && <GardenBee from={bee2From} to={bee2To} durationSec={9.5} delaySec={-4.2} />}

                    {m.days.map(({ day: raw, idx }) => {
                      const d = getShownDay(raw);
                      const pos = m.offset + idx;
                      const palette = getDayPalette(d);

                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={(e) => cycleDebugStage(raw, e.shiftKey)}
                          onMouseEnter={() => setFocus(raw)}
                          onFocus={() => setFocus(raw)}
                          onBlur={() => setFocus(null)}
                          aria-label={`${fmtDate(d.date)}: ${STAGE_NAMES[d.stage]}, ${d.walkCount} walks, ${d.speciesCount} species`}
                          className={cn(
                            'group relative z-10 rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            d.stage === 0 && 'bg-muted transition-[box-shadow] hover:ring-2 hover:ring-foreground/30'
                          )}
                          style={{
                            gridColumn: Math.floor(pos / 7) + 1,
                            gridRow: (pos % 7) + 1,
                          }}
                        >
                          {d.stage > 0 && (
                            <span className="pointer-events-none absolute -inset-[21%]">
                              <Bloom
                                stage={d.stage as Exclude<Stage, 0>}
                                seed={Number(d.dateStr.slice(-2))}
                                palette={palette}
                                colors={FLOWER_PALETTES[palette] ?? FLOWER_PALETTES.orange}
                              />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Species picker: a column of dots to the right of the heatmap */}
          <div
            role="group"
            aria-label="Flower species"
            className="flex flex-col items-center justify-center gap-1.5"
            style={{
              paddingTop: MONTH_ROW,
              height: MONTH_ROW + 7 * CELL + 6 * GAP,
            }}
          >
            {SPECIES_CHOICES.map(({ id, title, color }) => {
              const isSelected = selectedSpecies === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedSpecies(id)}
                  title={title}
                  aria-label={title}
                  aria-pressed={isSelected}
                  className={cn(
                    'group relative flex h-6 w-6 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring',
                    !isSelected && 'opacity-75 hover:opacity-100'
                  )}
                >
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
                      isSelected ? 'scale-[1.75]' : 'group-hover:scale-[1.4]',
                      id === 'all' && 'bg-gradient-to-b from-[var(--heat-3)] via-[var(--purple-3)] to-[var(--pink-3)]'
                    )}
                    style={id === 'all' ? undefined : { backgroundColor: color }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend & Caption */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
        <p className="min-h-4 font-serif text-xs" aria-live="polite">
          {caption}
        </p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="text-[10px]">Less</span>
          <span className="h-3 w-3 rounded-[3px] bg-muted" />
          {[1, 2, 3, 4].map((n) => {
            const currentColors =
              selectedSpecies === 'all'
                ? FLOWER_PALETTES.orange.stageColors
                : FLOWER_PALETTES[selectedSpecies].stageColors;
            return (
              <span
                key={n}
                className="h-3 w-3 rounded-[3px]"
                style={{ backgroundColor: currentColors[n as 1 | 2 | 3 | 4] }}
              />
            );
          })}
          <span className="text-[10px]">More</span>
        </div>
      </div>
    </section>
  );
}
