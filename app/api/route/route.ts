import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  generateSyntheticLoop,
  generateSyntheticWaypointsRoute,
  calculateLoopDistance,
} from '@/lib/route';

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
    const {
      lng,
      lat,
      distanceMeters = 2000,
      seed,
      points = 3, // Default to 3 vertices for least turns (triangle loop)
      stops,
      start,
      finish,
    } = body;

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

    const targetDistance = typeof distanceMeters === 'number' && distanceMeters > 0
      ? distanceMeters
      : 2000;

    const apiKey = process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API_KEY;

    // Check if user requested custom waypoints / stops
    const hasCustomStops = Array.isArray(stops) && stops.length > 0;
    const hasCustomStartOrFinish = Array.isArray(start) || Array.isArray(finish);
    const isCustomWaypoints = hasCustomStops || hasCustomStartOrFinish;

    // 2. Query OpenRouteService if API key is present
    if (apiKey) {
      try {
        if (isCustomWaypoints) {
          const startPt = (Array.isArray(start) && start.length === 2 ? start : [lng, lat]) as [number, number];
          const finishPt = (Array.isArray(finish) && finish.length === 2 ? finish : startPt) as [number, number];
          const waypoints = [startPt, ...(hasCustomStops ? stops : []), finishPt];

          const requestBody = {
            coordinates: waypoints,
            preference: 'recommended',
          };

          const orsRes = await fetch(
            'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
            {
              method: 'POST',
              headers: {
                Authorization: apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
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
          }
        } else {
          // Automatic pedestrian loop with least turns (points: 3)
          // Validate route distance: test alternative seeds if ORS deviates excessively (e.g. 4.3km for 1km target)
          const baseSeed = typeof seed === 'number' ? seed : Math.floor(Math.random() * 100000);
          const seedCandidates = [
            baseSeed,
            (baseSeed + 31) % 100000,
            (baseSeed + 79) % 100000,
          ];

          let bestCoords: [number, number][] | null = null;
          let bestDistance: number = 0;
          let bestDiff: number = Infinity;

          for (const candSeed of seedCandidates) {
            const requestBody = {
              coordinates: [[lng, lat]],
              preference: 'recommended',
              options: {
                round_trip: {
                  length: targetDistance,
                  points: Math.max(3, Math.min(points, 5)), // 3 vertices = fewest turns
                  seed: candSeed,
                },
              },
            };

            const orsRes = await fetch(
              'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
              {
                method: 'POST',
                headers: {
                  Authorization: apiKey,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              }
            );

            if (!orsRes.ok) continue;

            const geojson = await orsRes.json();
            const feature = geojson.features?.[0];
            const coords = feature?.geometry?.coordinates;
            const dist = feature?.properties?.summary?.distance;

            if (Array.isArray(coords) && coords.length > 2 && typeof dist === 'number') {
              const diff = Math.abs(dist - targetDistance);
              if (diff < bestDiff) {
                bestDiff = diff;
                bestCoords = coords;
                bestDistance = dist;
              }

              // Accept immediately if within 30% of target distance
              if (diff / targetDistance <= 0.30) {
                break;
              }
            }
          }

          // If the best candidate route is within 35% tolerance of target distance
          if (bestCoords && bestDiff / targetDistance <= 0.35) {
            return NextResponse.json(
              {
                coordinates: bestCoords,
                distanceMeters: Math.round(bestDistance),
                fallback: false,
              },
              { status: 200, headers: rateLimit.headers }
            );
          }
          // If best ORS route still deviates > 35% (e.g. highway forced 4.3 km detour for 1 km request),
          // fall through to synthetic loop generator which guarantees exact target distance!
        }
      } catch (orsErr) {
        console.warn('OpenRouteService network fetch failed:', orsErr);
      }
    }

    // 3. Graceful synthetic fallback when key is absent or ORS distance severely deviates
    let syntheticCoords: [number, number][];

    if (isCustomWaypoints) {
      const startPt = (Array.isArray(start) && start.length === 2 ? start : [lng, lat]) as [number, number];
      const finishPt = (Array.isArray(finish) && finish.length === 2 ? finish : startPt) as [number, number];
      const waypoints = [startPt, ...(hasCustomStops ? stops : []), finishPt];
      syntheticCoords = generateSyntheticWaypointsRoute(waypoints);
    } else {
      syntheticCoords = generateSyntheticLoop(
        lng,
        lat,
        targetDistance,
        typeof seed === 'number' ? seed : undefined
      );
    }

    const measuredDistance = calculateLoopDistance(syntheticCoords);

    return NextResponse.json(
      {
        coordinates: syntheticCoords,
        distanceMeters: Math.round(measuredDistance),
        fallback: true,
        message: apiKey
          ? 'Local street barriers caused severe pedestrian detour. Calibrated loop to match your selected distance.'
          : 'ORS_API_KEY not configured or offline. Generated local synthetic pedestrian loop.',
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

