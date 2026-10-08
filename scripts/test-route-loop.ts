import { NextRequest } from 'next/server';
import { POST } from '../app/api/route/route';
import { generateSyntheticLoop, calculateLoopDistance } from '../lib/route';

async function runRouteTests() {
  console.log('Testing /api/route Route & Synthetic Loop Utilities...\n');

  // 1. Synthetic Loop Geometry & Distance Verification
  console.log('--- 1. Testing Synthetic Loop Geometry & Distance ---');
  const centerLng = -122.4194;
  const centerLat = 37.7749;

  for (const targetMeters of [1000, 2000, 3000]) {
    const loop = generateSyntheticLoop(centerLng, centerLat, targetMeters);

    // Verify it's a closed loop
    const first = loop[0];
    const last = loop[loop.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new Error(`Synthetic loop is not closed for target ${targetMeters}m`);
    }

    // Verify distance is reasonably close to target (within 20% margin for organic variation)
    const distance = calculateLoopDistance(loop);
    const ratio = distance / targetMeters;
    console.log(
      `Target: ${targetMeters}m -> Measured: ${Math.round(distance)}m (Ratio: ${ratio.toFixed(2)}) Points: ${loop.length}`
    );

    if (ratio < 0.7 || ratio > 1.3) {
      throw new Error(`Synthetic loop distance ${distance}m deviates too far from target ${targetMeters}m`);
    }
  }
  console.log('✓ Synthetic loop generator produces valid closed polygons of expected distance.\n');

  // 2. Testing missing/invalid coordinates rejection
  console.log('--- 2. Testing Invalid Coordinate Validation ---');
  const invalidReq = new NextRequest('http://localhost:3000/api/route', {
    method: 'POST',
    body: JSON.stringify({ lng: 'invalid', lat: 37.7749 }),
    headers: { 'Content-Type': 'application/json' },
  });

  const invalidRes = await POST(invalidReq);
  console.log('Status:', invalidRes.status, 'Response:', await invalidRes.json());
  if (invalidRes.status !== 400) {
    throw new Error(`Expected status 400 for invalid coordinates, got ${invalidRes.status}`);
  }
  console.log('✓ Invalid coordinates rejected with 400.\n');

  // 3. Testing /api/route response structure (fallback when ORS_API_KEY unset)
  console.log('--- 3. Testing /api/route Synthetic Fallback Execution ---');
  const validReq = new NextRequest('http://localhost:3000/api/route', {
    method: 'POST',
    body: JSON.stringify({ lng: centerLng, lat: centerLat, distanceMeters: 2000 }),
    headers: { 'Content-Type': 'application/json' },
  });

  const validRes = await POST(validReq);
  const json = await validRes.json();
  console.log('Status:', validRes.status, 'Fallback Flag:', json.fallback);
  console.log('Returned points:', json.coordinates?.length, 'Distance:', json.distanceMeters);

  if (validRes.status !== 200) {
    throw new Error(`Expected status 200, got ${validRes.status}`);
  }
  if (!json.coordinates || json.coordinates.length < 10) {
    throw new Error('Expected valid coordinates array in response');
  }
  if (typeof json.distanceMeters !== 'number') {
    throw new Error('Expected numeric distanceMeters in response');
  }
  console.log('✓ /api/route successfully returns valid loop geometry.\n');

  // 4. Testing Rate Limit Headers
  console.log('--- 4. Testing Rate Limit Headers ---');
  const limit = validRes.headers.get('x-ratelimit-limit');
  const remaining = validRes.headers.get('x-ratelimit-remaining');
  console.log(`X-RateLimit-Limit: ${limit}, X-RateLimit-Remaining: ${remaining}`);
  if (!limit || !remaining) {
    throw new Error('Rate limit headers missing from response');
  }
  console.log('✓ Rate limit headers verified.\n');

  console.log('All /api/route tests passed successfully!');
}

runRouteTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

