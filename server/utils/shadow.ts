const DEFAULT_FLOOR_HEIGHT = 3 // meters per floor
const DEFAULT_HEIGHT = 10 // meters if nothing known

export interface Building {
  id: string
  latitude: number
  longitude: number
  height: number
}

export interface Venue {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  address?: string
  outdoor_seating?: boolean
  sunlightStatus?: 'sunny' | 'shaded' | 'partially_sunny'
}

/**
 * Parse height from OSM tags
 */
function parseHeight(tags: Record<string, string>): number | undefined {
  const heightStr = tags.height || tags['building:height']
  if (!heightStr) return undefined

  const regex = /^(\d+(?:\.\d+)?)/
  const match = regex.exec(heightStr)
  return match ? Number.parseFloat(match[1]) : undefined
}

/**
 * Parse levels from OSM tags
 */
function parseLevels(tags: Record<string, string>): number | undefined {
  const levelsStr = tags['building:levels'] || tags.levels
  if (!levelsStr) return undefined

  const levels = Number.parseInt(levelsStr, 10)
  return Number.isNaN(levels) ? undefined : levels
}

/**
 * Build address string from OSM tags
 */
function buildAddress(tags: Record<string, string>): string | undefined {
  const street = tags['addr:street']
  if (!street) return undefined

  const houseNumber = tags['addr:housenumber']
  return houseNumber ? `${street} ${houseNumber}` : street
}

/**
 * Parse buildings from Overpass response
 */
export function parseBuildings(elements: Array<{
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}>): Building[] {
  return elements
    .map(el => {
      const tags = el.tags || {}
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon

      if (!lat || !lon) return null

      let height = parseHeight(tags)
      if (!height) {
        const levels = parseLevels(tags)
        height = levels ? levels * DEFAULT_FLOOR_HEIGHT : DEFAULT_HEIGHT
      }

      return {
        id: `${el.type}/${el.id}`,
        latitude: lat,
        longitude: lon,
        height
      }
    })
    .filter((b): b is Building => b !== null)
}

/**
 * Parse venues from Overpass response
 */
export function parseVenues(elements: Array<{
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}>): Venue[] {
  const validTypes = new Set(['bar', 'restaurant', 'cafe', 'pub', 'biergarten'])

  const parsed: Venue[] = []

  for (const el of elements) {
    const tags = el.tags || {}
    if (!tags.name || !validTypes.has(tags.amenity || '')) continue

    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon

    if (!lat || !lon) continue

    parsed.push({
      id: `${el.type}/${el.id}`,
      name: tags.name,
      type: tags.amenity || 'bar',
      latitude: lat,
      longitude: lon,
      address: buildAddress(tags),
      outdoor_seating: tags.outdoor_seating === 'yes'
    })
  }

  return parsed
}

/**
 * Calculate distance between two points in meters using Haversine formula
 */
export function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
  if (angle < 0) return angle + 360
  if (angle >= 360) return angle - 360
  return angle
}

/**
 * Calculate angular difference between two angles (0-180)
 */
function angleDifference(angle1: number, angle2: number): number {
  const diff = Math.abs(angle1 - angle2)
  return diff > 180 ? 360 - diff : diff
}

/**
 * Check if a building casts shadow on a venue
 */
function buildingCastsShadow(
  venue: Venue,
  building: Building,
  shadowDirection: number,
  sunAltitudeRadians: number
): boolean {
  const shadowLength = building.height / Math.tan(sunAltitudeRadians)
  if (!Number.isFinite(shadowLength)) return false

  // Calculate direction from building to venue
  const dLat = venue.latitude - building.latitude
  const dLng = venue.longitude - building.longitude
  const angleToVenue = normalizeAngle((Math.atan2(dLng, dLat) * 180) / Math.PI)

  const angleDiff = angleDifference(angleToVenue, shadowDirection)
  const distance = distanceInMeters(venue.latitude, venue.longitude, building.latitude, building.longitude)

  return angleDiff < 45 && distance < shadowLength
}

/**
 * Analyze if a venue is shaded by nearby buildings
 */
export function analyzeVenueShadow(
  venue: Venue,
  buildings: Building[],
  sunAzimuthDegrees: number,
  sunAltitudeRadians: number
): 'sunny' | 'shaded' | 'partially_sunny' {
  // If sun is below horizon, everything is shaded
  if (sunAltitudeRadians <= 0) {
    return 'shaded'
  }

  // Shadow direction is opposite to sun azimuth
  const shadowDirection = normalizeAngle(sunAzimuthDegrees + 180)

  // Find buildings within 100m that could cast shadows
  const nearbyBuildings = buildings.filter(building => {
    const distance = distanceInMeters(
      venue.latitude,
      venue.longitude,
      building.latitude,
      building.longitude
    )
    return distance < 100 && distance > 0 // Exclude the venue's own building
  })

  if (nearbyBuildings.length === 0) {
    return 'sunny'
  }

  // Count buildings casting shadow
  const shadowingCount = nearbyBuildings.filter(building =>
    buildingCastsShadow(venue, building, shadowDirection, sunAltitudeRadians)
  ).length

  if (shadowingCount === 0) return 'sunny'
  if (shadowingCount >= 2) return 'shaded'
  return 'partially_sunny'
}
