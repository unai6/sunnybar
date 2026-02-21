import { searchPlace } from '~/server/utils/nominatim'

export interface SearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  bounds: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  type: string;
}

/**
 * GET /api/search
 *
 * Search for places using Nominatim geocoding service
 *
 * Query params:
 * - q: Search query (required, minimum 3 characters)
 * - limit: Maximum number of results (optional, default: 5)
 * - lang: Accept-Language header value (optional, default: 'es,en')
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Validate query parameter
  const searchQuery = query.q as string
  if (!searchQuery || searchQuery.trim().length < 3) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Query parameter "q" is required and must be at least 3 characters'
    })
  }

  // Parse optional parameters
  const limit = query.limit ? Number.parseInt(query.limit as string, 10) : 5
  const acceptLanguage = (query.lang as string) || 'es,en'

  // Validate limit
  if (Number.isNaN(limit) || limit < 1 || limit > 20) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Limit must be a number between 1 and 20'
    })
  }

  try {
    // Call Nominatim search
    const results = await searchPlace(searchQuery, limit, acceptLanguage)

    // Transform to our format
    const searchResults: SearchResult[] = results.map((result) => ({
      id: result.place_id,
      name: result.display_name,
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
      bounds: {
        south: Number.parseFloat(result.boundingbox[0]),
        north: Number.parseFloat(result.boundingbox[1]),
        west: Number.parseFloat(result.boundingbox[2]),
        east: Number.parseFloat(result.boundingbox[3])
      },
      type: result.type
    }))

    return {
      results: searchResults,
      count: searchResults.length
    }
  } catch (error) {
    // Re-throw Nuxt errors
    if (error !== null && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Generic error
    console.error('Search API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Search failed'
    })
  }
})
