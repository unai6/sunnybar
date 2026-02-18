import { executeOverpassQuery, buildVenueQuery, buildBuildingQuery } from '~/server/utils/overpass'
import { calculateSunPosition } from '~/server/utils/sun'
import { parseVenues, parseBuildings, analyzeVenueShadow, type Venue } from '~/server/utils/shadow'

/**
 * GET /api/venues
 *
 * Fetches venues with sun/shadow analysis for a bounding box.
 * Results are cached for 5 minutes per unique bbox.
 *
 * Query params:
 * - south: southern latitude
 * - west: western longitude
 * - north: northern latitude
 * - east: eastern longitude
 * - datetime: ISO timestamp (optional, defaults to now)
 */
export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)

    // Parse and validate bbox
    const south = Number.parseFloat(query.south as string)
    const west = Number.parseFloat(query.west as string)
    const north = Number.parseFloat(query.north as string)
    const east = Number.parseFloat(query.east as string)

    if (Number.isNaN(south) || Number.isNaN(west) || Number.isNaN(north) || Number.isNaN(east)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid bounding box. Required params: south, west, north, east'
      })
    }

    // Validate bbox size (prevent huge queries)
    const latDiff = north - south
    const lonDiff = east - west
    if (latDiff > 0.05 || lonDiff > 0.05) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bounding box too large. Max 0.05 degrees (~5km)'
      })
    }

    // Parse datetime or use now
    const datetime = query.datetime
      ? new Date(query.datetime as string)
      : new Date()

    console.log(`[API] Fetching venues for bbox: ${south},${west},${north},${east}`)

    // Fetch venues and buildings in parallel from Overpass
    const [venuesResponse, buildingsResponse] = await Promise.all([
      executeOverpassQuery(buildVenueQuery(south, west, north, east)),
      executeOverpassQuery(buildBuildingQuery(south, west, north, east))
    ])

    // Parse responses
    const venues = parseVenues(venuesResponse.elements)
    const buildings = parseBuildings(buildingsResponse.elements)

    console.log(`[API] Found ${venues.length} venues and ${buildings.length} buildings`)

    // Calculate sun position for the center of bbox
    const centerLat = (south + north) / 2
    const centerLon = (west + east) / 2
    const sunPosition = calculateSunPosition(centerLat, centerLon, datetime)

    // Analyze shadow for each venue
    const venuesWithShadow: Venue[] = venues.map(venue => ({
      ...venue,
      sunlightStatus: analyzeVenueShadow(
        venue,
        buildings,
        sunPosition.azimuthDegrees,
        sunPosition.altitudeRadians
      )
    }))

    return {
      venues: venuesWithShadow,
      sunPosition: {
        azimuth: sunPosition.azimuthDegrees,
        altitude: sunPosition.altitudeDegrees,
        isDaytime: sunPosition.altitudeRadians > 0
      },
      meta: {
        timestamp: datetime.toISOString(),
        buildingsAnalyzed: buildings.length,
        venueCount: venues.length
      }
    }
  },
  {
    // Cache key based on bbox (rounded to 4 decimals)
    getKey: (event) => {
      const query = getQuery(event)
      const south = Number.parseFloat(query.south as string).toFixed(4)
      const west = Number.parseFloat(query.west as string).toFixed(4)
      const north = Number.parseFloat(query.north as string).toFixed(4)
      const east = Number.parseFloat(query.east as string).toFixed(4)
      // Include datetime in cache key so sun position updates per requested time
      const dt = query.datetime ? new Date(query.datetime as string) : new Date()
      const timeKey = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}`
      return `venues:${south},${west},${north},${east}:${timeKey}`
    },
    // Cache for 5 minutes
    maxAge: 60 * 5,
    // Stale while revalidate for 1 minute
    staleMaxAge: 60
  }
)
