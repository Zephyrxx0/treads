import { POST } from '../app/api/speak/route';
import { NextRequest } from 'next/server';
import { computeSpeechHash } from '../lib/speech';

async function runTests() {
  console.log('Testing /api/speak Route & Speech Utilities...');

  // 1. SHA-256 Text Hash determinism
  console.log('\n--- 1. Testing SHA-256 Speech Hash Determinism ---');
  const textA = 'European Robin is a small insectivorous passerine bird.';
  const hash1 = await computeSpeechHash(textA, 'rachel');
  const hash2 = await computeSpeechHash(textA.toUpperCase(), 'rachel');
  const hash3 = await computeSpeechHash(textA, 'daniel');

  console.log('Hash 1:', hash1);
  console.log('Hash 2 (case-insensitive):', hash2);
  console.log('Hash 3 (different voice):', hash3);

  if (hash1 !== hash2) {
    throw new Error('Expected normalized text hashes to match!');
  }
  if (hash1 === hash3) {
    throw new Error('Expected different voices to produce distinct hashes!');
  }
  console.log('✓ SHA-256 speech hashing is deterministic and normalized.');

  // 2. Missing text parameter -> 400
  console.log('\n--- 2. Testing missing text rejection ---');
  const req1 = new NextRequest('http://localhost:3000/api/speak', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log('Status:', res1.status, 'Response:', data1);
  if (res1.status !== 400 || !data1.error) {
    throw new Error('Expected 400 when text is missing!');
  }
  console.log('✓ Missing text rejected with 400.');

  // 3. Fallback response when ELEVENLABS_API_KEY is unset
  console.log('\n--- 3. Testing /api/speak response ---');
  const req2 = new NextRequest('http://localhost:3000/api/speak', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      text: 'Robin is a small bird known for its red breast.',
    }),
  });
  const res2 = await POST(req2);
  console.log('Status:', res2.status, 'Content-Type:', res2.headers.get('content-type'));

  if (res2.status === 200) {
    const contentType = res2.headers.get('content-type') || '';
    if (contentType.includes('audio/mpeg')) {
      console.log('✓ Received ElevenLabs MP3 audio stream.');
    } else {
      const data2 = await res2.json();
      console.log('Fallback response:', data2);
      if (!data2.fallback) {
        throw new Error('Expected fallback flag in json response when key is missing!');
      }
      console.log('✓ Received valid fallback flag for client speechSynthesis.');
    }
  } else {
    throw new Error(`Unexpected status code: ${res2.status}`);
  }

  // 4. Rate limiting headers check
  console.log('\n--- 4. Testing Rate Limit Headers ---');
  const limitHeader = res2.headers.get('X-RateLimit-Limit');
  const remainingHeader = res2.headers.get('X-RateLimit-Remaining');
  console.log(`X-RateLimit-Limit: ${limitHeader}, X-RateLimit-Remaining: ${remainingHeader}`);
  if (!limitHeader) {
    throw new Error('Missing X-RateLimit-Limit header in response!');
  }
  console.log('✓ Rate limit headers verified.');

  console.log('\nAll /api/speak tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
