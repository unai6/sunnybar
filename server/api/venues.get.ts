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

    // Fetch venues and buildings in a single combined query (faster)
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

    const venues = parseVenues(venueElements)
    const buildings = parseBuildings(buildingElements)

    console.info(
      `[API] Processed ${venues.length} venues, ${buildings.length} buildings`
    )

    // Calculate sun position for the center of bbox
    const centerLat = (south + north) / 2
    const centerLon = (west + east) / 2
    const sunPosition = calculateSunPosition(centerLat, centerLon, datetime)

    // Analyze shadow for each venue
    const venuesWithShadow: Venue[] = venues.map((venue) => ({
      ...venue,
      sunlightStatus: analyzeVenueShadow(
        venue,
        buildings,
        sunPosition.azimuthDegrees,
        sunPosition.altitudeRadians
      )
    }))

    // Return venues with shadow analysis only (no ArcGIS enrichment)
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
      const dt = query.datetime
        ? new Date(query.datetime as string)
        : new Date()
      const timeKey = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}`
      return `venues:${south},${west},${north},${east}:${timeKey}`
    },
    // Cache for 15 minutes (venues don't change frequently)
    maxAge: 60 * 15,
    // Stale while revalidate for 5 minutes
    staleMaxAge: 60 * 5
  }
)
