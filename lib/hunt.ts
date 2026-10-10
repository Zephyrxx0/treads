import type { Entry } from './db';

export type OrganismKind = 'tree' | 'flower' | 'plant' | 'bird' | 'insect' | 'fungus' | 'animal' | 'other';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type HuntDifficulty = 'Gentle' | 'Moderate' | 'Explorer';

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
  season: Season;
  fieldTip: string;
  difficulty: HuntDifficulty;
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

export interface ChallengeTemplate {
  title: string;
  description: string;
  fieldTip: string;
  difficulty: HuntDifficulty;
  targets: Array<{ kind: OrganismKind; count: number; label: string }>;
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

/**
 * Determines ecological season based on date (Northern Hemisphere meteorological defaults).
 * Format: YYYY-MM-DD or defaults to local current date.
 */
export function getSeasonForDate(dateStr?: string): Season {
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      if (month >= 3 && month <= 5) return 'spring';
      if (month >= 6 && month <= 8) return 'summer';
      if (month >= 9 && month <= 11) return 'autumn';
      return 'winter';
    }
  }
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export const SPRING_CATALOG: ChallengeTemplate[] = [
  {
    title: 'The Vernal Chorus',
    description: 'Songbirds establish nesting territories as the morning mist burns off. Listen for vibrant calls in the branches and spot an early-leafing tree.',
    fieldTip: 'Birds sing most vigorously at dawn and dusk. Scan exposed high tree crowns and fence-lines for singing perches.',
    difficulty: 'Moderate',
    targets: [
      { kind: 'bird', count: 1, label: 'Songbird / Perched Avian' },
      { kind: 'tree', count: 1, label: 'Budding Tree' },
    ],
  },
  {
    title: 'The Ephemeral Bloom',
    description: 'Before the forest canopy closes, woodland wildflowers seize sunlight on the forest floor. Spot an early blooming wildflower and a foraging pollinator.',
    fieldTip: 'Look along sunny woodland edges and south-facing stream banks where the soil warms first.',
    difficulty: 'Explorer',
    targets: [
      { kind: 'flower', count: 1, label: 'Woodland Wildflower' },
      { kind: 'insect', count: 1, label: 'Spring Pollinator' },
    ],
  },
  {
    title: 'Tender Shoots',
    description: 'The understory bursts with fresh vitality. Distinguish two young wild plants or sprouting perennials pushing through the winter mulch.',
    fieldTip: 'Observe unfurling fiddleheads of ferns or tender nettles. Look for distinct leaf serrations and vein symmetry.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'plant', count: 2, label: 'Sprouting Herb or Fern' },
    ],
  },
  {
    title: 'Wind-Borne Catkins',
    description: 'Many deciduous trees flower before growing leaves to let the spring breeze carry their pollen. Observe two budding or catkin-bearing trees.',
    fieldTip: 'Oaks, willows, hazel, and birches hang slender tassel-like catkins. Look upward against the clear sky.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'tree', count: 2, label: 'Budding or Catkin Tree' },
    ],
  },
  {
    title: 'The Nectar Trail',
    description: 'Sun-warmed blossoms provide critical early forage for queen bumblebees and hoverflies. Log two blooming wildflowers.',
    fieldTip: 'Dandelions, violets, dead-nettles, and cherry blossoms are pollinator lifelines in early spring.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'flower', count: 2, label: 'Early Blossom' },
    ],
  },
  {
    title: 'Return of the Wayfarers',
    description: 'Warblers, swallows, and thrushes return on warm air currents. Track and observe two active birds along your trail.',
    fieldTip: 'Follow quick chirps along hedgerows and waterways where midges and insects are emerging.',
    difficulty: 'Moderate',
    targets: [
      { kind: 'bird', count: 2, label: 'Active Forager or Migrant' },
    ],
  },
  {
    title: 'The Thawing Forest Floor',
    description: 'Moist spring soils stir with insect life beneath ancient trees. Find an active insect and inspect a woodland tree.',
    fieldTip: 'Gently check beneath loose bark or damp stones (always replace stones carefully when done).',
    difficulty: 'Gentle',
    targets: [
      { kind: 'insect', count: 1, label: 'Forest Floor Arthropod' },
      { kind: 'tree', count: 1, label: 'Woodland Tree' },
    ],
  },
  {
    title: 'Spring Spore Hunters',
    description: 'Spring moisture fosters cup fungi and early wood decomposers. Locate a fungus nestled beside damp woodland flora.',
    fieldTip: 'Look near decaying birch trunks, moss hummocks, or shaded north-facing damp slopes.',
    difficulty: 'Explorer',
    targets: [
      { kind: 'fungus', count: 1, label: 'Spring Fungus / Lichen' },
      { kind: 'plant', count: 1, label: 'Moisture-Loving Flora' },
    ],
  },
];

