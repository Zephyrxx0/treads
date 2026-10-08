import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export async function GET(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, 'spike');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const startTime = Date.now();
  try {
    const res = await fetch(OPENFREEMAP_STYLE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Timeout after 5 seconds to prevent hanging
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return NextResponse.json(
        {
          status: 'error',
          styleUrl: OPENFREEMAP_STYLE_URL,
          latencyMs,
          httpStatus: res.status,
          error: `HTTP ${res.status} ${res.statusText}`,
        },
        { status: 502, headers: rateLimit.headers }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        styleUrl: OPENFREEMAP_STYLE_URL,
        latencyMs,
      },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'error',
        styleUrl: OPENFREEMAP_STYLE_URL,
        latencyMs,
        error: error?.message || 'Failed to connect to OpenFreeMap style server',
      },
      { status: 504, headers: rateLimit.headers }
    );
  }
}
