import 'fake-indexeddb/auto';
import { db } from '../lib/db';
import {
  startWalkSession,
  appendTrackPointToSession,
  endWalkSession,
  discardWalkSession,
  getActiveWalk,
  flushWalkBuffer,
} from '../hooks/use-active-walk';
import { TrackPoint } from '../lib/geo';

async function runTests() {
  console.log('🧪 Starting Active Walk Lifecycle & Auto-Resume Tests...\n');

  // Clean database before test
  await db.walks.clear();

  // Test 1: No active walk initially
  console.log('1. Testing initial state (no active walk)...');
  const initialActive = await getActiveWalk();
  if (initialActive !== undefined) {
    throw new Error(`Expected undefined active walk, got: ${JSON.stringify(initialActive)}`);
  }
  console.log('   ✅ Initial active walk is undefined');

  // Test 2: Start new walk session (WALK-01)
  console.log('2. Starting new walk session (WALK-01)...');
  const session = await startWalkSession('free');
  if (!session.id || typeof session.id !== 'string') {
    throw new Error('Expected session to have valid UUID id');
  }
  if (session.endedAt !== null) {
    throw new Error(`Expected session.endedAt to be null, got: ${session.endedAt}`);
  }
  if (session.trackPoints.length !== 0) {
    throw new Error('Expected new walk to have 0 trackPoints');
  }
  if (session.distance !== 0) {
    throw new Error('Expected new walk to have 0 distance');
  }
  console.log(`   ✅ Walk session created with ID: ${session.id}`);

  // Test 3: Auto-resume active walk lookup (WALK-02)
  console.log('3. Testing auto-resume lookup (WALK-02)...');
  const activeFound = await getActiveWalk();
  if (!activeFound || activeFound.id !== session.id) {
    throw new Error(`Expected to find active walk ${session.id}, got: ${activeFound?.id}`);
  }
  console.log('   ✅ Active walk session located in Dexie');

  // Test 4: Append track points and verify distance calculation (GPS-01, GPS-02)
  console.log('4. Appending track points and accumulating distance...');
  const point1: TrackPoint = {
    lat: 40.785091,
    lng: -73.968285,
    accuracy: 12,
    timestamp: Date.now(),
  };
  await appendTrackPointToSession(session.id, point1, { immediate: true });

  const point2: TrackPoint = {
    lat: 40.785500, // ~45.5 meters north
    lng: -73.968285,
    accuracy: 10,
    timestamp: Date.now() + 20000,
  };
  await appendTrackPointToSession(session.id, point2, { immediate: true });

  const updatedWalk = await db.walks.get(session.id);
  if (!updatedWalk) {
    throw new Error('Could not find updated walk record');
  }
  if (updatedWalk.trackPoints.length !== 2) {
    throw new Error(`Expected 2 track points, got: ${updatedWalk.trackPoints.length}`);
  }
  if (updatedWalk.distance < 40 || updatedWalk.distance > 50) {
    throw new Error(`Expected distance ~45m, got: ${updatedWalk.distance}m`);
  }
  console.log(`   ✅ Accumulated 2 points, distance: ${updatedWalk.distance}m`);

  // Test 5: End walk session (WALK-03)
  console.log('5. Ending walk session (WALK-03)...');
  const completed = await endWalkSession(session.id);
  if (!completed || completed.endedAt === null) {
    throw new Error('Expected completed walk to have non-null endedAt');
  }
  if (completed.distance !== updatedWalk.distance) {
    throw new Error('Expected distance to be preserved in completed walk');
  }
  console.log(`   ✅ Walk ended at: ${new Date(completed.endedAt).toISOString()}`);

  // Verify no active walk exists anymore
  const activeAfterEnd = await getActiveWalk();
  if (activeAfterEnd !== undefined) {
    throw new Error(`Expected no active walk after end, but found: ${activeAfterEnd.id}`);
  }
  console.log('   ✅ No active walk after ending session');

  // Test 6: Discard walk session (D-15)
  console.log('6. Testing discard short walk (D-15)...');
  const shortSession = await startWalkSession('free');
  const activeShort = await getActiveWalk();
  if (!activeShort || activeShort.id !== shortSession.id) {
    throw new Error('Failed to start short walk session');
  }

  await discardWalkSession(shortSession.id);
  const discardedInDb = await db.walks.get(shortSession.id);
  if (discardedInDb !== undefined) {
    throw new Error('Expected discarded walk to be removed from db.walks');
  }
  console.log('   ✅ Discarded walk purged cleanly from Dexie');

  console.log('\n🎉 ALL ACTIVE WALK TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});