export const SUMMER_CATALOG: ChallengeTemplate[] = [
  {
    title: 'The Solar Factory',
    description: 'In the height of summer, broadleaf crowns filter the sun into dappled cathedral light. Study two distinct mature trees.',
    fieldTip: 'Compare leaf margins—smooth vs lobed—and notice how trees arrange leaves to maximize sunlight capture.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'tree', count: 2, label: 'Mature Shade Tree' },
    ],
  },
  {
    title: 'The Meadow Bazaar',
    description: 'Tall summer grasses and sun-soaked meadows hum with vibrant life. Spot an insect pollinating or crawling on a wild flower.',
    fieldTip: 'Watch a single flower cluster motionless for 60 seconds; insects quickly emerge once stillness is restored.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'flower', count: 1, label: 'Wildflower Blossom' },
      { kind: 'insect', count: 1, label: 'Pollinator or Meadow Bug' },
    ],
  },
  {
    title: 'Hunters of the Thermals',
    description: 'Swifts, swallows, and raptors ride the summer updrafts while songbirds forage in the dense foliage. Spot two birds today.',
    fieldTip: 'Glance overhead above open meadows or tree lines where thermal columns lift soaring raptors and insect-eaters.',
    difficulty: 'Moderate',
    targets: [
      { kind: 'bird', count: 2, label: 'Aerial Forager or Songbird' },
    ],
  },
  {
    title: 'Dense Understory',
    description: 'Bracken, brambles, and wild herbs form an impenetrable mid-summer green wall. Document two varied wild plants.',
    fieldTip: 'Notice the difference in leaf thickness between deep shade dwellers and sunny path border plants.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'plant', count: 2, label: 'Summer Wild Herb or Shrub' },
    ],
  },
  {
    title: 'The High-Leaf Grazers',
    description: 'From tree crowns to soil, summer insects feed the forest ecosystem. Find one insect and examine its host tree.',
    fieldTip: 'Inspect the undersides of leaves for tiny caterpillars, leafhoppers, or beneficial ladybugs.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'tree', count: 1, label: 'Host Tree' },
      { kind: 'insect', count: 1, label: 'Canopy or Leaf Insect' },
    ],
  },
  {
    title: 'Colors of the Solstice',
    description: 'From clover to bellflowers, summer blooms flash vivid colors to attract specialized pollinators. Spot two blooming wildflowers.',
    fieldTip: 'Different flower shapes attract different guests—tubular bells favor long tongues, flat discs welcome beetles.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'flower', count: 2, label: 'Summer Blossom' },
    ],
  },
  {
    title: 'The Woodland Retreat',
    description: 'When midday heat peaks, birds seek cooler woodland shade. Document a bird sheltered in a leafy tree.',
    fieldTip: 'Follow chipping warning calls in the cool, shaded understory where birds rest between feedings.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'bird', count: 1, label: 'Sheltered Bird' },
      { kind: 'tree', count: 1, label: 'Canopy Shelter Tree' },
    ],
  },
  {
    title: 'Bracket Fungi of the Deep Woods',
    description: 'Hard bracket fungi and perennial polypores stand steady even in summer heat. Discover a fungus and record a nearby plant.',
    fieldTip: 'Look for perennial artist’s conks and birch polypores on dead standing snags in mature woodlands.',
    difficulty: 'Explorer',
    targets: [
      { kind: 'fungus', count: 1, label: 'Polypore or Bracket Fungus' },
      { kind: 'plant', count: 1, label: 'Understory Plant' },
    ],
  },
];

