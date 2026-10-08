import * as fs from 'fs';
import * as path from 'path';

interface Fixture {
  id: string;
  name: string;
  category: 'plant' | 'bird' | 'insect' | 'non-organism' | 'person';
  expectedScientificName: string | null;
  expectedCommonName: string;
  expectRefusal: boolean;
  description: string;
  imagePath: string;
  kind: string;
  mockCandidates?: Array<{
    scientificName: string;
    commonName: string;
    kind: string;
    confidence: 'Likely' | 'Possible' | 'Unsure';
    wikipediaTitle: string;
  }>;
}

const FIXTURES_DATA: Array<{
  id: string;
  name: string;
  category: 'plant' | 'bird' | 'insect' | 'non-organism' | 'person';
  scientificName: string | null;
  commonName: string;
  expectRefusal: boolean;
  kind: string;
  description: string;
  fileName: string;
  bgColor: string;
  emoji: string;
}> = [
  // 10 Plants
  {
    id: 'fix-01',
    name: 'White Oak',
    category: 'plant',
    scientificName: 'Quercus alba',
    commonName: 'White Oak',
    expectRefusal: false,
    kind: 'tree',
    description: 'Broad leaf with 7-9 rounded finger lobes, light grey bark, native to eastern North America.',
    fileName: 'quercus-alba.svg',
    bgColor: '#2d6a4f',
    emoji: '🌳',
  },
  {
    id: 'fix-02',
    name: 'Red Maple',
    category: 'plant',
    scientificName: 'Acer rubrum',
    commonName: 'Red Maple',
    expectRefusal: false,
    kind: 'tree',
    description: 'Deciduous tree with opposite leaves showing 3 palmate lobes and reddish twigs.',
    fileName: 'acer-rubrum.svg',
    bgColor: '#9d0208',
    emoji: '🍁',
  },
  {
    id: 'fix-03',
    name: 'Common Dandelion',
    category: 'plant',
    scientificName: 'Taraxacum officinale',
    commonName: 'Common Dandelion',
    expectRefusal: false,
    kind: 'flower',
    description: 'Bright yellow ray-flowered composite head atop a hollow leafless scape with basal rosette of serrated leaves.',
    fileName: 'taraxacum-officinale.svg',
    bgColor: '#e09f3e',
    emoji: '🌼',
  },
  {
    id: 'fix-04',
    name: 'Common Daisy',
    category: 'plant',
    scientificName: 'Bellis perennis',
    commonName: 'Common Daisy',
    expectRefusal: false,
    kind: 'flower',
    description: 'White ray florets surrounding a compact yellow disc center, spoon-shaped basal leaves.',
    fileName: 'bellis-perennis.svg',
    bgColor: '#588157',
    emoji: '🌸',
  },
  {
    id: 'fix-05',
    name: 'Eastern White Pine',
    category: 'plant',
    scientificName: 'Pinus strobus',
    commonName: 'Eastern White Pine',
    expectRefusal: false,
    kind: 'tree',
    description: 'Coniferous evergreen tree with flexible blue-green needles bundled in fascicles of five.',
    fileName: 'pinus-strobus.svg',
    bgColor: '#1b4332',
    emoji: '🌲',
  },
  {
    id: 'fix-06',
    name: 'White Clover',
    category: 'plant',
    scientificName: 'Trifolium repens',
    commonName: 'White Clover',
    expectRefusal: false,
    kind: 'plant',
    description: 'Trifoliate compound leaves with faint white crescent markings and spherical white floral heads.',
    fileName: 'trifolium-repens.svg',
    bgColor: '#40916c',
    emoji: '☘️',
  },
  {
    id: 'fix-07',
    name: 'Broadleaf Plantain',
    category: 'plant',
    scientificName: 'Plantago major',
    commonName: 'Broadleaf Plantain',
    expectRefusal: false,
    kind: 'plant',
    description: 'Oval basal leaves with prominent parallel veins and upright dense spike-like inflorescences.',
    fileName: 'plantago-major.svg',
    bgColor: '#52796f',
    emoji: '🌿',
  },
  {
    id: 'fix-08',
    name: 'Sunflower',
    category: 'plant',
    scientificName: 'Helianthus annuus',
    commonName: 'Sunflower',
    expectRefusal: false,
    kind: 'flower',
    description: 'Large radiating golden yellow head, rough heart-shaped leaves, tall thick stem.',
    fileName: 'helianthus-annuus.svg',
    bgColor: '#d4a373',
    emoji: '🌻',
  },
  {
    id: 'fix-09',
    name: 'Dog Rose',
    category: 'plant',
    scientificName: 'Rosa canina',
    commonName: 'Dog Rose',
    expectRefusal: false,
    kind: 'flower',
    description: 'Climbing wild rose shrub with curved prickles, pale pink to white five-petaled blossoms, and red hips.',
    fileName: 'rosa-canina.svg',
    bgColor: '#b56576',
    emoji: '🌹',
  },
  {
    id: 'fix-10',
    name: 'Common Ivy',
    category: 'plant',
    scientificName: 'Hedera helix',
    commonName: 'Common Ivy',
    expectRefusal: false,
    kind: 'plant',
    description: 'Evergreen climbing vine with glossy, palmately 3-5 lobed dark green leaves with pale veins.',
    fileName: 'hedera-helix.svg',
    bgColor: '#2d6a4f',
    emoji: '🍃',
  },

  // 6 Birds
  {
    id: 'fix-11',
    name: 'House Sparrow',
    category: 'bird',
    scientificName: 'Passer domesticus',
    commonName: 'House Sparrow',
    expectRefusal: false,
    kind: 'bird',
    description: 'Small stout passerine bird with grey crown, black bib, and rufous brown streaked back.',
    fileName: 'passer-domesticus.svg',
    bgColor: '#7f5539',
    emoji: '🐦',
  },
  {
    id: 'fix-12',
    name: 'American Robin',
    category: 'bird',
    scientificName: 'Turdus migratorius',
    commonName: 'American Robin',
    expectRefusal: false,
    kind: 'bird',
    description: 'Migratory thrush with rich reddish-orange breast, dark charcoal head, and yellow beak.',
    fileName: 'turdus-migratorius.svg',
    bgColor: '#bc4749',
    emoji: '🐦',
  },
  {
    id: 'fix-13',
    name: 'Rock Dove / Pigeon',
    category: 'bird',
    scientificName: 'Columba livia',
    commonName: 'Rock Dove',
    expectRefusal: false,
    kind: 'bird',
    description: 'Urban pigeon with slate-blue plumage, iridescent green-purple neck patch, and dual black wing bars.',
    fileName: 'columba-livia.svg',
    bgColor: '#6c757d',
    emoji: '🕊️',
  },
  {
    id: 'fix-14',
    name: 'American Crow',
    category: 'bird',
    scientificName: 'Corvus brachyrhynchos',
    commonName: 'American Crow',
    expectRefusal: false,
    kind: 'bird',
    description: 'All-black intelligent passerine with stout bill, glossy plumage, and fan-shaped tail.',
    fileName: 'corvus-brachyrhynchos.svg',
    bgColor: '#212529',
    emoji: '🦅',
  },
  {
    id: 'fix-15',
    name: 'Blue Jay',
    category: 'bird',
    scientificName: 'Cyanocitta cristata',
    commonName: 'Blue Jay',
    expectRefusal: false,
    kind: 'bird',
    description: 'Crested corvid with vivid sky-blue plumage, white breast, black necklace collar, and barred wings.',
    fileName: 'cyanocitta-cristata.svg',
    bgColor: '#0077b6',
    emoji: '🪶',
  },
  {
    id: 'fix-16',
    name: 'Great Tit',
    category: 'bird',
    scientificName: 'Parus major',
    commonName: 'Great Tit',
    expectRefusal: false,
    kind: 'bird',
    description: 'Distinctive woodland tit with glossy black crown, pure white cheeks, and yellow breast with central black stripe.',
    fileName: 'parus-major.svg',
    bgColor: '#e9c46a',
    emoji: '🐣',
  },

  // 6 Insects
  {
    id: 'fix-17',
    name: 'Seven-spotted Ladybird',
    category: 'insect',
    scientificName: 'Coccinella septempunctata',
    commonName: 'Seven-spotted Ladybird',
    expectRefusal: false,
    kind: 'insect',
    description: 'Convex red elytra bearing seven distinct black spots, black pronotum with white anterior corners.',
    fileName: 'coccinella-septempunctata.svg',
    bgColor: '#d90429',
    emoji: '🐞',
  },
  {
    id: 'fix-18',
    name: 'Western Honey Bee',
    category: 'insect',
    scientificName: 'Apis mellifera',
    commonName: 'Western Honey Bee',
    expectRefusal: false,
    kind: 'insect',
    description: 'Hairy golden-brown social bee with striped abdominal bands, pollen baskets on hind tibiae.',
    fileName: 'apis-mellifera.svg',
    bgColor: '#f4a261',
    emoji: '🐝',
  },
  {
    id: 'fix-19',
    name: 'Monarch Butterfly',
    category: 'insect',
    scientificName: 'Danaus plexippus',
    commonName: 'Monarch Butterfly',
    expectRefusal: false,
    kind: 'insect',
    description: 'Tawny orange wings with intricate black veins and double rows of white dots along outer margins.',
    fileName: 'danaus-plexippus.svg',
    bgColor: '#fb8500',
    emoji: '🦋',
  },
  {
    id: 'fix-20',
    name: 'Buff-tailed Bumblebee',
    category: 'insect',
    scientificName: 'Bombus terrestris',
    commonName: 'Buff-tailed Bumblebee',
    expectRefusal: false,
    kind: 'insect',
    description: 'Plump fuzzy bumblebee with two yellow-orange bands and a buff/whitish tail tip.',
    fileName: 'bombus-terrestris.svg',
    bgColor: '#ffb703',
    emoji: '🐝',
  },
  {
    id: 'fix-21',
    name: 'Red Admiral',
    category: 'insect',
    scientificName: 'Vanessa atalanta',
    commonName: 'Red Admiral',
    expectRefusal: false,
    kind: 'insect',
    description: 'Velvety dark brown butterfly with striking orange-red median diagonal bands and white apical spots.',
    fileName: 'vanessa-atalanta.svg',
    bgColor: '#9e2a2b',
    emoji: '🦋',
  },
  {
    id: 'fix-22',
    name: 'Housefly',
    category: 'insect',
    scientificName: 'Musca domestica',
    commonName: 'Housefly',
    expectRefusal: false,
    kind: 'insect',
    description: 'Grey dipteran fly with four longitudinal dark stripes on thorax and large reddish compound eyes.',
    fileName: 'musca-domestica.svg',
    bgColor: '#495057',
    emoji: '🪰',
  },

  // 4 Non-organisms (Refusal expected)
  {
    id: 'fix-23',
    name: 'Ceramic coffee mug',
    category: 'non-organism',
    scientificName: null,
    commonName: 'Ceramic coffee mug',
    expectRefusal: true,
    kind: 'object',
    description: 'Handcrafted ceramic mug filled with tea resting on a desk surface.',
    fileName: 'coffee-mug.svg',
    bgColor: '#457b9d',
    emoji: '☕',
  },
  {
    id: 'fix-24',
    name: 'Commuter bicycle',
    category: 'non-organism',
    scientificName: null,
    commonName: 'Commuter bicycle',
    expectRefusal: true,
    kind: 'object',
    description: 'Steel-frame two-wheeled commuter bicycle locked to an urban metal bike post.',
    fileName: 'commuter-bicycle.svg',
    bgColor: '#3d5a80',
    emoji: '🚲',
  },
  {
    id: 'fix-25',
    name: 'Wooden park bench',
    category: 'non-organism',
    scientificName: null,
    commonName: 'Wooden park bench',
    expectRefusal: true,
    kind: 'object',
    description: 'Slat-wood park bench with cast-iron frame positioned beside a paved footpath.',
    fileName: 'wooden-bench.svg',
    bgColor: '#8d5b4c',
    emoji: '🪑',
  },
  {
    id: 'fix-26',
    name: 'Smartphone screen',
    category: 'non-organism',
    scientificName: null,
    commonName: 'Smartphone screen',
    expectRefusal: true,
    kind: 'object',
    description: 'Glass touch display of a mobile phone displaying application icons.',
    fileName: 'smartphone-screen.svg',
    bgColor: '#2b2d42',
    emoji: '📱',
  },

  // 4 People (Refusal expected)
  {
    id: 'fix-27',
    name: 'Human face portrait',
    category: 'person',
    scientificName: null,
    commonName: 'Human face portrait',
    expectRefusal: true,
    kind: 'person',
    description: 'Close-up studio photographic portrait of an adult human face.',
    fileName: 'human-portrait.svg',
    bgColor: '#d4a373',
    emoji: '👤',
  },
  {
    id: 'fix-28',
    name: 'Selfie outdoors',
    category: 'person',
    scientificName: null,
    commonName: 'Selfie outdoors',
    expectRefusal: true,
    kind: 'person',
    description: 'Front-facing selfie capture of a hiker smiling outdoors on a woodland trail.',
    fileName: 'selfie-outdoors.svg',
    bgColor: '#e76f51',
    emoji: '🤳',
  },
  {
    id: 'fix-29',
    name: 'Person walking in park',
    category: 'person',
    scientificName: null,
    commonName: 'Person walking in park',
    expectRefusal: true,
    kind: 'person',
    description: 'Full-body photo of an adult pedestrian walking in a municipal botanical park.',
    fileName: 'person-walking.svg',
    bgColor: '#588157',
    emoji: '🚶',
  },
  {
    id: 'fix-30',
    name: 'Human hand',
    category: 'person',
    scientificName: null,
    commonName: 'Human hand',
    expectRefusal: true,
    kind: 'person',
    description: 'Close-up shot of an open human palm and fingers.',
    fileName: 'human-hand.svg',
    bgColor: '#e0a96d',
    emoji: '✋',
  },
];

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const evalDir = path.join(publicDir, 'eval-fixtures');
  const imgDir = path.join(evalDir, 'images');

  fs.mkdirSync(imgDir, { recursive: true });

  const fixtures: Fixture[] = FIXTURES_DATA.map((item) => {
    const imagePath = `/eval-fixtures/images/${item.fileName}`;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${item.bgColor}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${item.bgColor}" stop-opacity="1" />
    </linearGradient>
  </defs>
  <rect width="320" height="240" rx="16" fill="url(#grad)" />
  <rect x="8" y="8" width="304" height="224" rx="12" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
  <text x="160" y="95" font-size="52" text-anchor="middle" dominant-baseline="middle">${item.emoji}</text>
  <text x="160" y="150" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle">${item.name}</text>
  <text x="160" y="174" font-family="system-ui, -apple-system, serif" font-style="italic" font-size="12" fill="rgba(255,255,255,0.85)" text-anchor="middle">${item.scientificName ?? item.category.toUpperCase()}</text>
  <rect x="20" y="194" width="280" height="24" rx="6" fill="rgba(0,0,0,0.25)" />
  <text x="160" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="rgba(255,255,255,0.9)" text-anchor="middle">Fixture: ${item.id} • ${item.category}</text>
</svg>`;

    fs.writeFileSync(path.join(imgDir, item.fileName), svgContent, 'utf8');

    // Create realistic candidates if organism
    let mockCandidates: Fixture['mockCandidates'] = undefined;
    if (!item.expectRefusal && item.scientificName) {
      mockCandidates = [
        {
          scientificName: item.scientificName,
          commonName: item.commonName,
          kind: item.kind,
          confidence: 'Likely',
          wikipediaTitle: item.scientificName,
        },
        {
          scientificName: `${item.scientificName.split(' ')[0]} sp.`,
          commonName: `Related ${item.commonName}`,
          kind: item.kind,
          confidence: 'Possible',
          wikipediaTitle: item.scientificName.split(' ')[0],
        },
      ];
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      expectedScientificName: item.scientificName,
      expectedCommonName: item.commonName,
      expectRefusal: item.expectRefusal,
      description: item.description,
      imagePath,
      kind: item.kind,
      mockCandidates,
    };
  });

  const manifestPath = path.join(evalDir, 'fixtures.json');
  fs.writeFileSync(manifestPath, JSON.stringify(fixtures, null, 2), 'utf8');

  console.log(`✅ Generated ${fixtures.length} fixtures in ${manifestPath}`);
  console.log(`✅ Generated 30 SVG fixture images in ${imgDir}`);
}

main().catch((err) => {
  console.error('Fixture generation failed:', err);
  process.exit(1);
});
