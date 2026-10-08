/**
 * Mathematical Geolocation & GPS Filtering Utilities
 * Implements GPS-01, D-05, D-06, D-07, and trail bounding box calculations.
 */

export interface TrackPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Calculates exact geodesic distance between two coordinate pairs in meters
 * using the Haversine formula (Earth radius 6,371,000 meters).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formats distance into compact, human-readable strings suitable for tabular digits.
 * Displays meters below 1000m (e.g. "450 m") and kilometers at or above (e.g. "3.24 km").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Formats duration in seconds into "MM:SS" (or "HH:MM:SS" if duration >= 1 hour).
 */
export function formatDuration(seconds: number): string {
  const totalSecs = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export type TrackPointRejectionReason = 'accuracy_too_low' | 'stationary_jitter';

export interface ShouldRecordResult {
  record: boolean;
  reason?: TrackPointRejectionReason;
  distanceFromLastMeters?: number;
}

/**
 * Evaluates whether a new GPS fix should be added to the active walk trail:
 * 1. Rejects readings with accuracy > 35m (per D-05 and GPS-01).
 * 2. Accepts initial fix unconditionally.
 * 3. Ignores stationary micro-displacements (< 5m unless >= 15s elapsed) (per D-06 and GPS-01).
 */
export function shouldRecordTrackPoint(
  newPoint: TrackPoint,
  lastPoint: TrackPoint | null
): ShouldRecordResult {
  // Rule 1: Reject degraded accuracy (> 35m)
  if (newPoint.accuracy > 35) {
    return { record: false, reason: 'accuracy_too_low' };
  }

  // Initial fix
  if (!lastPoint) {
    return { record: true };
  }

  const distance = calculateHaversineDistance(
    lastPoint.lat,
    lastPoint.lng,
    newPoint.lat,
    newPoint.lng
  );

  const timeElapsedMs = newPoint.timestamp - lastPoint.timestamp;

  // Rule 2: Ignore displacement < 5m unless 15 seconds have elapsed
  if (distance < 5 && timeElapsedMs < 15000) {
    return {
      record: false,
      reason: 'stationary_jitter',
      distanceFromLastMeters: distance,
    };
  }

  return {
    record: true,
    distanceFromLastMeters: distance,
  };
}

/**
 * Calculates [[minLng, minLat], [maxLng, maxLat]] bounding box for MapLibre fitBounds.
 * Returns null if points array is empty.
 */
export function calculateTrailBounds(
  points: Array<{ lat: number; lng: number }>
): [[number, number], [number, number]] | null {
  if (!points || points.length === 0) {
    return null;
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
