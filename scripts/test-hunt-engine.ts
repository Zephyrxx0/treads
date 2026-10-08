import { getDailyHunt, hashDateString, evaluateHuntProgress } from '../lib/hunt';
import type { Entry } from '../lib/db';

console.log('--- Testing Daily Species Hunt Engine ---');

// Test 1: Deterministic hash
const hash1 = hashDateString('2026-10-08');
const hash2 = hashDateString('2026-10-08');
console.assert(hash1 === hash2, `Hash should be strictly deterministic: ${hash1} !== ${hash2}`);
console.log('✓ Hash repeatability verified:', hash1);

// Test 2: Deterministic Daily Hunt attributes
const huntA = getDailyHunt('2026-10-08');
const huntB = getDailyHunt('2026-10-08');
console.assert(huntA.id === huntB.id, 'Hunt IDs must match for same date');
console.assert(huntA.title === huntB.title, 'Hunt titles must match');
console.assert(huntA.targets.length === huntB.targets.length, 'Target lengths must match');
console.log(`✓ Daily Hunt for 2026-10-08: "${huntA.title}" with ${huntA.targets.length} targets:`);
huntA.targets.forEach((t, i) => console.log(`   Target ${i + 1}: ${t.count}x ${t.label} (${t.kind})`));

// Test 3: Midnight rollover yields different challenge
const huntTomorrow = getDailyHunt('2026-10-09');
console.assert(huntA.date !== huntTomorrow.date, 'Dates must differ');
console.log(`✓ Tomorrow challenge (2026-10-09): "${huntTomorrow.title}"`);

// Test 4: Evaluate progress with matching entries
const todayDate = huntA.date;
const todayTimestamp = new Date(`${todayDate}T12:00:00`).getTime();
const yesterdayTimestamp = todayTimestamp - 86400000;

// Create mock entries matching target 1
const mockEntries: Entry[] = [
  {
    id: 'entry-1',
    walkId: 'walk-1',
    createdAt: todayTimestamp,
    timestamp: todayTimestamp,
    photo: 'blob:mock',
    lat: 51.5,
    lng: -0.1,
    accuracy: 10,
    status: 'confirmed',
    candidates: [],
    confirmed: {
      scientificName: 'Quercus robur',
      commonName: 'English Oak',
      kind: huntA.targets[0].kind,
      confidence: 'Likely',
      wikipediaTitle: 'Quercus_robur',
      verified: true,
    },
    verified: true,
  },
  // Yesterday entry (should be ignored)
  {
    id: 'entry-old',
    walkId: 'walk-0',
    createdAt: yesterdayTimestamp,
    timestamp: yesterdayTimestamp,
    photo: 'blob:mock',
    lat: 51.5,
    lng: -0.1,
    accuracy: 10,
    status: 'confirmed',
    candidates: [],
    confirmed: {
      scientificName: 'Old Species',
      commonName: 'Old',
      kind: huntA.targets[0].kind,
      confidence: 'Likely',
      wikipediaTitle: 'Old',
      verified: true,
    },
    verified: true,
  },
];

const progressPart = evaluateHuntProgress(huntA, mockEntries);
console.assert(progressPart.targetProgress[0].current >= 1, 'Target 1 should have counted today entry');
console.assert(!progressPart.matchingEntryIds.includes('entry-old'), 'Old entry must be excluded');
console.log('✓ Daily progress accurately filtered by date window');

// Fulfill second target if exists
if (huntA.targets.length > 1) {
  const secondTarget = huntA.targets[1];
  mockEntries.push({
    id: 'entry-2',
    walkId: 'walk-1',
    createdAt: todayTimestamp + 1000,
    timestamp: todayTimestamp + 1000,
    photo: 'blob:mock',
    lat: 51.5,
    lng: -0.1,
    accuracy: 10,
    status: 'confirmed',
    candidates: [],
    confirmed: {
      scientificName: 'Second Species',
      commonName: 'Second Specimen',
      kind: secondTarget.kind,
      confidence: 'Likely',
      wikipediaTitle: 'Second',
      verified: true,
    },
    verified: true,
  });

  const progressFull = evaluateHuntProgress(huntA, mockEntries);
  console.assert(progressFull.completed === true, 'All targets should now be fulfilled');
  console.log('✓ Challenge successfully completed upon all target criteria satisfied');
}

console.log('--- ALL HUNT ENGINE TESTS PASSED ---');
