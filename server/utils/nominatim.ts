/**
 * Nominatim API utility for geocoding and place search
 */

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  type: string;
  importance: number;
}

interface NominatimReverseResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'SunBar/1.0'
const REQUEST_TIMEOUT_MS = 5000

/**
 * Search for a place by name
 * @param query Search query (e.g., "La Rambla Barcelona")
 * @param limit Maximum number of results (default: 5)
 * @param acceptLanguage Preferred language for results (default: 'es,en')
 * @returns Array of search results
 */
export async function searchPlace(
  query: string,
  limit = 5,
  acceptLanguage = 'es,en'
): Promise<NominatimSearchResult[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', limit.toString())
    url.searchParams.set('accept-language', acceptLanguage)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Nominatim search failed: ${response.statusText}`
      })
    }

    const data = (await response.json()) as NominatimSearchResult[]
    return data
  } catch (error) {
    // Handle abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Nominatim search timeout'
      })
    }

    // Re-throw Nuxt errors
    if (error !== null && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Generic error
    console.error('Nominatim search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Nominatim search failed'
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Reverse geocode: get address from coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @param acceptLanguage Preferred language for results (default: 'es,en')
 * @param addressDetails Include detailed address components (default: false)
 * @returns Address information
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  acceptLanguage = 'es,en',
  addressDetails = false
): Promise<NominatimReverseResult | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/reverse`)
    url.searchParams.set('lat', latitude.toString())
    url.searchParams.set('lon', longitude.toString())
    url.searchParams.set('format', 'json')
    url.searchParams.set('accept-language', acceptLanguage)

    if (addressDetails) {
      url.searchParams.set('addressdetails', '1')
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    })

    if (!response.ok) {
      // Not found is acceptable for reverse geocoding
      if (response.status === 404) {
        return null
      }

      throw createError({
        statusCode: response.status,
        statusMessage: `Nominatim reverse geocode failed: ${response.statusText}`
      })
    }

    const data = (await response.json()) as NominatimReverseResult
    return data
  } catch (error) {
    // Handle abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Nominatim reverse geocode timeout'
      })
    }

    // Re-throw Nuxt errors
    if (error !== null && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Generic error
    console.error('Nominatim reverse geocode error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Nominatim reverse geocode failed'
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
