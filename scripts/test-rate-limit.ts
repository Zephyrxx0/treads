import { checkRateLimit, memoryRateLimiter, extractClientIp } from '../lib/rate-limit';

async function main() {
  console.log('Testing Dual-Mode Rate Limiter...');

  // Reset in-memory rate limiter state
  memoryRateLimiter.reset();

  const testIp = '198.51.100.42';
  const mockReq = {
    headers: {
      'x-forwarded-for': testIp,
    },
  };

  // Test IP extraction
  const extracted = extractClientIp(mockReq);
  if (extracted !== testIp) {
    throw new Error(`IP extraction failed: expected ${testIp}, got ${extracted}`);
  }
  console.log(`Client IP extraction verified: ${extracted}`);

  // Test endpoint: identify quota is 30 req / 24h
  console.log('Simulating 30 valid requests to /api/identify...');
  for (let i = 1; i <= 30; i++) {
    const res = await checkRateLimit(mockReq, 'identify');
    if (!res.success) {
      throw new Error(`Request ${i} unexpectedly failed rate limit check!`);
    }
    const expectedRemaining = 30 - i;
    if (res.remaining !== expectedRemaining) {
      throw new Error(
        `Request ${i}: expected remaining ${expectedRemaining}, got ${res.remaining}`
      );
    }
    if (res.headers['X-RateLimit-Limit'] !== '30') {
      throw new Error(`Invalid X-RateLimit-Limit header: ${res.headers['X-RateLimit-Limit']}`);
    }
    if (res.headers['X-RateLimit-Remaining'] !== String(expectedRemaining)) {
      throw new Error(
        `Invalid X-RateLimit-Remaining header: ${res.headers['X-RateLimit-Remaining']}`
      );
    }
    if (!res.headers['X-RateLimit-Reset']) {
      throw new Error('Missing X-RateLimit-Reset header');
    }
  }
  console.log('30 requests succeeded with strictly decreasing remaining tokens (29 down to 0).');

  // Request 31 should fail
  console.log('Testing 31st request for token exhaustion...');
  const res31 = await checkRateLimit(mockReq, 'identify');
  if (res31.success) {
    throw new Error('Request 31 should have failed, but succeeded!');
  }
  if (res31.remaining !== 0) {
    throw new Error(`Request 31: expected remaining 0, got ${res31.remaining}`);
  }
  if (res31.headers['X-RateLimit-Remaining'] !== '0') {
    throw new Error(`Request 31 header X-RateLimit-Remaining is not 0: ${res31.headers['X-RateLimit-Remaining']}`);
  }
  if (!res31.headers['Retry-After']) {
    throw new Error('Request 31 missing Retry-After header');
  }
  console.log('Request 31 was rejected as expected with remaining: 0 and Retry-After header.');

  // Test separate IP is unaffected
  console.log('Testing that separate IP has full quota...');
  const otherReq = {
    headers: {
      'x-real-ip': '203.0.113.99',
    },
  };
  const otherRes = await checkRateLimit(otherReq, 'identify');
  if (!otherRes.success || otherRes.remaining !== 29) {
    throw new Error(`Separate IP was incorrectly limited: remaining ${otherRes.remaining}`);
  }
  console.log('Separate IP correctly received full quota (remaining: 29).');

  // Test separate endpoint quota (e.g. facts quota 60)
  const factsRes = await checkRateLimit(mockReq, 'facts');
  if (!factsRes.success || factsRes.remaining !== 59) {
    throw new Error(`Different endpoint was affected by identify limit: remaining ${factsRes.remaining}`);
  }
  console.log('Different endpoint correctly isolated (facts remaining: 59).');

  console.log('✅ Dual-Mode Rate Limiter test passed successfully!');
}

main().catch(err => {
  console.error('❌ Rate Limiter test failed:', err);
  process.exit(1);
});
