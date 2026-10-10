import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitEndpoint =
  | 'identify'
  | 'facts'
  | 'transcribe'
  | 'speak'
  | 'route'
  | 'spike'
  | 'dispatch';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  headers: Record<string, string>;
}

export const ENDPOINT_QUOTAS: Record<
  RateLimitEndpoint,
  { limit: number; windowSeconds: number }
> = {
  identify: { limit: 30, windowSeconds: 86400 },
  facts: { limit: 60, windowSeconds: 86400 },
  transcribe: { limit: 30, windowSeconds: 86400 },
  speak: { limit: 40, windowSeconds: 86400 },
  route: { limit: 40, windowSeconds: 86400 },
  spike: { limit: 60, windowSeconds: 86400 },
  dispatch: { limit: 40, windowSeconds: 86400 },
};

interface TokenBucket {
  tokens: number;
  resetAt: number; // timestamp in ms
  lastRefill: number; // timestamp in ms
}

export class MemoryRateLimiter {
  private buckets = new Map<string, TokenBucket>();

  public check(
    key: string,
    limit: number,
    windowSeconds: number
  ): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Periodic cleanup of expired buckets
    this.evictStaleBuckets(now);

    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = {
        tokens: limit - 1,
        resetAt: now + windowMs,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
      return {
        success: true,
        remaining: bucket.tokens,
        reset: Math.ceil(bucket.resetAt / 1000),
      };
    }

    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return {
        success: true,
        remaining: bucket.tokens,
        reset: Math.ceil(bucket.resetAt / 1000),
      };
    }

    return {
      success: false,
      remaining: 0,
      reset: Math.ceil(bucket.resetAt / 1000),
    };
  }

  public reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }

  private evictStaleBuckets(now: number): void {
    if (this.buckets.size < 100) return;
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.resetAt > 86400_000) {
        this.buckets.delete(key);
      }
    }
  }
}

export const memoryRateLimiter = new MemoryRateLimiter();

let devNoticeLogged = false;
const upstashLimiters = new Map<RateLimitEndpoint, Ratelimit>();

function getUpstashLimiter(endpoint: RateLimitEndpoint): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!devNoticeLogged) {
      console.info('[RateLimit] Using in-memory rate limiter (dev mode)');
      devNoticeLogged = true;
    }
    return null;
  }

  if (!upstashLimiters.has(endpoint)) {
    try {
      const redis = new Redis({ url, token });
      const quota = ENDPOINT_QUOTAS[endpoint];
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(quota.limit, `${quota.windowSeconds} s`),
        prefix: `treads:ratelimit:${endpoint}`,
      });
      upstashLimiters.set(endpoint, limiter);
    } catch (err) {
      console.warn('[RateLimit] Failed to initialize Upstash Redis limiter, falling back to memory:', err);
      return null;
    }
  }

  return upstashLimiters.get(endpoint) ?? null;
}

export function extractClientIp(req: Request | { headers: Headers | Record<string, string> }): string {
  let headers: { get: (name: string) => string | null | undefined };

  if ('headers' in req && typeof (req.headers as Headers).get === 'function') {
    headers = req.headers as Headers;
  } else if ('headers' in req && typeof req.headers === 'object') {
    const rawHeaders = req.headers as Record<string, string>;
    headers = {
      get: (name: string) =>
        rawHeaders[name.toLowerCase()] ||
        rawHeaders[name] ||
        null,
    };
  } else {
    return '127.0.0.1';
  }

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

export async function checkRateLimit(
  req: Request | { headers: Headers | Record<string, string> },
  endpoint: RateLimitEndpoint
): Promise<RateLimitResult> {
  const quota = ENDPOINT_QUOTAS[endpoint];
  const ip = extractClientIp(req);
  const upstash = getUpstashLimiter(endpoint);

  if (upstash) {
    try {
      const res = await upstash.limit(ip);
      const remaining = res.remaining;
      const reset = Math.ceil(res.reset / 1000);
      const headers: Record<string, string> = {
        'X-RateLimit-Limit': String(quota.limit),
        'X-RateLimit-Remaining': String(Math.max(0, remaining)),
        'X-RateLimit-Reset': String(reset),
      };

      if (!res.success) {
        const retryAfter = Math.max(1, reset - Math.floor(Date.now() / 1000));
        headers['Retry-After'] = String(retryAfter);
      }

      return {
        success: res.success,
        limit: quota.limit,
        remaining,
        reset,
        headers,
      };
    } catch (err) {
      console.warn('[RateLimit] Upstash limit error, falling back to in-memory:', err);
    }
  }

  // Fallback to in-memory limiter
  const key = `${endpoint}:${ip}`;
  const mem = memoryRateLimiter.check(key, quota.limit, quota.windowSeconds);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(quota.limit),
    'X-RateLimit-Remaining': String(Math.max(0, mem.remaining)),
    'X-RateLimit-Reset': String(mem.reset),
  };

  if (!mem.success) {
    const retryAfter = Math.max(1, mem.reset - Math.floor(Date.now() / 1000));
    headers['Retry-After'] = String(retryAfter);
  }

  return {
    success: mem.success,
    limit: quota.limit,
    remaining: mem.remaining,
    reset: mem.reset,
    headers,
  };
}
