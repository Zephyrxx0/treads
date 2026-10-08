import JSZip from 'jszip';
import { db, Walk, Entry, Note, UserSettings } from './db';

/**
 * Sanitizes a string into a safe filename for Obsidian and filesystem compatibility.
 * Removes characters forbidden in Obsidian links / paths: : / \ ? * < > " | # ^ [ ]
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .trim() || 'unnamed';
}

/**
 * Formats a Date or timestamp into YYYY-MM-DD local date string.
 */
function formatDateKey(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-CA');
}

/**
 * Formats a timestamp into HH:MM time string.
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Serializes walk metadata into Obsidian-compatible YAML frontmatter.
 */
export function generateWalkFrontmatter(
  walk: Walk,
  speciesWikiLinks: string[],
  notes: Note[]
): string {
  const dateStr = formatDateKey(walk.startedAt);
  const durationMin = walk.endedAt ? Math.round((walk.endedAt - walk.startedAt) / 60000) : 0;
  const distanceKm = (walk.distance / 1000).toFixed(2);

  const lines = [
    '---',
    'type: walk',
    `id: "${walk.id}"`,
    `date: ${dateStr}`,
    `started_at: "${new Date(walk.startedAt).toISOString()}"`,
    walk.endedAt ? `ended_at: "${new Date(walk.endedAt).toISOString()}"` : 'ended_at: null',
    `duration_minutes: ${durationMin}`,
    `distance_meters: ${walk.distance}`,
    `distance_km: ${distanceKm}`,
    `mode: ${walk.mode}`,
    'tags:',
    '  - treads',
    '  - treads/walk',
  ];

  if (speciesWikiLinks.length > 0) {
    lines.push('species:');
    speciesWikiLinks.forEach((link) => lines.push(`  - "${link}"`));
  } else {
    lines.push('species: []');
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Serializes species metadata into Obsidian-compatible YAML frontmatter.
 */
export function generateSpeciesFrontmatter(
  canonicalEntry: Entry,
  encounters: number,
  firstSeenTimestamp: number
): string {
  const confirmed = canonicalEntry.confirmed;
  const commonName = confirmed?.commonName || 'Unknown Organism';
  const scientificName = confirmed?.scientificName || '';
  const kind = confirmed?.kind || 'other';
  const firstSeenStr = formatDateKey(firstSeenTimestamp);

  const lines = [
    '---',
    'type: species',
    `common_name: "${commonName.replace(/"/g, '\\"')}"`,
    `scientific_name: "${scientificName.replace(/"/g, '\\"')}"`,
    `kind: ${kind}`,
    `verified: ${Boolean(canonicalEntry.verified || confirmed?.verified)}`,
    confirmed?.wikipediaTitle ? `wikipedia: "https://en.wikipedia.org/wiki/${confirmed.wikipediaTitle}"` : 'wikipedia: null',
    `first_seen: ${firstSeenStr}`,
    `encounters: ${encounters}`,
    'tags:',
    '  - treads',
    '  - treads/species',
    `  - nature/${kind}`,
  ];

  lines.push('---');
  return lines.join('\n');
}

export interface ExportProgress {
  percent: number;
  step: string;
}

/**
 * Generates the complete Obsidian Naturalist Vault as a downloadable ZIP Blob.
 */
export async function generateObsidianVaultZip(
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  onProgress?.({ percent: 5, step: 'Querying local database...' });

  const walks = await db.walks.toArray();
  const entries = await db.entries.toArray();
  const notes = await db.notes.toArray();
  const settings = await db.settings.toArray();

  const zip = new JSZip();
  const walksFolder = zip.folder('Walks')!;
  const speciesFolder = zip.folder('Species')!;
  const mediaFolder = zip.folder('Media')!;

  onProgress?.({ percent: 15, step: 'Creating database JSON dump...' });

  // 1. Root Raw Database Backup (treads-backup.json)
  const backupData = {
    exportedAt: new Date().toISOString(),
    version: 1,
    tables: {
      walks,
      entries: entries.map((e) => ({
        ...e,
        // serialize Blobs as base64 or placeholder for JSON dump
        photo: typeof e.photo === 'string' ? e.photo : '[binary blob saved in Media/]',
        thumbnail: typeof e.thumbnail === 'string' ? e.thumbnail : undefined,
      })),
      notes: notes.map((n) => ({
        ...n,
        audio: typeof n.audio === 'string' ? n.audio : '[binary audio saved in Media/]',
      })),
      settings,
    },
  };
  zip.file('treads-backup.json', JSON.stringify(backupData, null, 2));

  // 2. Media Asset Processing & Filename Registry
  onProgress?.({ percent: 30, step: 'Packaging photos and audio notes...' });

  const entryMediaFilenameMap = new Map<string, string>();
  const noteMediaFilenameMap = new Map<string, string>();

  // Process Entry Photos
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const confirmedName = entry.confirmed?.commonName || 'specimen';
    const slug = sanitizeFilename(confirmedName);
    const dateStr = formatDateKey(entry.createdAt || entry.timestamp).replace(/-/g, '');
    const filename = `${slug}-${dateStr}-${entry.id.slice(0, 6)}.jpg`;
    entryMediaFilenameMap.set(entry.id, filename);

    if (entry.photo instanceof Blob) {
      const buffer = await entry.photo.arrayBuffer();
      mediaFolder.file(filename, buffer);
    } else if (typeof entry.photo === 'string' && entry.photo.startsWith('data:image/')) {
      const base64Data = entry.photo.split(',')[1];
      if (base64Data) {
        mediaFolder.file(filename, base64Data, { base64: true });
      }
    }
  }

  // Process Voice Note Audio Clips
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (note.kind === 'voice' && note.audio) {
      const dateStr = formatDateKey(note.createdAt).replace(/-/g, '');
      const filename = `voice-note-${dateStr}-${note.id.slice(0, 6)}.webm`;
      noteMediaFilenameMap.set(note.id, filename);

      if (note.audio instanceof Blob) {
        const buffer = await note.audio.arrayBuffer();
        mediaFolder.file(filename, buffer);
      }
    }
  }

  onProgress?.({ percent: 55, step: 'Authoring Species markdown notes...' });

  // 3. De-duplicate species and author /Species/*.md
  const uniqueSpeciesMap = new Map<string, {
    canonicalEntry: Entry;
    encounters: number;
    dates: number[];
    entries: Entry[];
  }>();

  for (const entry of entries) {
    if (entry.status !== 'confirmed' || !entry.confirmed) continue;
    const key = entry.confirmed.wikipediaTitle || entry.confirmed.scientificName || entry.id;

    if (!uniqueSpeciesMap.has(key)) {
      uniqueSpeciesMap.set(key, {
        canonicalEntry: entry,
        encounters: 1,
        dates: [entry.createdAt || entry.timestamp],
        entries: [entry],
      });
    } else {
      const item = uniqueSpeciesMap.get(key)!;
      item.encounters += 1;
      item.dates.push(entry.createdAt || entry.timestamp);
      item.entries.push(entry);
    }
  }

  const speciesNameMap = new Map<string, string>(); // canonical key -> species file basename

  for (const [key, sp] of uniqueSpeciesMap.entries()) {
    const commonName = sp.canonicalEntry.confirmed?.commonName || 'Unknown Organism';
    const scientificName = sp.canonicalEntry.confirmed?.scientificName || '';
    const cleanBasename = sanitizeFilename(commonName);
    speciesNameMap.set(key, cleanBasename);

    const frontmatter = generateSpeciesFrontmatter(
      sp.canonicalEntry,
      sp.encounters,
      Math.min(...sp.dates)
    );

    const primaryPhotoFilename = entryMediaFilenameMap.get(sp.canonicalEntry.id);
    const facts = sp.canonicalEntry.facts;

    const markdownParts: string[] = [
      frontmatter,
      '',
      `# ${commonName}${scientificName ? ` (*${scientificName}*)` : ''}`,
      '',
    ];

    if (primaryPhotoFilename) {
      markdownParts.push(`![[Media/${primaryPhotoFilename}]]`, '');
    }

    if (facts?.summary) {
      markdownParts.push('## Field Summary', `> ${facts.summary}`, '');
    }

    if (facts?.facts && facts.facts.length > 0) {
      markdownParts.push('## Grounded Wikipedia Facts');
      facts.facts.forEach((f) => {
        markdownParts.push(`- [${f.sentenceNumber}] ${f.text}`);
      });
      markdownParts.push('');
    }

    if (facts?.sourceUrl) {
      markdownParts.push(`*Source: [Wikipedia](${facts.sourceUrl}) (CC BY-SA 4.0)*`, '');
    }

    markdownParts.push('## Sightings History');
    markdownParts.push(`Recorded **${sp.encounters}** time(s) across expeditions.`);
    sp.dates.sort().forEach((d) => {
      markdownParts.push(`- Spotted on ${formatDateKey(d)} at ${formatTime(d)}`);
    });

    speciesFolder.file(`${cleanBasename}.md`, markdownParts.join('\n'));
  }

  onProgress?.({ percent: 75, step: 'Authoring Walk expedition notes...' });

  // 4. Author /Walks/*.md
  for (const walk of walks) {
    const dateStr = formatDateKey(walk.startedAt);
    const walkTitle = `walk-${dateStr}-${walk.id.slice(0, 6)}`;
    const walkEntries = entries.filter((e) => e.walkId === walk.id && e.status === 'confirmed');
    const walkNotesList = notes.filter((n) => n.walkId === walk.id);

    const speciesLinks = walkEntries.map((e) => {
      const key = e.confirmed?.wikipediaTitle || e.confirmed?.scientificName || e.id;
      const fileBasename = speciesNameMap.get(key) || sanitizeFilename(e.confirmed?.commonName || 'specimen');
      return `[[Species/${fileBasename}]]`;
    });

    const frontmatter = generateWalkFrontmatter(walk, Array.from(new Set(speciesLinks)), walkNotesList);
    const durationMin = walk.endedAt ? Math.round((walk.endedAt - walk.startedAt) / 60000) : 0;
    const distanceKm = (walk.distance / 1000).toFixed(2);

    const markdownParts: string[] = [
      frontmatter,
      '',
      `# Walk Expedition: ${dateStr}`,
      '',
      `**Duration:** ${durationMin} min &bull; **Distance:** ${distanceKm} km &bull; **Finds:** ${walkEntries.length} confirmed`,
      '',
    ];

    if (walkEntries.length > 0) {
      markdownParts.push('## Specimen Finds');
      for (const entry of walkEntries) {
        const key = entry.confirmed?.wikipediaTitle || entry.confirmed?.scientificName || entry.id;
        const fileBasename = speciesNameMap.get(key) || sanitizeFilename(entry.confirmed?.commonName || 'specimen');
        const photoFile = entryMediaFilenameMap.get(entry.id);
        const commonName = entry.confirmed?.commonName || 'Organism';
        const timeStr = formatTime(entry.createdAt || entry.timestamp);

        markdownParts.push(`- [[Species/${fileBasename}|${commonName}]] — spotted at ${timeStr}`);
        if (photoFile) {
          markdownParts.push(`  ![[Media/${photoFile}]]`);
        }
      }
      markdownParts.push('');
    }

    if (walkNotesList.length > 0) {
      markdownParts.push('## Field Notes & Reflections');
      for (const note of walkNotesList) {
        const timeStr = formatTime(note.createdAt);
        const audioFile = noteMediaFilenameMap.get(note.id);

        if (note.kind === 'voice' && audioFile) {
          markdownParts.push(`### Voice Note (${timeStr})`);
          markdownParts.push(`![[Media/${audioFile}]]`);
          if (note.transcript) {
            markdownParts.push(`> "${note.transcript}"`);
          }
        } else if (note.transcript) {
          markdownParts.push(`### Note (${timeStr})`);
          markdownParts.push(`> "${note.transcript}"`);
        }
        markdownParts.push('');
      }
    }

    walksFolder.file(`${walkTitle}.md`, markdownParts.join('\n'));
  }

  onProgress?.({ percent: 90, step: 'Compressing archive...' });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.({
        percent: 90 + Math.round(metadata.percent * 0.1),
        step: `Compressing archive (${Math.round(metadata.percent)}%)...`,
      });
    }
  );

  onProgress?.({ percent: 100, step: 'Archive complete!' });
  return zipBlob;
}

/**
 * Initiates client-side file download via temporary anchor click.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
