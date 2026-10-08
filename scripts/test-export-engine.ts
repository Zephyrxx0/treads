import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { db } from '../lib/db';
import {
  sanitizeFilename,
  generateWalkFrontmatter,
  generateSpeciesFrontmatter,
  generateObsidianVaultZip,
} from '../lib/export';

async function runTests() {
  console.log('--- Testing Obsidian Vault Exporter Engine ---');

  // Test 1: Sanitize filenames
  const slug1 = sanitizeFilename('European Robin (Erithacus rubecula)');
  const slug2 = sanitizeFilename('Oak: Tree / English * 100%');
  console.assert(slug1 === 'european-robin-erithacus-rubecula', `Unexpected slug1: ${slug1}`);
  console.assert(slug2 === 'oak-tree-english-100', `Unexpected slug2: ${slug2}`);
  console.log('✓ Filename sanitization passed');

  // Test 2: Seed mock data in Dexie
  const walkId = 'walk-test-123';
  const startedAt = new Date('2026-10-08T10:00:00Z').getTime();
  const endedAt = new Date('2026-10-08T11:15:00Z').getTime();

  await db.walks.add({
    id: walkId,
    startedAt,
    endedAt,
    mode: 'loop',
    distance: 3500,
    trackPoints: [
      { lat: 51.5, lng: -0.1, accuracy: 10, timestamp: startedAt },
      { lat: 51.51, lng: -0.09, accuracy: 8, timestamp: endedAt },
    ],
  });

  const entryId = 'entry-test-456';
  await db.entries.add({
    id: entryId,
    walkId,
    createdAt: startedAt + 1200000,
    timestamp: startedAt + 1200000,
    photo: new Blob(['fake-jpeg-data'], { type: 'image/jpeg' }),
    lat: 51.505,
    lng: -0.095,
    accuracy: 9,
    status: 'confirmed',
    candidates: [],
    confirmed: {
      scientificName: 'Erithacus rubecula',
      commonName: 'European Robin',
      kind: 'bird',
      confidence: 'Likely',
      wikipediaTitle: 'European_robin',
      verified: true,
    },
    verified: true,
    facts: {
      summary: 'The European robin is a small insectivorous passerine bird.',
      facts: [{ sentenceNumber: 1, text: 'The robin has an orange breast.' }],
      sourceUrl: 'https://en.wikipedia.org/wiki/European_robin',
    },
  });

  await db.notes.add({
    id: 'note-test-789',
    walkId,
    kind: 'voice',
    audio: new Blob(['fake-webm-data'], { type: 'audio/webm' }),
    transcript: 'Heard high-pitched robin song in the brush.',
    createdAt: startedAt + 1300000,
  });

  console.log('✓ Seeded mock walk, confirmed entry, and voice note in Dexie');

  // Test 3: Generate ZIP Blob
  const zipBlob = await generateObsidianVaultZip((progress) => {
    // console.log(`  Export progress: ${progress.percent}% - ${progress.step}`);
  });

  console.assert(zipBlob instanceof Blob, 'Output must be a Blob');
  console.assert(zipBlob.size > 0, 'Zip blob must not be empty');
  console.log(`✓ Generated ZIP blob successfully (${zipBlob.size} bytes)`);

  // Test 4: Parse generated ZIP and verify file hierarchy
  const arrayBuffer = await zipBlob.arrayBuffer();
  const loadedZip = await JSZip.loadAsync(arrayBuffer);

  const files = Object.keys(loadedZip.files);
  console.log(`✓ Zip contains ${files.length} archive entries`);

  console.assert(files.includes('treads-backup.json'), 'Must contain treads-backup.json');
  console.assert(files.some((f) => f.startsWith('Walks/') && f.endsWith('.md')), 'Must contain Walks/*.md');
  console.assert(files.some((f) => f.startsWith('Species/') && f.endsWith('.md')), 'Must contain Species/*.md');
  console.assert(files.some((f) => f.startsWith('Media/') && f.endsWith('.jpg')), 'Must contain Media/*.jpg');
  console.assert(files.some((f) => f.startsWith('Media/') && f.endsWith('.webm')), 'Must contain Media/*.webm');

  // Verify Species Markdown frontmatter & contents
  const speciesFileKey = files.find((f) => f.startsWith('Species/') && f.endsWith('.md'))!;
  const speciesContent = await loadedZip.file(speciesFileKey)!.async('string');
  console.assert(speciesContent.includes('type: species'), 'Species file must contain frontmatter type: species');
  console.assert(speciesContent.includes('European Robin'), 'Species file must contain common name');
  console.assert(speciesContent.includes('![[Media/'), 'Species file must embed photo from Media/');

  // Verify Walk Markdown frontmatter & contents
  const walkFileKey = files.find((f) => f.startsWith('Walks/') && f.endsWith('.md'))!;
  const walkContent = await loadedZip.file(walkFileKey)!.async('string');
  console.assert(walkContent.includes('type: walk'), 'Walk file must contain frontmatter type: walk');
  console.assert(walkContent.includes('[[Species/'), 'Walk file must link to Species/');
  console.assert(walkContent.includes('![[Media/voice-note-'), 'Walk file must embed voice note');

  console.log('--- ALL OBSIDIAN EXPORT ENGINE TESTS PASSED ---');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

