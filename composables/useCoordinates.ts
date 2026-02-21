import type { Coordinates } from '~/shared/types'

/**
 * useCoordinates Composable
 * Provides utilities for working with geographic coordinates
 */
export function useCoordinates() {
  /**
   * Create coordinates with validation
   */
  function create(latitude: number, longitude: number): Coordinates {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90')
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180')
    }
    return { latitude, longitude }
  }

  /**
   * Convert coordinates to [lat, lng] array
   */
  function toArray(coords: Coordinates): [number, number] {
    return [coords.latitude, coords.longitude]
  }

  /**
   * Convert coordinates to {lat, lng} object
   */
  function toLatLng(coords: Coordinates): { lat: number; lng: number } {
    return { lat: coords.latitude, lng: coords.longitude }
  }

  /**
   * Check if two coordinates are equal
   */
  function areEqual(a: Coordinates, b: Coordinates): boolean {
    return a.latitude === b.latitude && a.longitude === b.longitude
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  function calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (from.latitude * Math.PI) / 180
    const φ2 = (to.latitude * Math.PI) / 180
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  return {
    create,
    toArray,
    toLatLng,
    areEqual,
    calculateDistance
  }
}
