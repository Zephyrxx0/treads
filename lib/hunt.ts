import type { Entry } from './db';

export type OrganismKind = 'tree' | 'flower' | 'plant' | 'bird' | 'insect' | 'fungus' | 'other';

export interface HuntTarget {
  id: string;
  kind: OrganismKind;
  count: number;
  label: string;
}

export interface DailyHunt {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  targets: HuntTarget[];
}

export interface TargetProgress {
  target: HuntTarget;
  current: number;
  completed: boolean;
}

export interface HuntProgress {
  hunt: DailyHunt;
  completed: boolean;
  targetProgress: TargetProgress[];
  matchingEntryIds: string[];
}

// 32-bit FNV-1a hash function for deterministic date seeding
export function hashDateString(dateStr: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    hash ^= dateStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

interface ChallengeTemplate {
  title: string;
  description: string;
  targets: Array<{ kind: OrganismKind; count: number; label: string }>;
}

const CHALLENGE_CATALOG: ChallengeTemplate[] = [
  {
    title: 'Canopy & Ground Cover',
    description: 'Look high and low. Identify one tree in the forest and spot an insect navigating the forest floor.',
    targets: [
      { kind: 'tree', count: 1, label: 'Tree' },
      { kind: 'insect', count: 1, label: 'Insect' },
    ],
  },
  {
    title: 'Botanical Duo',
    description: 'Notice the variety of flora around your path. Confirm two distinct plant or flower species.',
    targets: [
      { kind: 'plant', count: 1, label: 'Wild Plant' },
      { kind: 'flower', count: 1, label: 'Flower' },
    ],
  },
  {
    title: 'Feathers & Foliage',
    description: 'Listen for bird calls and watch the branches. Spot a wild bird and record a woodland tree.',
    targets: [
      { kind: 'bird', count: 1, label: 'Bird' },
      { kind: 'tree', count: 1, label: 'Tree' },
    ],
  },
  {
    title: 'Pollinator Patrol',
    description: 'Flowers attract active pollinators. Spot an insect inspecting a flowering blossom.',
    targets: [
      { kind: 'flower', count: 1, label: 'Blossom' },
      { kind: 'insect', count: 1, label: 'Pollinator' },
    ],
  },
  {
    title: 'Forest Floor Mycota',
    description: 'Fungi thrive near decomposing wood and mossy soils. Search for a fungus and an understory plant.',
    targets: [
      { kind: 'fungus', count: 1, label: 'Fungus' },
      { kind: 'plant', count: 1, label: 'Ground Plant' },
    ],
  },
  {
    title: 'Arboreal Study',
    description: 'Focus your gaze upward. Locate and distinguish two different tree varieties on your trail.',
    targets: [
      { kind: 'tree', count: 2, label: 'Trees' },
    ],
  },
  {
    title: 'Winged Companions',
    description: 'Keep your eyes peeled across open sky and dense canopies for local birdlife and pollinators.',
    targets: [
      { kind: 'bird', count: 1, label: 'Songbird / Raptor' },
      { kind: 'insect', count: 1, label: 'Insect' },
    ],
  },
  {
    title: 'Bloom & Bark',
    description: 'A study in texture and color. Record one flowering specimen and one ancient tree.',
    targets: [
      { kind: 'flower', count: 1, label: 'Flower' },
      { kind: 'tree', count: 1, label: 'Tree' },
    ],
  },
  {
    title: 'Green Tapestry',
    description: 'Notice the subtle variations in leaf shapes, fern fronds, and foliage along the wayside.',
    targets: [
      { kind: 'plant', count: 2, label: 'Flora Varieties' },
    ],
  },
  {
    title: 'Micro-Fauna Explorer',
    description: 'Small creatures tell big stories about local biodiversity. Find two different insect species.',
    targets: [
      { kind: 'insect', count: 2, label: 'Insects' },
    ],
  },
  {
    title: 'Shade & Spores',
    description: 'Damp shaded nooks harbor fascinating organisms. Discover a mushroom or bracket fungus and a nearby tree.',
    targets: [
      { kind: 'fungus', count: 1, label: 'Mushroom / Lichen' },
      { kind: 'tree', count: 1, label: 'Host Tree' },
    ],
  },
  {
    title: 'Avian Watch',
    description: 'Perched in trees, wading in water, or foraging in grass. Track down and observe two birds today.',
    targets: [
      { kind: 'bird', count: 2, label: 'Bird Encounters' },
    ],
  },
  {
    title: 'Wild Meadow Search',
    description: 'Wildflower meadows buzz with activity. Log two blooming flowers along your route.',
    targets: [
      { kind: 'flower', count: 2, label: 'Wildflowers' },
    ],
  },
  {
    title: 'Full Nature Spectrum',
    description: 'A comprehensive natural survey. Discover one flora specimen and one fauna specimen.',
    targets: [
      { kind: 'plant', count: 1, label: 'Botanical Find' },
      { kind: 'bird', count: 1, label: 'Avian Find' },
    ],
  },
];

/**
 * Returns today's deterministic daily challenge.
 * Uses local calendar date string (YYYY-MM-DD).
 */
export function getDailyHunt(dateStr?: string): DailyHunt {
  const localDate = dateStr || new Date().toLocaleDateString('en-CA');
  const hash = hashDateString(localDate);
  const templateIndex = hash % CHALLENGE_CATALOG.length;
  const template = CHALLENGE_CATALOG[templateIndex];

  return {
    id: `hunt-${localDate}`,
    date: localDate,
    title: template.title,
    description: template.description,
    targets: template.targets.map((t, idx) => ({
      id: `target-${localDate}-${idx}`,
      kind: t.kind,
      count: t.count,
      label: t.label,
    })),
  };
}

/**
 * Checks whether a timestamp (ms) falls on the specified local date (YYYY-MM-DD).
 */
export function isTimestampOnDate(timestamp: number, dateStr: string): boolean {
  const entryDate = new Date(timestamp).toLocaleDateString('en-CA');
  return entryDate === dateStr;
}

/**
 * Evaluates confirmed organism entries against today's hunt objectives.
 * Matches confirmed finds recorded between 00:00 and 23:59 on hunt.date.
 */
export function evaluateHuntProgress(hunt: DailyHunt, entries: Entry[]): HuntProgress {
  // Filter confirmed entries created on today's local date
  const todaysConfirmed = entries.filter((e) => {
    if (e.status !== 'confirmed' || !e.confirmed) return false;
    const ts = e.createdAt || e.timestamp;
    return isTimestampOnDate(ts, hunt.date);
  });

  const matchingEntryIds: string[] = [];
  const assignedEntryIds = new Set<string>();

  const targetProgress: TargetProgress[] = hunt.targets.map((target) => {
    let current = 0;

    for (const entry of todaysConfirmed) {
      if (assignedEntryIds.has(entry.id)) continue;

      const kind = entry.confirmed?.kind;
      if (kind === target.kind) {
        current += 1;
        assignedEntryIds.add(entry.id);
        matchingEntryIds.push(entry.id);
        if (current >= target.count) break;
      }
    }

    return {
      target,
      current,
      completed: current >= target.count,
    };
  });

  const completed = targetProgress.every((tp) => tp.completed);

  return {
    hunt,
    completed,
    targetProgress,
    matchingEntryIds,
  };
}
