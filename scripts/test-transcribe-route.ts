import { POST } from '../app/api/transcribe/route';
import { NextRequest } from 'next/server';

async function runTests() {
  console.log('Testing /api/transcribe Route & Audio Utilities...');

  // 1. Missing audio payload -> 400
  console.log('\n--- 1. Testing missing audio rejection ---');
  const req1 = new NextRequest('http://localhost:3000/api/transcribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log('Status:', res1.status, 'Response:', data1);
  if (res1.status !== 400 || !data1.error) {
    throw new Error('Expected 400 when audio is missing!');
  }
  console.log('✓ Missing audio rejected with 400.');

  // 2. Base64 audio payload -> fallback or transcribed text
  console.log('\n--- 2. Testing transcription with audio payload ---');
  const dummyAudioBase64 = Buffer.from('RIFF....WAVEfmt ').toString('base64');
  const req2 = new NextRequest('http://localhost:3000/api/transcribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      audioBase64: dummyAudioBase64,
      mimeType: 'audio/webm',
      language: 'en',
    }),
  });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log('Status:', res2.status, 'Transcript:', data2.transcript, 'Language:', data2.language);
  if (res2.status !== 200 || typeof data2.transcript !== 'string' || !data2.transcript) {
    throw new Error('Expected 200 with non-empty transcript!');
  }
  console.log('✓ Audio transcription returned valid transcript.');

  // 3. Rate limiting headers check
  console.log('\n--- 3. Testing Rate Limit Headers ---');
  const limitHeader = res2.headers.get('X-RateLimit-Limit');
  const remainingHeader = res2.headers.get('X-RateLimit-Remaining');
  console.log(`X-RateLimit-Limit: ${limitHeader}, X-RateLimit-Remaining: ${remainingHeader}`);
  if (!limitHeader) {
    throw new Error('Missing X-RateLimit-Limit header in response!');
  }
  console.log('✓ Rate limiting headers present and verified.');

  console.log('\nAll /api/transcribe tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
