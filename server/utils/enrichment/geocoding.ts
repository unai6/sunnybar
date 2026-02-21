/**
 * Geocoding utility to enrich venue addresses
 * Uses Nominatim (OpenStreetMap) via server-side utility
 */

import { reverseGeocode } from '~/server/utils/nominatim'

/**
 * Geocode coordinates to get full address
 * Using Nominatim (free OSM service)
 */
export async function geocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<{
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  formatted?: string;
} | null> {
  try {
    // Use server-side Nominatim utility with address details
    const result = await reverseGeocode(latitude, longitude, 'es,en', true)

    if (!result) {
      return null
    }

    const addr = result.address
    if (!addr) {
      return {
        formatted: result.display_name
      }
    }

    const street = addr.house_number
      ? `${addr.road} ${addr.house_number}`
      : addr.road

    return {
      street,
      city: addr.city || addr.town || addr.village,
      postalCode: addr.postcode,
      country: addr.country,
      formatted: result.display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Add delay to respect Nominatim rate limits (1 request per second)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Batch geocode multiple venues with rate limiting
 */
export async function batchGeocodeVenues(
  venues: Array<{ latitude: number; longitude: number }>
): Promise<
  Array<{
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    formatted?: string;
  } | null>
> {
  const results = []

  for (const venue of venues) {
    const address = await geocodeCoordinates(venue.latitude, venue.longitude)
    results.push(address)

    // Rate limit: 1 request per second for Nominatim
    await delay(1100)
  }

  return results
}
