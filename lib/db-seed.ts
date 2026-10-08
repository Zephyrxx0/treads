import { db, DEFAULT_SETTINGS, type Walk, type Entry, type Note, type UserSettings } from './db';

export async function clearDatabase(): Promise<void> {
  await Promise.all([
    db.walks.clear(),
    db.entries.clear(),
    db.notes.clear(),
    db.settings.clear(),
    db.speechCache.clear(),
  ]);
}

export async function seedDatabase(): Promise<{
  walk: Walk;
  entries: Entry[];
  notes: Note[];
  settings: UserSettings;
}> {
  await clearDatabase();

  const now = Date.now();
  const walkId = crypto.randomUUID();

  const walk: Walk = {
    id: walkId,
    startedAt: now - 3600_000,
    endedAt: now - 600_000,
    mode: 'free',
    routeLine: [
      [-73.968, 40.785],
      [-73.967, 40.786],
      [-73.965, 40.788],
      [-73.964, 40.789],
    ],
    trackPoints: [
      { lat: 40.785, lng: -73.968, accuracy: 8, timestamp: now - 3600_000 },
      { lat: 40.786, lng: -73.967, accuracy: 6, timestamp: now - 2700_000 },
      { lat: 40.788, lng: -73.965, accuracy: 7, timestamp: now - 1800_000 },
      { lat: 40.789, lng: -73.964, accuracy: 5, timestamp: now - 600_000 },
    ],
    distance: 1840,
  };

  const oakEntryId = crypto.randomUUID();
  const sparrowEntryId = crypto.randomUUID();
  const ladybirdEntryId = crypto.randomUUID();

  const entries: Entry[] = [
    {
      id: oakEntryId,
      walkId,
      createdAt: now - 3000_000,
      timestamp: now - 3000_000,
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%232e7d32"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="white">White Oak</text></svg>',
      lat: 40.7855,
      lng: -73.9675,
      accuracy: 6,
      status: 'confirmed',
      verified: true,
      confirmed: {
        scientificName: 'Quercus alba',
        commonName: 'White Oak',
        kind: 'tree',
        confidence: 'Likely',
        wikipediaTitle: 'Quercus_alba',
        verified: true,
      },
      candidates: [
        {
          scientificName: 'Quercus alba',
          commonName: 'White Oak',
          kind: 'tree',
          confidence: 'Likely',
          wikipediaTitle: 'Quercus_alba',
          verified: true,
        },
        {
          scientificName: 'Quercus macrocarpa',
          commonName: 'Bur Oak',
          kind: 'tree',
          confidence: 'Possible',
          wikipediaTitle: 'Quercus_macrocarpa',
          verified: true,
        },
      ],
      facts: {
        summary: 'Quercus alba, the white oak, is one of the preeminent hardwoods of eastern North America.',
        facts: [
          {
            sentenceNumber: 1,
            text: 'Quercus alba, the white oak, is one of the preeminent hardwoods of eastern and central North America.',
          },
          {
            sentenceNumber: 2,
            text: 'It is a long-lived oak native to eastern North America, from southern Quebec south to eastern Texas.',
          },
          {
            sentenceNumber: 3,
            text: 'Specimens are known to have lived over 450 years, with some ancient trees reaching 600 years.',
          },
        ],
        sourceUrl: 'https://en.wikipedia.org/wiki/Quercus_alba',
      },
    },
    {
      id: sparrowEntryId,
      walkId,
      createdAt: now - 2100_000,
      timestamp: now - 2100_000,
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%238d6e63"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="white">House Sparrow</text></svg>',
      lat: 40.787,
      lng: -73.966,
      accuracy: 7,
      status: 'confirmed',
      verified: true,
      confirmed: {
        scientificName: 'Passer domesticus',
        commonName: 'House Sparrow',
        kind: 'bird',
        confidence: 'Likely',
        wikipediaTitle: 'House_sparrow',
        verified: true,
      },
      candidates: [
        {
          scientificName: 'Passer domesticus',
          commonName: 'House Sparrow',
          kind: 'bird',
          confidence: 'Likely',
          wikipediaTitle: 'House_sparrow',
          verified: true,
        },
        {
          scientificName: 'Passer montanus',
          commonName: 'Eurasian Tree Sparrow',
          kind: 'bird',
          confidence: 'Possible',
          wikipediaTitle: 'Eurasian_tree_sparrow',
          verified: true,
        },
      ],
      facts: {
        summary: 'The house sparrow is a small bird of the sparrow family Passeridae, found across the globe.',
        facts: [
          {
            sentenceNumber: 1,
            text: 'The house sparrow is a bird of the sparrow family Passeridae, found in most parts of the world.',
          },
          {
            sentenceNumber: 2,
            text: 'It is a small bird that has a typical length of 16 cm (6.3 in) and a mass of 24–39.5 g (0.85–1.39 oz).',
          },
          {
            sentenceNumber: 3,
            text: 'House sparrows are strongly associated with human dwellings and can thrive in urban or rural settings.',
          },
        ],
        sourceUrl: 'https://en.wikipedia.org/wiki/House_sparrow',
      },
    },
    {
      id: ladybirdEntryId,
      walkId,
      createdAt: now - 1100_000,
      timestamp: now - 1100_000,
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23d32f2f"/><text x="50" y="55" font-size="11" text-anchor="middle" fill="white">7-Spot Ladybird</text></svg>',
      lat: 40.7885,
      lng: -73.9645,
      accuracy: 5,
      status: 'confirmed',
      verified: true,
      confirmed: {
        scientificName: 'Coccinella septempunctata',
        commonName: 'Seven-spotted Ladybird',
        kind: 'insect',
        confidence: 'Likely',
        wikipediaTitle: 'Coccinella_septempunctata',
        verified: true,
      },
      candidates: [
        {
          scientificName: 'Coccinella septempunctata',
          commonName: 'Seven-spotted Ladybird',
          kind: 'insect',
          confidence: 'Likely',
          wikipediaTitle: 'Coccinella_septempunctata',
          verified: true,
        },
        {
          scientificName: 'Harmonia axyridis',
          commonName: 'Harlequin Ladybird',
          kind: 'insect',
          confidence: 'Possible',
          wikipediaTitle: 'Harmonia_axyridis',
          verified: true,
        },
      ],
      facts: {
        summary: 'Coccinella septempunctata is the seven-spot ladybird, recognizable by seven black spots on red elytra.',
        facts: [
          {
            sentenceNumber: 1,
            text: 'Coccinella septempunctata, the seven-spot ladybird, is the most common ladybird in Europe.',
          },
          {
            sentenceNumber: 2,
            text: 'Its elytra are red, but punctuated with three black spots each, with one further spot spread over the junction of the two.',
          },
          {
            sentenceNumber: 3,
            text: 'Both adults and larvae are voracious predators of aphids, making them beneficial biological control agents.',
          },
        ],
        sourceUrl: 'https://en.wikipedia.org/wiki/Coccinella_septempunctata',
      },
    },
  ];

  const notes: Note[] = [
    {
      id: crypto.randomUUID(),
      walkId,
      entryId: oakEntryId,
      kind: 'voice',
      duration: 14,
      transcript: 'Observed mature white oak with deeply lobed leaves near the north trail junction.',
      createdAt: now - 2400_000,
    },
    {
      id: crypto.randomUUID(),
      walkId,
      kind: 'text',
      transcript: 'Brisk autumn morning walk. High bird activity along the hedgerow.',
      createdAt: now - 1200_000,
    },
  ];

  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    consentVersion: '1.0',
    consentTimestamp: now - 3600_000,
    storagePersisted: true,
  };

  await db.walks.put(walk);
  await db.entries.bulkPut(entries);
  await db.notes.bulkPut(notes);
  await db.settings.put(settings);

  return { walk, entries, notes, settings };
}
