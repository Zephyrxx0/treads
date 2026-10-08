import 'fake-indexeddb/auto';
import { db, DEFAULT_SETTINGS } from '../lib/db';
import { seedDatabase, clearDatabase } from '../lib/db-seed';

async function main() {
  console.log('Testing Dexie DB schema & operations...');

  // 1. Verify schema tables and indexes
  const tableNames = db.tables.map(t => t.name);
  console.log('Registered tables:', tableNames);
  const expectedTables = ['walks', 'entries', 'notes', 'settings', 'speechCache'];
  for (const name of expectedTables) {
    if (!tableNames.includes(name)) {
      throw new Error(`Missing expected table: ${name}`);
    }
  }

  // 2. Clear database
  await clearDatabase();
  const initialWalksCount = await db.walks.count();
  const initialEntriesCount = await db.entries.count();
  const initialNotesCount = await db.notes.count();
  const initialSettingsCount = await db.settings.count();
  if (initialWalksCount !== 0 || initialEntriesCount !== 0 || initialNotesCount !== 0 || initialSettingsCount !== 0) {
    throw new Error('Database clear failed to empty all tables');
  }
  console.log('Database clear verified.');

  // 3. Seed database
  const seeded = await seedDatabase();
  console.log(`Seeded walk ID: ${seeded.walk.id}`);
  console.log(`Seeded entries: ${seeded.entries.length}`);
  console.log(`Seeded notes: ${seeded.notes.length}`);

  // 4. Verify counts after seeding
  const walksCount = await db.walks.count();
  const entriesCount = await db.entries.count();
  const notesCount = await db.notes.count();
  const settingsCount = await db.settings.count();

  if (walksCount !== 1) throw new Error(`Expected 1 walk, got ${walksCount}`);
  if (entriesCount !== 3) throw new Error(`Expected 3 entries, got ${entriesCount}`);
  if (notesCount !== 2) throw new Error(`Expected 2 notes, got ${notesCount}`);
  if (settingsCount !== 1) throw new Error(`Expected 1 settings row, got ${settingsCount}`);

  // 5. Test index queries
  const oakEntry = await db.entries.where('walkId').equals(seeded.walk.id).first();
  if (!oakEntry) throw new Error('Failed to query entries by walkId index');

  const confirmedEntries = await db.entries.where('status').equals('confirmed').toArray();
  const verifiedEntries = await db.entries.filter(e => e.verified).toArray();
  if (confirmedEntries.length !== 3 || verifiedEntries.length !== 3) {
    throw new Error(`Expected 3 confirmed & verified entries, got ${confirmedEntries.length} / ${verifiedEntries.length}`);
  }
  console.log(`Indexed queries verified. Confirmed entries count: ${confirmedEntries.length}, verified count: ${verifiedEntries.length}`);

  const userSettings = await db.settings.get('user_settings');
  if (!userSettings || userSettings.consentVersion !== '1.0') {
    throw new Error('User settings not seeded properly');
  }
  console.log('User settings verified:', userSettings);

  // 6. Test clear again
  await clearDatabase();
  const finalCount = await db.walks.count();
  if (finalCount !== 0) throw new Error('Clear failed on second run');

  console.log('✅ Dexie Database Schema and Seed/Reset test passed successfully!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