export const AUTUMN_CATALOG: ChallengeTemplate[] = [
  {
    title: 'The Amber Canopy',
    description: 'Chlorophyll recedes to reveal radiant carotenoids and fiery anthocyanins. Identify two distinct deciduous or evergreen trees.',
    fieldTip: 'Compare the brilliant ochres of beech and birch against the deep bronzes and russets of mature oaks.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'tree', count: 2, label: 'Autumnal Canopy Tree' },
    ],
  },
  {
    title: 'The Fungal Flush',
    description: 'Autumn rains and cooling temperatures trigger magnificent mushroom flushes. Search out a fungus and note the tree species beside it.',
    fieldTip: 'Look at the mossy base of veteran trees or forest clearings where decaying wood feeds mycelial networks.',
    difficulty: 'Moderate',
    targets: [
      { kind: 'fungus', count: 1, label: 'Cap Mushroom or Bracket' },
      { kind: 'tree', count: 1, label: 'Nurse or Host Tree' },
    ],
  },
  {
    title: 'The Seed-Cast Caravan',
    description: 'Plants distribute acorns, winged samaras, and burrs to secure the next generation. Confirm two seed-bearing plants or wild flora.',
    fieldTip: 'Look for burs that latch onto clothing, rose hips, or exploding seed pods along hedgerows.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'plant', count: 2, label: 'Seed-Bearing Wild Flora' },
    ],
  },
  {
    title: 'Autumn Flocks & Cache Gatherers',
    description: 'Jays, nuthatches, and squirrels hurriedly stash acorns and beechnuts for winter. Spot a foraging bird and record a woodland tree.',
    fieldTip: 'Listen for the rasping squawk of jays transporting nuts, or chickadees forming roving mixed foraging flocks.',
    difficulty: 'Moderate',
    targets: [
      { kind: 'bird', count: 1, label: 'Foraging Bird' },
      { kind: 'tree', count: 1, label: 'Nut or Berry Tree' },
    ],
  },
  {
    title: 'The Last Pollinators',
    description: 'Before the first hard frosts, flowering ivy and late asters provide a final feast. Spot an insect visiting autumn flora.',
    fieldTip: 'Flowering ivy on tree trunks or sunny brick walls is an autumn magnet for hoverflies, late bees, and red admiral butterflies.',
    difficulty: 'Explorer',
    targets: [
      { kind: 'flower', count: 1, label: 'Late Autumn Blossom' },
      { kind: 'insect', count: 1, label: 'Late Season Pollinator' },
    ],
  },
  {
    title: 'The Leaf-Litter Harvesters',
    description: 'Fallen leaves create a rich, sheltering blanket teeming with life. Locate two different insects or ground arthropods.',
    fieldTip: 'Search beneath decaying bark chips or near rock borders where ground beetles and millipedes seek damp warmth.',
    difficulty: 'Moderate',
    targets: [
      { kind: 'insect', count: 2, label: 'Litter Arthropod or Insect' },
    ],
  },
  {
    title: 'The Late Bloomers',
    description: 'Hardy wildflowers like goldenrod, asters, and thistle heads endure cold mornings. Document two flowering specimens.',
    fieldTip: 'Search sunny southward-facing trail berms that capture lingering autumn warmth throughout the afternoon.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'flower', count: 2, label: 'Late Meadow Flora' },
    ],
  },
  {
    title: 'Mycelial Architectures',
    description: 'The forest floor is connected by vast underground hyphal networks. Find a mushroom or puffball and an understory plant.',
    fieldTip: 'Follow damp stream gullies and shaded north slopes where humidity remains trapped beneath fallen foliage.',
    difficulty: 'Explorer',
    targets: [
      { kind: 'fungus', count: 1, label: 'Mushroom / Spore Body' },
      { kind: 'plant', count: 1, label: 'Woodland Ground Flora' },
    ],
  },
];

