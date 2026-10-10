import { calculateHaversineDistance } from '@/lib/geo';

/**
 * Generates an organic, closed circular walking loop geometry around origin coordinates.
 * Used as a dependable local fallback when ORS API key is unset or network is offline.
 *
 * @param centerLng Starting longitude
 * @param centerLat Starting latitude
 * @param targetMeters Target perimeter in meters (e.g. 1000, 2000, 3000)
 * @returns Array of [lng, lat] coordinate pairs forming a closed loop
 */
export function generateSyntheticLoop(
  centerLng: number,
  centerLat: number,
  targetMeters: number,
  seed?: number
): [number, number][] {
  // Approximate radius for a circle with circumference = targetMeters
  const radiusMeters = targetMeters / (2 * Math.PI);

  // Degrees conversion
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

  const numPoints = 28;
  const coordinates: [number, number][] = [];

  // Rotate starting direction based on seed (allows cycling diverse loops)
  const baseAngle = typeof seed === 'number' ? (seed % 360) * (Math.PI / 180) : 0;

  // Start with exact origin point
  coordinates.push([centerLng, centerLat]);

  for (let i = 1; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Gentle perturbation with minimum turns
    const perturbation = 1 + 0.02 * Math.sin(angle);
    const r = radiusMeters * perturbation;

    // Offset coordinates rotated by baseAngle
    const rotatedAngle = angle + baseAngle;
    const dLat = (r * Math.sin(rotatedAngle)) / metersPerDegreeLat;
    const dLng = (r * (1 - Math.cos(rotatedAngle))) / metersPerDegreeLng;

    const lat = centerLat + dLat;
    const lng = centerLng + dLng;

    coordinates.push([lng, lat]);
  }

  // Close the loop back at the origin point
  coordinates.push([centerLng, centerLat]);

  return coordinates;
}

/**
 * Connects arbitrary waypoints into an interpolated polyline path
 * when routing through custom stops without ORS access.
 */
export function generateSyntheticWaypointsRoute(
  waypoints: [number, number][]
): [number, number][] {
  if (waypoints.length < 2) return waypoints;
  const coordinates: [number, number][] = [];
  const stepsPerLeg = 10;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    for (let step = 0; step < stepsPerLeg; step++) {
      const t = step / stepsPerLeg;
      coordinates.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }
  coordinates.push(waypoints[waypoints.length - 1]);
  return coordinates;
}

/**
 * Calculates total route line distance in meters using Haversine formula.
 */
export function calculateLoopDistance(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    totalDistance += calculateHaversineDistance(lat1, lon1, lat2, lon2);
  }
  return totalDistance;
}

