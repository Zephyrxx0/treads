import assert from 'node:assert';
import {
  calculateHaversineDistance,
  formatDistance,
  formatDuration,
  shouldRecordTrackPoint,
  calculateTrailBounds,
  type TrackPoint,
} from '../lib/geo';

console.log('--- Testing Geolocation Mathematical Engine ---');

// 1. Test Haversine Distance
// Central Park south (approx 40.7648, -73.9730) to north (approx 40.7968, -73.9555)
// Real distance is ~3.8 km (approx 3840m)
const d1 = calculateHaversineDistance(40.7648, -73.973, 40.7968, -73.9555);
console.log(`Calculated Central Park distance: ${d1.toFixed(1)}m`);
assert(d1 > 3700 && d1 < 4000, 'Haversine distance should match known coordinates (~3.8km)');

// Equator 1 degree longitude ~ 111.32 km
const dEquator = calculateHaversineDistance(0, 0, 0, 1);
assert(Math.abs(dEquator - 111319) < 200, 'Equator 1 deg longitude should be ~111.3km');
console.log('✓ Haversine distance calculations verified.');

// 2. Test Formatting
assert.strictEqual(formatDistance(450), '450 m');
assert.strictEqual(formatDistance(999.4), '999 m');
assert.strictEqual(formatDistance(1000), '1.00 km');
assert.strictEqual(formatDistance(3245), '3.25 km');
console.log('✓ Distance formatting verified.');

assert.strictEqual(formatDuration(45), '00:45');
assert.strictEqual(formatDuration(125), '02:05');
assert.strictEqual(formatDuration(3665), '01:01:05');
console.log('✓ Duration formatting verified.');

// 3. Test shouldRecordTrackPoint
const now = Date.now();
const initialPoint: TrackPoint = {
  lat: 40.785091,
  lng: -73.968285,
  accuracy: 10,
  timestamp: now,
};

// Initial point must be recorded
const res0 = shouldRecordTrackPoint(initialPoint, null);
assert.strictEqual(res0.record, true, 'Initial point must be accepted');

// Inaccurate point (> 35m) must be rejected
const inaccuratePoint: TrackPoint = {
  lat: 40.7851,
  lng: -73.9682,
  accuracy: 42,
  timestamp: now + 2000,
};
const resInaccurate = shouldRecordTrackPoint(inaccuratePoint, initialPoint);
assert.strictEqual(resInaccurate.record, false, 'Accuracy > 35m must be rejected');
assert.strictEqual(resInaccurate.reason, 'accuracy_too_low');
console.log('✓ Accuracy cutoff (> 35m) verified.');

// Stationary micro-jitter (< 5m displacement, < 15s) must be rejected
const jitterPoint: TrackPoint = {
  lat: 40.785093, // ~0.2m shift
  lng: -73.968284,
  accuracy: 8,
  timestamp: now + 5000, // 5s later
};
const resJitter = shouldRecordTrackPoint(jitterPoint, initialPoint);
assert.strictEqual(resJitter.record, false, 'Micro-jitter under 5m in < 15s must be rejected');
assert.strictEqual(resJitter.reason, 'stationary_jitter');
console.log('✓ Stationary micro-jitter suppression verified.');

// Stationary stop (> 15s elapsed) must be accepted
const stationaryStopPoint: TrackPoint = {
  lat: 40.785093, // ~0.2m shift
  lng: -73.968284,
  accuracy: 8,
  timestamp: now + 16000, // 16s later
};
const resStationary = shouldRecordTrackPoint(stationaryStopPoint, initialPoint);
assert.strictEqual(resStationary.record, true, 'Stationary position after 15s must be accepted');
console.log('✓ 15s stationary stop acceptance verified.');

// Legitimate movement (>= 5m displacement) must be accepted
// Move ~20 meters north (approx 0.00018 lat)
const movedPoint: TrackPoint = {
  lat: 40.78527,
  lng: -73.968285,
  accuracy: 12,
  timestamp: now + 8000, // 8s later
};
const resMoved = shouldRecordTrackPoint(movedPoint, initialPoint);
assert.strictEqual(resMoved.record, true, 'Displacement >= 5m must be accepted');
assert(resMoved.distanceFromLastMeters && resMoved.distanceFromLastMeters > 15, 'Distance should be calculated');
console.log('✓ Real movement displacement verified.');

// 4. Test calculateTrailBounds
const bounds = calculateTrailBounds([
  { lat: 40.78, lng: -73.98 },
  { lat: 40.8, lng: -73.95 },
  { lat: 40.79, lng: -73.96 },
]);
assert.deepStrictEqual(bounds, [
  [-73.98, 40.78],
  [-73.95, 40.8],
]);
assert.strictEqual(calculateTrailBounds([]), null);
console.log('✓ Trail bounding box computation verified.');

console.log('--- ALL GEOLOCATION TESTS PASSED ---');

