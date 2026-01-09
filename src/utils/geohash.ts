/**
 * Geohash utility functions.
 */
import geohash from 'ngeohash';

/**
 * Calculate geohash from latitude and longitude.
 */
export function encodeGeohash(latitude: number, longitude: number, precision: number = 5): string {
  return geohash.encode(latitude, longitude, precision);
}

/**
 * Calculate multiple geohashes covering a bounding box.
 */
export function calculateGeohashes(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
  precision: number = 5
): string[] {
  const geohashes = new Set<string>();
  
  // Calculate step size based on precision
  const latStep = 0.045; // ~5km
  const lonStep = 0.045; // ~5km
  
  // Generate grid of geohashes
  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lon = minLon; lon <= maxLon; lon += lonStep) {
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        const hash = encodeGeohash(lat, lon, precision);
        geohashes.add(hash);
      }
    }
  }
  
  return Array.from(geohashes);
}

/**
 * Decode geohash to latitude and longitude.
 */
export function decodeGeohash(hash: string): { latitude: number; longitude: number } {
  const coords = geohash.decode(hash);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

