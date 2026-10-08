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
  targetMeters: number
): [number, number][] {
  // Approximate radius for a circle with circumference = targetMeters
  const radiusMeters = targetMeters / (2 * Math.PI);

  // Degrees conversion
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

  const numPoints = 28;
  const coordinates: [number, number][] = [];

  // Start with exact origin point
  coordinates.push([centerLng, centerLat]);

  for (let i = 1; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Organic perturbation so it's not a rigid mechanical circle
    const perturbation = 1 + 0.08 * Math.sin(3 * angle) + 0.04 * Math.cos(5 * angle);
    const r = radiusMeters * perturbation;

    // Offset coordinates slightly so the start is tangent to the circle
    const dLat = (r * Math.sin(angle)) / metersPerDegreeLat;
    const dLng = (r * (1 - Math.cos(angle))) / metersPerDegreeLng;

    const lat = centerLat + dLat;
    const lng = centerLng + dLng;

    coordinates.push([lng, lat]);
  }

  // Close the loop back at the origin point
  coordinates.push([centerLng, centerLat]);

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
