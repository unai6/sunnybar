import {
  buildCombinedQuery,
  executeOverpassQuery
} from '~/server/utils/overpass'
import {
  analyzeVenueShadow,
  parseBuildings,
  parseVenues,
  type Venue
} from '~/server/utils/shadow'
import { calculateSunPosition } from '~/server/utils/sun'
import {
  bulkUpsertVenuesFromOverpass,
  findVenuesInBounds,
  hasCachedData
} from '~/server/utils/db/venues'

/**
 * GET /api/venues
 *
 * Fetches venues with sun/shadow analysis for a bounding box.
 * Uses hybrid approach: DB cache first, fallback to Overpass
 *
 * Query params:
 * - south: southern latitude
 * - west: western longitude
 * - north: northern latitude
 * - east: eastern longitude
 * - datetime: ISO timestamp (optional, defaults to now)
 * - fresh: boolean (optional, force Overpass fetch)
 */
export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)

    // Parse and validate bbox
    const south = Number.parseFloat(query.south as string)
    const west = Number.parseFloat(query.west as string)
    const north = Number.parseFloat(query.north as string)
    const east = Number.parseFloat(query.east as string)
    const forceFresh = query.fresh === 'true'

    if (
      Number.isNaN(south) ||
      Number.isNaN(west) ||
      Number.isNaN(north) ||
      Number.isNaN(east)
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Invalid bounding box. Required params: south, west, north, east'
      })
    }

    // Validate bbox size (prevent huge queries)
    const MAX_BBOX_DEGREES = 0.05
    const latDiff = north - south
    const lonDiff = east - west
    if (latDiff > MAX_BBOX_DEGREES || lonDiff > MAX_BBOX_DEGREES) {
      throw createError({
        statusCode: 400,
        statusMessage: `Bounding box too large. Max ${MAX_BBOX_DEGREES} degrees (~5km)`
      })
    }

    // Parse datetime or use now
    const parsedDate = query.datetime
      ? new Date(query.datetime as string)
      : null
    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid datetime format. Expected ISO 8601 string.'
      })
    }
    const datetime = parsedDate ?? new Date()

    const bounds = { south, west, north, east }

    // HYBRID FLOW: Check DB first (Option A)
    let venues: Venue[] = []
    let buildings: Building[] = []
    let dataSource = 'cache'

    // Try to get cached data from DB if not forcing fresh
    if (!forceFresh) {
      const hasCache = await hasCachedData(bounds, 7) // 7 days cache
      if (hasCache) {
        console.info('[API] Using cached venues from DB')
        const cachedVenues = await findVenuesInBounds(bounds)

        // Convert DB venues to API format
        venues = cachedVenues.map((v) => ({
          id: v.venueId,
          name: v.name,
          type: v.venueType,
          latitude: v.latitude,
          longitude: v.longitude,
          outdoor_seating: v.outdoorSeating,
          address: v.address?.formatted,
          sunlightStatus: undefined // Will be calculated below
        }))

        dataSource = 'db-cache'
      }
    }

    // Fetch from Overpass if no cache or forced fresh
    if (venues.length === 0 || forceFresh) {
      console.info('[API] Fetching fresh data from Overpass')
      dataSource = 'overpass'

      // Fetch venues and buildings in a single combined query
      const response = await executeOverpassQuery(
        buildCombinedQuery(south, west, north, east)
      )

      // Parse response: filter elements by type
      const venueElements = response.elements.filter(
        (el) => el.type === 'node' && el.tags?.amenity
      )
      const buildingElements = response.elements.filter(
        (el) => el.type === 'way' && el.tags?.building
      )

      venues = parseVenues(venueElements)
      buildings = parseBuildings(buildingElements)

      // Save to DB asynchronously (don't wait)
      if (venues.length > 0) {
        bulkUpsertVenuesFromOverpass(
          venues.map((v) => ({
            osmId: v.id,
            osmType: 'node',
            name: v.name,
            venueType: v.type,
            latitude: v.latitude,
            longitude: v.longitude,
            outdoorSeating: v.outdoor_seating
          }))
        ).catch((error) => {
          console.error('[API] Failed to save venues to DB:', error)
        })
      }
    }

    console.info(
      `[API] Processed ${venues.length} venues from ${dataSource}, ${buildings.length} buildings`
    )

    // Calculate sun position for the center of bbox
    const centerLat = (south + north) / 2
    const centerLon = (west + east) / 2
    const sunPosition = calculateSunPosition(centerLat, centerLon, datetime)

    // Analyze shadow for each venue (always real-time based on current datetime)
    const venuesWithShadow: Venue[] = venues.map((venue) => ({
      ...venue,
      sunlightStatus: analyzeVenueShadow(
        venue,
        buildings,
        sunPosition.azimuthDegrees,
        sunPosition.altitudeRadians
      )
    }))

    // Set compression hint for faster response
    setResponseHeader(event, 'Content-Type', 'application/json')

    // Return venues with shadow analysis
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
        venueCount: venues.length,
        dataSource
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
      const dt = query.datetime
        ? new Date(query.datetime as string)
        : new Date()
      const timeKey = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}`
      return `venues:${south},${west},${north},${east}:${timeKey}`
    },
    // Cache for 20 minutes (venues/buildings don't change frequently)
    maxAge: 60 * 20,
    // Aggressive stale-while-revalidate for better UX (serve cached while fetching new)
    staleMaxAge: 60 * 30,
    // Enable compression for cached responses
    shouldBypassCache: () => false
  }
)
