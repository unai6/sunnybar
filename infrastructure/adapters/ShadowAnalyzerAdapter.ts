import type { ShadowAnalyzerService } from '../../domain/services/ShadowAnalyzerService'
import type { Venue } from '../../domain/entities/Venue'
import type { Building } from '../../domain/entities/Building'
import type { SunPosition } from '../../domain/value-objects/SunPosition'
import { SunlightStatus, SunlightStatusType } from '../../domain/value-objects/SunlightStatus'

/**
 * Shadow Analyzer Adapter
 * Implements shadow analysis using geometric calculations
 */
export class ShadowAnalyzerAdapter implements ShadowAnalyzerService {
  private readonly NEARBY_BUILDING_RADIUS = 100 // meters

  analyzeVenue(
    venue: Venue,
    nearbyBuildings: Building[],
    sunPosition: SunPosition
  ): SunlightStatus {
    // If sun is below horizon, it's night
    if (!sunPosition.isAboveHorizon()) {
      return SunlightStatus.night()
    }

    // If no buildings nearby, assume sunny
    if (nearbyBuildings.length === 0) {
      return SunlightStatus.sunny(0.8, 'No nearby buildings detected')
    }

    const sunAzimuth = sunPosition.getAzimuthDegrees()
    const venueCoords = venue.coordinates

    // Check each building for potential shading
    let shadingBuildings = 0
    let maxConfidence = 0

    for (const building of nearbyBuildings) {
      const distance = building.coordinates.distanceTo(venueCoords)

      // Skip buildings that are too far
      if (distance > this.NEARBY_BUILDING_RADIUS) {
        continue
      }

      if (building.couldShadePoint(venueCoords, sunAzimuth, sunPosition.altitude)) {
        shadingBuildings++

        // Higher confidence if building is closer
        const distanceConfidence = 1 - (distance / this.NEARBY_BUILDING_RADIUS)
        maxConfidence = Math.max(maxConfidence, distanceConfidence)
      }
    }

    if (shadingBuildings === 0) {
      return SunlightStatus.sunny(
        0.7,
        'No buildings casting shadows on this location'
      )
    }

    if (shadingBuildings >= 3) {
      return SunlightStatus.shaded(
        maxConfidence,
        `${shadingBuildings} buildings may cast shadows`
      )
    }

    // Partial shading
    return SunlightStatus.create({
      status: SunlightStatusType.PARTIALLY_SUNNY,
      confidence: maxConfidence * 0.6,
      reason: `${shadingBuildings} building(s) may partially shade this area`
    })
  }

  analyzeVenues(
    venues: Venue[],
    buildings: Building[],
    sunPosition: SunPosition
  ): Map<string, SunlightStatus> {
    const results = new Map<string, SunlightStatus>()

    for (const venue of venues) {
      // Find buildings near this specific venue
      const nearbyBuildings = buildings.filter(
        building => building.coordinates.distanceTo(venue.coordinates) < this.NEARBY_BUILDING_RADIUS
      )

      const status = this.analyzeVenue(venue, nearbyBuildings, sunPosition)
      results.set(venue.id, status)
    }

    return results
  }
}
