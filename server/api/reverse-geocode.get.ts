import { reverseGeocode } from '~/server/utils/nominatim'

/**
 * GET /api/reverse-geocode
 *
 * Reverse geocode: get address from coordinates using Nominatim
 *
 * Query params:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 * - lang: Accept-Language header value (optional, default: 'es,en')
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Parse and validate coordinates
  const lat = Number.parseFloat(query.lat as string)
  const lon = Number.parseFloat(query.lon as string)

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid "lat" and "lon" query parameters are required'
    })
  }

  // Validate coordinate ranges
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Coordinates out of valid range'
    })
  }

  // Parse optional parameters
  const acceptLanguage = (query.lang as string) || 'es,en'

  try {
    // Call Nominatim reverse geocode
    const result = await reverseGeocode(lat, lon, acceptLanguage)

    if (!result) {
      return {
        address: null,
        found: false
      }
    }

    return {
      address: result.display_name,
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
      found: true
    }
  } catch (error) {
    // Re-throw Nuxt errors
    if (error !== null && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Generic error
    console.error('Reverse geocode API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Reverse geocoding failed'
    })
  }
})