export const WINTER_CATALOG: ChallengeTemplate[] = [
  {
    title: 'Evergreen Bastions',
    description: 'When broadleaves stand bare, pines, firs, and yews keep the woods alive with deep emerald. Distinguish two evergreen or winter trees.',
    fieldTip: 'Examine whether needles grow in bundles (pines) or singly along the twig (spruces and firs).',
    difficulty: 'Gentle',
    targets: [
      { kind: 'tree', count: 2, label: 'Evergreen or Hardy Tree' },
    ],
  },
  {
    title: 'Winter Foragers',
    description: 'Small songbirds travel in mixed winter flocks to share the burden of finding seeds and overwintering insect larvae. Spot two birds.',
    fieldTip: 'Titmice and nuthatches creep head-first down tree trunks searching bark crevices. Look for sudden flutterings.',
    difficulty: 'Moderate',
    targets: [
      { kind: 'bird', count: 2, label: 'Hardy Winter Bird' },
    ],
  },
  {
    title: 'Shelter in the Frost',
    description: 'Dense spruce branches and hollow oaks provide vital windbreaks for wildlife. Spot a bird sheltering in or near a tree.',
    fieldTip: 'Check ivy-covered trunks—the dense evergreen foliage offers warmth and concealment from biting winds.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'bird', count: 1, label: 'Winter Resident Bird' },
      { kind: 'tree', count: 1, label: 'Shelter Tree or Snag' },
    ],
  },
  {
    title: 'The Lichen Cartographers',
    description: 'Lichens and crust fungi thrive on bare winter bark, unhindered by dense summer foliage. Discover a fungus or lichen on a tree.',
    fieldTip: 'Look for yellow xanthoria or pale green foliose lichens on tree bark—they signify clean, crisp air!',
    difficulty: 'Explorer',
    targets: [
      { kind: 'fungus', count: 1, label: 'Bark Lichen or Fungus' },
      { kind: 'tree', count: 1, label: 'Host Trunk' },
    ],
  },
  {
    title: 'Basal Rosettes',
    description: 'Many biennial wild plants hug the soil in flat green rosettes, surviving under snow until spring. Find two resilient wild plants.',
    fieldTip: 'Search along road verges and meadow edges for green dandelion, teasel, or mullein rosettes pressed flat against the earth.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'plant', count: 2, label: 'Overwintering Flora or Rosette' },
    ],
  },
  {
    title: 'Resilient Micro-Fauna',
    description: 'On mild winter afternoons, hardy winter gnats, spiderlings, and bark beetles become active. Discover an insect and a winter plant.',
    fieldTip: 'Look on south-facing tree trunks that absorb midday solar heat, or inspect the soil line beneath evergreens.',
    difficulty: 'Explorer',
    targets: [
      { kind: 'insect', count: 1, label: 'Overwintering Insect' },
      { kind: 'plant', count: 1, label: 'Cold-Hardy Plant' },
    ],
  },
  {
    title: 'The Winter Pantry',
    description: 'Rose hips, holly berries, and dried seed heads stand as crimson lanterns against gray wood. Document two wild plants or shrubs.',
    fieldTip: 'Hawthorn hedges and briars hold dried fruits that birds have not stripped yet.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'plant', count: 2, label: 'Berry Shrub or Winter Flora' },
    ],
  },
  {
    title: 'The Skeletal Canopy',
    description: 'With leaves shed, the true architectural branching patterns of deciduous trees are laid bare. Study two different tree species.',
    fieldTip: 'Notice the difference between the zigzag twigs of elm, the stout blunt twigs of ash, and the graceful drooping sprays of birch.',
    difficulty: 'Gentle',
    targets: [
      { kind: 'tree', count: 2, label: 'Deciduous Silhouette or Conifer' },
    ],
  },
];

export const SEASONAL_CATALOG: Record<Season, ChallengeTemplate[]> = {
  spring: SPRING_CATALOG,
  summer: SUMMER_CATALOG,
  autumn: AUTUMN_CATALOG,
  winter: WINTER_CATALOG,
};

/**
 * Universal catalog combining all challenges across seasons.
 */
export const CHALLENGE_CATALOG: ChallengeTemplate[] = [
  ...SPRING_CATALOG,
  ...SUMMER_CATALOG,
  ...AUTUMN_CATALOG,
  ...WINTER_CATALOG,
];

/**
 * Returns today's deterministic daily challenge.
 * Uses local calendar date string (YYYY-MM-DD) and matches the current season.
 */
export function getDailyHunt(dateStr?: string): DailyHunt {
  const localDate = dateStr || new Date().toLocaleDateString('en-CA');
  const season = getSeasonForDate(localDate);
  const catalog = SEASONAL_CATALOG[season];
  const hash = hashDateString(localDate);
  const templateIndex = hash % catalog.length;
  const template = catalog[templateIndex];

  return {
    id: `hunt-${localDate}`,
    date: localDate,
    title: template.title,
    description: template.description,
    season,
    fieldTip: template.fieldTip,
    difficulty: template.difficulty,
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
