import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateSyntheticLoop, calculateLoopDistance } from '@/lib/route';

export async function POST(req: NextRequest) {
  // 1. Rate limiting check (40 calls / day)
  const rateLimit = await checkRateLimit(req, 'route');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for route loop suggestions. Try again later.' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    const body = await req.json();
    const { lng, lat, distanceMeters = 2000 } = body;

    if (
      typeof lng !== 'number' ||
      typeof lat !== 'number' ||
      isNaN(lng) ||
      isNaN(lat) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid or missing geographical coordinates (lng, lat)' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const targetDistance = [1000, 2000, 3000].includes(distanceMeters)
      ? distanceMeters
      : 2000;

    const apiKey = process.env.ORS_API_KEY;

    // 2. Query OpenRouteService if API key is present
    if (apiKey) {
      try {
        const orsRes = await fetch(
          'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
          {
            method: 'POST',
            headers: {
              Authorization: apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coordinates: [[lng, lat]],
              options: {
                round_trip: {
                  length: targetDistance,
                  points: 5,
                  seed: Math.floor(Math.random() * 10000),
                },
              },
            }),
          }
        );

        if (orsRes.ok) {
          const geojson = await orsRes.json();
          const feature = geojson.features?.[0];
          const coords = feature?.geometry?.coordinates;
          const dist = feature?.properties?.summary?.distance;

          if (Array.isArray(coords) && coords.length > 2) {
            return NextResponse.json(
              {
                coordinates: coords,
                distanceMeters: Math.round(dist || targetDistance),
                fallback: false,
              },
              { status: 200, headers: rateLimit.headers }
            );
          }
        } else {
          console.warn('ORS API error status:', orsRes.status, await orsRes.text());
        }
      } catch (orsErr) {
        console.warn('OpenRouteService network fetch failed:', orsErr);
      }
    }

    // 3. Graceful synthetic fallback when key is absent or request failed
    const syntheticCoords = generateSyntheticLoop(lng, lat, targetDistance);
    const measuredDistance = calculateLoopDistance(syntheticCoords);

    return NextResponse.json(
      {
        coordinates: syntheticCoords,
        distanceMeters: Math.round(measuredDistance),
        fallback: true,
        message:
          'ORS_API_KEY not configured or offline. Generated local synthetic pedestrian loop.',
      },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (err: any) {
    console.error('Route loop generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal route generation error' },
      { status: 500, headers: rateLimit.headers }
    );
  }
}
