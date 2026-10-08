import { POST } from '../app/api/identify/route';
import { NextRequest } from 'next/server';

async function runTests() {
  console.log('Testing /api/identify Route...');

  // Test 1: Missing image field -> 400
  console.log('\n--- 1. Testing missing image validation ---');
  const req1 = new NextRequest('http://localhost:3000/api/identify', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log('Status:', res1.status, 'Response:', data1);
  if (res1.status !== 400 || !data1.error) {
    throw new Error('Expected 400 Bad Request when image is missing!');
  }
  console.log('✓ Missing image rejected with 400.');

  // Test 2: Valid payload with mock fallback (when API key is unset or mocked)
  console.log('\n--- 2. Testing identification with image payload ---');
  const fakeBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
  const req2 = new NextRequest('http://localhost:3000/api/identify', {
    method: 'POST',
    body: JSON.stringify({
      image: fakeBase64,
      month: 5,
      lat: 42.3,
      lng: -71.1,
    }),
  });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log('Status:', res2.status, 'Success:', data2.success, 'Candidates count:', data2.candidates?.length);
  if (res2.status !== 200 || !data2.success) {
    throw new Error('Expected 200 OK from /api/identify!');
  }
  if (!Array.isArray(data2.candidates) || data2.candidates.length === 0) {
    throw new Error('Expected at least one candidate species in response!');
  }

  const firstCandidate = data2.candidates[0];
  console.log('Top candidate:', {
    commonName: firstCandidate.commonName,
    scientificName: firstCandidate.scientificName,
    confidence: firstCandidate.confidence,
    verified: firstCandidate.verified,
  });

  if (!firstCandidate.scientificName || !firstCandidate.confidence) {
    throw new Error('Candidate missing required scientificName or confidence!');
  }
  console.log('✓ Candidate schema confirmed.');

  // Test 3: Verify Rate Limit headers
  console.log('\n--- 3. Testing Rate Limit Headers ---');
  const limitHeader = res2.headers.get('X-RateLimit-Limit');
  const remainingHeader = res2.headers.get('X-RateLimit-Remaining');
  console.log(`X-RateLimit-Limit: ${limitHeader}, X-RateLimit-Remaining: ${remainingHeader}`);
  if (!limitHeader || !remainingHeader) {
    throw new Error('Expected rate limit headers in response!');
  }
  console.log('✓ Rate limit headers verified.');

  console.log('\n=============================================');
  console.log('✓ All /api/identify tests passed successfully!');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

